"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";
import { recomputeProjectRisk } from "@/lib/risk-engine";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  submissionId: z.string(),
  comment: z.string().min(3, "Add at least a short comment."),
  decision: z.enum(["APPROVED", "RETURNED", "COMMENT_ONLY"]),
});

export type FeedbackState = { error?: string; success?: boolean };

export async function giveFeedback(_prev: FeedbackState, formData: FormData): Promise<FeedbackState> {
  const session = await auth();
  if (!session?.user || session.user.role !== "LECTURER") {
    return { error: "You must be signed in as a lecturer to review submissions." };
  }

  const parsed = schema.safeParse({
    submissionId: formData.get("submissionId"),
    comment: formData.get("comment"),
    decision: formData.get("decision"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const { submissionId, comment, decision } = parsed.data;

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { milestone: { include: { project: true } } },
  });
  if (!submission) return { error: "Submission not found." };
  if (submission.milestone.project.supervisorId !== session.user.id) {
    return { error: "You don't supervise this project." };
  }

  await prisma.review.create({
    data: {
      submissionId,
      lecturerId: session.user.id,
      comment,
      decision,
    },
  });

  const newStatus =
    decision === "APPROVED" ? "APPROVED" : decision === "RETURNED" ? "RETURNED" : "UNDER_REVIEW";

  await prisma.milestone.update({
    where: { id: submission.milestoneId },
    data: {
      status: newStatus,
      approvedAt: decision === "APPROVED" ? new Date() : undefined,
    },
  });

  const verb =
    decision === "APPROVED" ? "approved" : decision === "RETURNED" ? "returned" : "commented on";
  await notify(
    submission.milestone.project.studentId,
    `${session.user.name} ${verb} "${submission.milestone.name}".`,
    `/student`
  );

  await recomputeProjectRisk(submission.milestone.project.id);

  await logAudit({
    actorId: session.user.id,
    projectId: submission.milestone.project.id,
    action: `REVIEW_${decision}`,
    description: `${session.user.name} ${verb} "${submission.milestone.name}" (v${submission.version}).`,
  });

  revalidatePath(`/lecturer/review/${submissionId}`);
  revalidatePath(`/lecturer/students/${submission.milestone.project.id}`);
  revalidatePath("/lecturer");
  revalidatePath("/student");
  revalidatePath("/student/project");
  revalidatePath("/student/submissions");

  return { success: true };
}
