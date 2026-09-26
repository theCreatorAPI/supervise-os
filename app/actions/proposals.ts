"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";
import { logAudit } from "@/lib/audit";
import { MILESTONE_TEMPLATE } from "@/lib/milestones";

const GENERIC_ERROR = "Something went wrong. Please try again.";
/**
 * How many topics may be awaiting a decision at once.
 *
 * Counts only undecided ones: a student asked for changes three times would
 * otherwise be permanently blocked from proposing again, which contradicts what
 * requesting changes asks them to do. Must stay in step with the cap the
 * approval screen enforces, or the form appears and then refuses the submit.
 */
const MAX_PENDING_PROPOSALS = 3;

const proposeSchema = z.object({
  title: z.string().min(4, "Give your topic a real title."),
});

export type ProposeTopicState = { error?: string; success?: boolean };

export async function proposeTopic(_prev: ProposeTopicState, formData: FormData): Promise<ProposeTopicState> {
  const session = await auth();
  if (!session?.user || session.user.role !== "STUDENT") {
    return { error: "Only students can propose a topic." };
  }

  const parsed = proposeSchema.safeParse({ title: formData.get("title") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  try {
    const existingProject = await prisma.project.findFirst({ where: { studentId: session.user.id } });
    if (existingProject) return { error: "You already have an approved project." };

    const pending = await prisma.topicProposal.count({
      where: { studentId: session.user.id, status: "PENDING" },
    });
    if (pending >= MAX_PENDING_PROPOSALS) {
      return { error: `You can only have ${MAX_PENDING_PROPOSALS} topics awaiting review at a time.` };
    }

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
  } catch (err) {
    console.error("[proposeTopic]", err);
    return { error: GENERIC_ERROR };
  }
}

export async function deleteProposal(proposalId: string) {
  const session = await auth();
  if (!session?.user) return { error: "Not signed in." };

  try {
    const proposal = await prisma.topicProposal.findUnique({ where: { id: proposalId } });
    if (!proposal || proposal.studentId !== session.user.id) return { error: "Not your proposal." };
    if (proposal.status !== "PENDING") return { error: "Only pending proposals can be deleted." };

    await prisma.topicProposal.delete({ where: { id: proposalId } });
    revalidatePath("/student/project-approval");
    return { success: true };
  } catch (err) {
    console.error("[deleteProposal]", err);
    return { error: GENERIC_ERROR };
  }
}

/**
 * Approve a proposed topic, or send it back for changes.
 *
 * `feedback` is what the supervisor typed on the approval review screen. It is
 * stored on the proposal rather than only pushed into a notification, so the
 * reason a topic was returned is still on the screen when the student comes back
 * to it later.
 */
export async function decideProposal(
  proposalId: string,
  decision: "APPROVED" | "REJECTED",
  feedback?: string
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "LECTURER") {
    return { error: "Only lecturers can decide on a topic proposal." };
  }

  try {
    const proposal = await prisma.topicProposal.findUnique({
      where: { id: proposalId },
      include: { student: true },
    });
    if (!proposal) return { error: "Proposal not found." };
    if (proposal.student.pendingSupervisorId !== session.user.id) {
      return { error: "You don't supervise this student." };
    }
    if (proposal.status !== "PENDING") return { error: "This proposal was already decided." };

    const trimmedFeedback = feedback?.trim() || null;

    await prisma.topicProposal.update({
      where: { id: proposalId },
      data: { status: decision, decidedAt: new Date(), feedback: trimmedFeedback },
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
            // Carried from the student rather than read from today's date: the
            // project belongs to the intake the student was invited into, even
            // if their topic is approved in the following session.
            session: proposal.student.academicSession,
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
      await notify(
        proposal.studentId,
        trimmedFeedback
          ? `Your topic "${proposal.title}" was approved: ${trimmedFeedback}`
          : `Your topic "${proposal.title}" was approved. Head to My Project to get started.`,
        "/student/project"
      );
    } else {
      await notify(
        proposal.studentId,
        trimmedFeedback
          ? `Changes requested on "${proposal.title}": ${trimmedFeedback}`
          : `Changes were requested on "${proposal.title}". Propose a revised topic when you're ready.`,
        "/student/project-approval"
      );
    }

    revalidatePath("/student/project-approval");
    revalidatePath("/lecturer/students");
    revalidatePath("/lecturer");
    revalidatePath("/lecturer/approvals");
    revalidatePath(`/lecturer/approvals/${proposalId}`);
    revalidatePath("/management");
    return { success: true };
  } catch (err) {
    console.error("[decideProposal]", err);
    return { error: GENERIC_ERROR };
  }
}
