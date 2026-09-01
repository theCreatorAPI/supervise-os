"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { recomputeProjectRisk } from "@/lib/risk-engine";

const GENERIC_ERROR = "Something went wrong. Please try again.";

export async function updateMilestoneDueDate(milestoneId: string, dueDate: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "LECTURER") {
    return { error: "Only the supervising lecturer can edit due dates." };
  }

  try {
    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: { project: true },
    });
    if (!milestone) return { error: "Milestone not found." };
    if (milestone.project.supervisorId !== session.user.id) {
      return { error: "You don't supervise this project." };
    }

    await prisma.milestone.update({
      where: { id: milestoneId },
      data: { dueDate: dueDate ? new Date(dueDate) : null },
    });

    await recomputeProjectRisk(milestone.projectId);

    await logAudit({
      actorId: session.user.id,
      projectId: milestone.projectId,
      action: "MILESTONE_DUE_DATE_CHANGED",
      description: `${session.user.name} set the due date for "${milestone.name}" to ${dueDate || "none"}.`,
    });

    revalidatePath(`/lecturer/students/${milestone.projectId}`);
    revalidatePath("/student");
    return { success: true };
  } catch (err) {
    console.error("[updateMilestoneDueDate]", err);
    return { error: GENERIC_ERROR };
  }
}
