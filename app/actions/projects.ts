"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";
import { logAudit } from "@/lib/audit";
import { MILESTONE_TEMPLATE } from "@/lib/milestones";

const schema = z.object({
  title: z.string().min(4, "Give your project a real title."),
  description: z.string().optional(),
  programme: z.string().optional(),
  session: z.string().optional(),
});

export type CreateProjectState = { error?: string; success?: boolean };

export async function createProject(_prev: CreateProjectState, formData: FormData): Promise<CreateProjectState> {
  const session = await auth();
  if (!session?.user || session.user.role !== "STUDENT") {
    return { error: "Only students can create a project." };
  }

  const existing = await prisma.project.findFirst({ where: { studentId: session.user.id } });
  if (existing) return { error: "You already have an active project." };

  const student = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!student?.pendingSupervisorId) {
    return { error: "You don't have a supervisor assigned yet. Contact your department." };
  }

  const parsed = schema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    programme: formData.get("programme") || undefined,
    session: formData.get("session") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const { title, description, programme, session: sessionLabel } = parsed.data;

  const supervisor = await prisma.user.findUnique({ where: { id: student.pendingSupervisorId } });
  if (!supervisor || supervisor.role !== "LECTURER") {
    return { error: "Your assigned supervisor is no longer available. Contact your department." };
  }

  const project = await prisma.project.create({
    data: {
      title,
      description,
      programme,
      session: sessionLabel,
      studentId: session.user.id,
      supervisorId: supervisor.id,
      departmentId: student.departmentId,
      milestones: {
        create: MILESTONE_TEMPLATE.map((name, i) => ({ name, order: i + 1 })),
      },
    },
  });

  await notify(supervisor.id, `${session.user.name} created their project: "${title}".`, `/lecturer/students/${project.id}`);

  await logAudit({
    actorId: session.user.id,
    projectId: project.id,
    action: "PROJECT_CREATED",
    description: `${session.user.name} created project "${title}".`,
  });

  revalidatePath("/student");
  return { success: true };
}
