import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft, CalendarClock } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MeetingCompleteToggle } from "@/components/supervise/meeting-complete-toggle";
import { MeetingRecordForm } from "@/components/supervise/meeting-record-form";
import { formatDateTime } from "@/lib/utils";

export default async function MeetingDetailPage({
  params,
}: {
  params: Promise<{ meetingId: string }>;
}) {
  const { meetingId } = await params;
  const session = await auth();
  if (!session?.user) return null;

  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    include: { project: { include: { student: true } } },
  });

  if (!meeting) notFound();
  // Supervision is scoped: only this project's supervisor may open it.
  if (meeting.project.supervisorId !== session.user.id) redirect("/lecturer/meetings");

  // "Next meeting" is real data, not a placeholder — the next one actually
  // scheduled for this project after this one.
  const nextMeeting = await prisma.meeting.findFirst({
    where: {
      projectId: meeting.projectId,
      scheduledAt: { gt: meeting.scheduledAt },
    },
    orderBy: { scheduledAt: "asc" },
  });

  const isPast = new Date(meeting.scheduledAt) < new Date();
  const status = meeting.completed
    ? { label: "Completed", variant: "onSchedule" as const }
    : isPast
      ? { label: "Missed", variant: "overdue" as const }
      : { label: "Upcoming", variant: "brandSoft" as const };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <Link
        href="/lecturer/meetings"
        className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> Meetings
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold md:text-3xl">Meeting Details</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review meeting information and follow-up actions.
          </p>
        </div>
        {!meeting.completed && (
          <MeetingCompleteToggle meetingId={meeting.id} completed={meeting.completed} />
        )}
      </div>

      <Card>
        <CardContent className="grid grid-cols-1 gap-6 py-6 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Student</p>
            <Link
              href={`/lecturer/students/${meeting.projectId}`}
              className="mt-1 block text-sm font-medium hover:underline"
            >
              {meeting.project.student.name}
            </Link>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Project</p>
            <p className="mt-1 text-sm font-medium">{meeting.project.title}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Date &amp; Time</p>
            <p className="mt-1 text-sm font-medium">{formatDateTime(meeting.scheduledAt)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Status</p>
            <div className="mt-1">
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Meeting Record</CardTitle>
          <CardDescription>
            What was discussed, and what the student owes before the next meeting.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MeetingRecordForm
            meetingId={meeting.id}
            notes={meeting.notes}
            actionItems={meeting.actionItems}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="size-4" /> Next Meeting
          </CardTitle>
        </CardHeader>
        <CardContent>
          {nextMeeting ? (
            <Link
              href={`/lecturer/meetings/${nextMeeting.id}`}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border-strong bg-black/[0.02] px-4 py-3 transition-colors hover:bg-black/[0.05]"
            >
              <div>
                <p className="text-sm font-medium">{nextMeeting.title}</p>
                <p className="text-xs text-muted-foreground">{formatDateTime(nextMeeting.scheduledAt)}</p>
              </div>
              <Badge variant="outline">Scheduled</Badge>
            </Link>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nothing scheduled after this one yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
