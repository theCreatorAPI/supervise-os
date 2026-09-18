"use server";

import path from "path";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";
import { recomputeProjectRisk } from "@/lib/risk-engine";
import { createSignedUpload, statObject, ALLOWED_TYPES, MAX_FILE_SIZE } from "@/lib/storage";
import { signUploadPath, verifyUploadPath } from "@/lib/upload-token";
import { logAudit } from "@/lib/audit";

const GENERIC_ERROR = "Something went wrong. Please try again.";

export type SubmitState = { error?: string; success?: boolean };

export type UploadTicket =
  | { ok: true; signedUrl: string; storedName: string; signature: string }
  | { ok: false; error: string };

/**
 * Step one of a submission: authorize the upload and hand back a one-shot URL
 * the browser posts the file to directly.
 *
 * The file itself never passes through this server. Server Action requests are
 * capped at 1MB by default and serverless platforms cap request bodies lower
 * still than the 25MB this app accepts, so a chapter PDF sent through an action
 * would be rejected before any of this code ran.
 */
export async function requestSubmissionUpload(input: {
  milestoneId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}): Promise<UploadTicket> {
  const session = await auth();
  if (!session?.user || session.user.role !== "STUDENT") {
    return { ok: false, error: "You must be signed in as a student to submit work." };
  }

  // Validated here as well as in the browser: this action is a public endpoint,
  // and the checks in the uploader are a convenience, not a boundary.
  if (!input.fileSize || input.fileSize <= 0) {
    return { ok: false, error: "Attach a file before submitting." };
  }
  if (!ALLOWED_TYPES.includes(input.fileType)) {
    return { ok: false, error: "Only PDF, DOC, and DOCX files are accepted." };
  }
  if (input.fileSize > MAX_FILE_SIZE) {
    return { ok: false, error: "File is too large — max 25MB." };
  }

  try {
    const milestone = await prisma.milestone.findUnique({
      where: { id: input.milestoneId },
      include: { project: true },
    });
    if (!milestone) return { ok: false, error: "Milestone not found." };
    if (milestone.project.studentId !== session.user.id) {
      return { ok: false, error: "This isn't your project." };
    }

    const ext = path.extname(input.fileName) || "";
    // Opaque name: the original filename is attacker-controlled and is kept in
    // the database column instead, where it cannot affect a storage path.
    const storedName = `${randomUUID()}${ext}`;
    const { signedUrl } = await createSignedUpload(storedName);

    return {
      ok: true,
      signedUrl,
      storedName,
      signature: signUploadPath(session.user.id, input.milestoneId, storedName),
    };
  } catch (err) {
    console.error("[requestSubmissionUpload]", err);
    return { ok: false, error: GENERIC_ERROR };
  }
}

/**
 * Step two: record the submission once the browser reports a successful upload.
 *
 * Nothing here trusts the client beyond the signature it was issued. The path is
 * verified against that signature, and the recorded size is read back from
 * storage rather than taken from the request — which also confirms the object
 * really exists before a row claims it does.
 */
export async function finalizeSubmission(input: {
  milestoneId: string;
  storedName: string;
  signature: string;
  fileName: string;
}): Promise<SubmitState> {
  const session = await auth();
  if (!session?.user || session.user.role !== "STUDENT") {
    return { error: "You must be signed in as a student to submit work." };
  }

  if (!verifyUploadPath(session.user.id, input.milestoneId, input.storedName, input.signature)) {
    return { error: "This upload could not be verified. Please try again." };
  }

  try {
    const milestone = await prisma.milestone.findUnique({
      where: { id: input.milestoneId },
      include: { project: true, submissions: true },
    });
    if (!milestone) return { error: "Milestone not found." };
    if (milestone.project.studentId !== session.user.id) {
      return { error: "This isn't your project." };
    }

    const size = await statObject(input.storedName);
    if (size === null) {
      return { error: "The upload didn't complete. Please try again." };
    }

    const version = milestone.submissions.length + 1;

    await prisma.submission.create({
      data: {
        milestoneId: input.milestoneId,
        version,
        fileUrl: `/api/uploads/${input.storedName}`,
        fileName: input.fileName,
        fileSize: size,
      },
    });

    await prisma.milestone.update({
      where: { id: input.milestoneId },
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
      `/student/submit/${input.milestoneId}`
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
  } catch (err) {
    console.error("[finalizeSubmission]", err);
    return { error: GENERIC_ERROR };
  }
}
