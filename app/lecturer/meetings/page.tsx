import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScheduleMeetingDialog } from "@/components/supervise/schedule-meeting-dialog";
import { formatDateTime } from "@/lib/utils";

/** Upcoming first, because those are the ones a supervisor is preparing for. */
function meetingStatus(meeting: { completed: boolean; scheduledAt: Date }) {
  if (meeting.completed) return { label: "Completed", variant: "onSchedule" as const, rank: 2 };
  if (new Date(meeting.scheduledAt) < new Date()) return { label: "Missed", variant: "overdue" as const, rank: 0 };
  return { label: "Upcoming", variant: "brandSoft" as const, rank: 1 };
}

export default async function LecturerMeetingsPage() {
  const session = await auth();
  if (!session?.user) return null;

  const meetings = await prisma.meeting.findMany({
    where: { project: { supervisorId: session.user.id } },
    include: { project: { include: { student: true } } },
    orderBy: { scheduledAt: "asc" },
  });

  const projects = await prisma.project.findMany({
    where: { supervisorId: session.user.id },
    include: { student: true },
    orderBy: { createdAt: "desc" },
  });

  const rows = meetings
    .map((m) => ({ ...m, meta: meetingStatus(m) }))
    .sort((a, b) => a.meta.rank - b.meta.rank || a.scheduledAt.getTime() - b.scheduledAt.getTime());

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold md:text-3xl">Meetings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Schedule and manage supervision meetings</p>
        </div>
        <ScheduleMeetingDialog
          projects={projects.map((p) => ({ id: p.id, label: `${p.student.name} — ${p.title}` }))}
        />
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            No meetings yet. Schedule one to get started.
          </CardContent>
        </Card>
      ) : (
        <Card>
          {/* Desktop: the table from the flow spec */}
          <CardContent className="hidden overflow-x-auto p-0 md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-6 py-4 font-medium">Student</th>
                  <th className="px-6 py-4 font-medium">Project</th>
                  <th className="px-6 py-4 font-medium">Date &amp; Time</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((m) => (
                  <tr key={m.id} className="border-b border-border/60 last:border-0">
                    <td className="px-6 py-4 font-medium">{m.project.student.name}</td>
                    <td className="max-w-70 truncate px-6 py-4 text-muted-foreground">{m.project.title}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-muted-foreground">
                      {formatDateTime(m.scheduledAt)}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={m.meta.variant}>{m.meta.label}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/lecturer/meetings/${m.id}`}
                        className="text-sm font-medium text-brand-700 hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>

          {/* Mobile: the same rows, stacked */}
          <CardContent className="flex flex-col gap-3 md:hidden">
            {rows.map((m) => (
              <Link
                key={m.id}
                href={`/lecturer/meetings/${m.id}`}
                className="flex flex-col gap-2 rounded-xl border border-border-strong bg-black/2 p-3 transition-colors hover:bg-black/5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{m.project.student.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{m.project.title}</p>
                  </div>
                  <Badge variant={m.meta.variant}>{m.meta.label}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{formatDateTime(m.scheduledAt)}</p>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
