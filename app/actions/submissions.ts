"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";
import { recomputeProjectRisk } from "@/lib/risk-engine";
import { saveFile, ALLOWED_TYPES, MAX_FILE_SIZE } from "@/lib/storage";
import { logAudit } from "@/lib/audit";

export type SubmitState = { error?: string; success?: boolean };

export async function submitMilestone(_prev: SubmitState, formData: FormData): Promise<SubmitState> {
  const session = await auth();
  if (!session?.user || session.user.role !== "STUDENT") {
    return { error: "You must be signed in as a student to submit work." };
  }

  const milestoneId = formData.get("milestoneId") as string;
  const file = formData.get("file") as File | null;

  if (!file || file.size === 0) {
    return { error: "Attach a file before submitting." };
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: "Only PDF, DOC, and DOCX files are accepted." };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { error: "File is too large — max 25MB." };
  }

  const milestone = await prisma.milestone.findUnique({
    where: { id: milestoneId },
    include: { project: true, submissions: true },
  });
  if (!milestone) return { error: "Milestone not found." };
  if (milestone.project.studentId !== session.user.id) {
    return { error: "This isn't your project." };
  }

  const { url, fileName, size } = await saveFile(file);
  const version = milestone.submissions.length + 1;

  await prisma.submission.create({
    data: {
      milestoneId,
      version,
      fileUrl: url,
      fileName,
      fileSize: size,
    },
  });

  await prisma.milestone.update({
    where: { id: milestoneId },
    data: { status: "UNDER_REVIEW" },
  });

  await notify(
    milestone.project.supervisorId,
    `${session.user.name} submitted "${milestone.name}" (v${version}) for review.`,
    `/lecturer/students/${milestone.project.id}`
  );
  await notify(
    session.user.id,
    `Your submission for "${milestone.name}" (v${version}) was received.`,
    `/student/submit/${milestoneId}`
  );

  await recomputeProjectRisk(milestone.project.id);

  const isResubmission = version > 1;
  await logAudit({
    actorId: session.user.id,
    projectId: milestone.project.id,
    action: isResubmission ? "RESUBMISSION" : "SUBMISSION",
    description: `${session.user.name} ${isResubmission ? "resubmitted" : "submitted"} "${milestone.name}" (v${version}).`,
  });

  revalidatePath("/student");
  revalidatePath("/student/project");
  revalidatePath("/student/submissions");
  revalidatePath(`/lecturer/students/${milestone.project.id}`);

  return { success: true };
}
