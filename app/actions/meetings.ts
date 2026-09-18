"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";
import { recomputeProjectRisk } from "@/lib/risk-engine";
import { logAudit } from "@/lib/audit";

const GENERIC_ERROR = "Something went wrong. Please try again.";

const schema = z.object({
  projectId: z.string(),
  title: z.string().min(2).default("Supervision meeting"),
  scheduledAt: z.string().min(1, "Pick a date and time."),
  notes: z.string().optional(),
});

export type MeetingState = { error?: string; success?: boolean };

export async function scheduleMeeting(_prev: MeetingState, formData: FormData): Promise<MeetingState> {
  const session = await auth();
  if (!session?.user || (session.user.role !== "LECTURER" && session.user.role !== "STUDENT")) {
    return { error: "You must be signed in to schedule a meeting." };
  }

  const parsed = schema.safeParse({
    projectId: formData.get("projectId"),
    title: formData.get("title") || "Supervision meeting",
    scheduledAt: formData.get("scheduledAt"),
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const { projectId, title, scheduledAt, notes } = parsed.data;

  try {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return { error: "Project not found." };
    if (project.studentId !== session.user.id && project.supervisorId !== session.user.id) {
      return { error: "You're not part of this project." };
    }

    await prisma.meeting.create({
      data: { projectId, title, scheduledAt: new Date(scheduledAt), notes },
    });

    const recipient = session.user.id === project.studentId ? project.supervisorId : project.studentId;
    await notify(recipient, `A new meeting "${title}" was scheduled.`, `/${session.user.role === "STUDENT" ? "lecturer" : "student"}/meetings`, "meeting");

    await logAudit({
      actorId: session.user.id,
      projectId,
      action: "MEETING_SCHEDULED",
      description: `${session.user.name} scheduled "${title}".`,
    });

    revalidatePath("/student/meetings");
    revalidatePath("/lecturer/meetings");

    return { success: true };
  } catch (err) {
    console.error("[scheduleMeeting]", err);
    return { error: GENERIC_ERROR };
  }
}

const recordSchema = z.object({
  meetingId: z.string(),
  notes: z.string().max(4000).optional(),
  actionItems: z.string().max(4000).optional(),
});

/**
 * Saves the supervisor's write-up for a meeting. Only the supervising lecturer
 * can record it — the student sees it but doesn't author it.
 */
export async function updateMeetingRecord(
  _prev: MeetingState,
  formData: FormData
): Promise<MeetingState> {
  const session = await auth();
  if (!session?.user || session.user.role !== "LECTURER") {
    return { error: "Only the supervising lecturer can record meeting notes." };
  }

  const parsed = recordSchema.safeParse({
    meetingId: formData.get("meetingId"),
    notes: formData.get("notes")?.toString() ?? undefined,
    actionItems: formData.get("actionItems")?.toString() ?? undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const { meetingId, notes, actionItems } = parsed.data;

  try {
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: { project: true },
    });
    if (!meeting) return { error: "Meeting not found." };
    if (meeting.project.supervisorId !== session.user.id) {
      return { error: "Not your meeting." };
    }

    await prisma.meeting.update({
      where: { id: meetingId },
      data: {
        // Empty textareas clear the field rather than storing "".
        notes: notes?.trim() ? notes.trim() : null,
        actionItems: actionItems?.trim() ? actionItems.trim() : null,
      },
    });

    await logAudit({
      actorId: session.user.id,
      projectId: meeting.projectId,
      action: "MEETING_RECORD_UPDATED",
      description: `${session.user.name} updated the record for "${meeting.title}".`,
    });

    revalidatePath(`/lecturer/meetings/${meetingId}`);
    revalidatePath("/lecturer/meetings");
    revalidatePath("/student/meetings");
    return { success: true };
  } catch (err) {
    console.error("[updateMeetingRecord]", err);
    return { error: GENERIC_ERROR };
  }
}

export async function toggleMeetingComplete(meetingId: string, completed: boolean) {
  const session = await auth();
  if (!session?.user) return { error: "Not signed in." };

  try {
    const meeting = await prisma.meeting.findUnique({ where: { id: meetingId }, include: { project: true } });
    if (!meeting) return { error: "Meeting not found." };
    if (meeting.project.supervisorId !== session.user.id && meeting.project.studentId !== session.user.id) {
      return { error: "Not your meeting." };
    }

    await prisma.meeting.update({ where: { id: meetingId }, data: { completed } });
    await recomputeProjectRisk(meeting.projectId);

    if (completed) {
      await logAudit({
        actorId: session.user.id,
        projectId: meeting.projectId,
        action: "MEETING_COMPLETED",
        description: `${session.user.name} marked "${meeting.title}" as complete.`,
      });
    }

    revalidatePath("/student/meetings");
    revalidatePath("/lecturer/meetings");
    return { success: true };
  } catch (err) {
    console.error("[toggleMeetingComplete]", err);
    return { error: GENERIC_ERROR };
  }
}
