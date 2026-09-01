"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";
import { logAudit } from "@/lib/audit";
import { MILESTONE_TEMPLATE } from "@/lib/milestones";

const MAX_PROPOSALS = 3;

const proposeSchema = z.object({
  title: z.string().min(4, "Give your topic a real title."),
});

export type ProposeTopicState = { error?: string; success?: boolean };

export async function proposeTopic(_prev: ProposeTopicState, formData: FormData): Promise<ProposeTopicState> {
  const session = await auth();
  if (!session?.user || session.user.role !== "STUDENT") {
    return { error: "Only students can propose a topic." };
  }

  const existingProject = await prisma.project.findFirst({ where: { studentId: session.user.id } });
  if (existingProject) return { error: "You already have an approved project." };

  const count = await prisma.topicProposal.count({ where: { studentId: session.user.id } });
  if (count >= MAX_PROPOSALS) {
    return { error: `You can only track up to ${MAX_PROPOSALS} proposed topics.` };
  }

  const parsed = proposeSchema.safeParse({ title: formData.get("title") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const student = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!student?.pendingSupervisorId) {
    return { error: "You don't have a supervisor assigned yet. Contact your department." };
  }

  await prisma.topicProposal.create({
    data: { studentId: session.user.id, title: parsed.data.title },
  });

  await notify(
    student.pendingSupervisorId,
    `${session.user.name} proposed a project topic: "${parsed.data.title}".`,
    "/lecturer/students"
  );

  revalidatePath("/student/project-approval");
  return { success: true };
}

export async function deleteProposal(proposalId: string) {
  const session = await auth();
  if (!session?.user) return { error: "Not signed in." };

  const proposal = await prisma.topicProposal.findUnique({ where: { id: proposalId } });
  if (!proposal || proposal.studentId !== session.user.id) return { error: "Not your proposal." };
  if (proposal.status !== "PENDING") return { error: "Only pending proposals can be deleted." };

  await prisma.topicProposal.delete({ where: { id: proposalId } });
  revalidatePath("/student/project-approval");
  return { success: true };
}

export async function decideProposal(proposalId: string, decision: "APPROVED" | "REJECTED") {
  const session = await auth();
  if (!session?.user || session.user.role !== "LECTURER") {
    return { error: "Only lecturers can decide on a topic proposal." };
  }

  const proposal = await prisma.topicProposal.findUnique({
    where: { id: proposalId },
    include: { student: true },
  });
  if (!proposal) return { error: "Proposal not found." };
  if (proposal.student.pendingSupervisorId !== session.user.id) {
    return { error: "You don't supervise this student." };
  }
  if (proposal.status !== "PENDING") return { error: "This proposal was already decided." };

  await prisma.topicProposal.update({
    where: { id: proposalId },
    data: { status: decision, decidedAt: new Date() },
  });

  if (decision === "APPROVED") {
    const existing = await prisma.project.findFirst({ where: { studentId: proposal.studentId } });
    if (!existing) {
      const project = await prisma.project.create({
        data: {
          title: proposal.title,
          studentId: proposal.studentId,
          supervisorId: session.user.id,
          departmentId: proposal.student.departmentId,
          milestones: {
            create: MILESTONE_TEMPLATE.map((name, i) => ({ name, order: i + 1 })),
          },
        },
      });

      await prisma.topicProposal.updateMany({
        where: { studentId: proposal.studentId, status: "PENDING", id: { not: proposalId } },
        data: { status: "REJECTED", decidedAt: new Date() },
      });

      await logAudit({
        actorId: session.user.id,
        projectId: project.id,
        action: "PROJECT_CREATED",
        description: `${session.user.name} approved "${proposal.title}" and created the project.`,
      });
    }
    await notify(proposal.studentId, `Your topic "${proposal.title}" was approved. Head to My Project to get started.`, "/student/project");
  } else {
    await notify(proposal.studentId, `Your topic "${proposal.title}" was not approved. Propose another topic when you're ready.`, "/student/project-approval");
  }

  revalidatePath("/student/project-approval");
  revalidatePath("/lecturer/students");
  revalidatePath("/lecturer");
  return { success: true };
}
