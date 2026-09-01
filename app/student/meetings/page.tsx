import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScheduleMeetingDialog } from "@/components/supervise/schedule-meeting-dialog";
import { formatDate } from "@/lib/utils";
import { CalendarClock, CalendarX2 } from "lucide-react";

export default async function StudentMeetingsPage() {
  const session = await auth();
  if (!session?.user) return null;

  const project = await prisma.project.findFirst({
    where: { studentId: session.user.id },
    include: { meetings: { orderBy: { scheduledAt: "desc" } }, supervisor: true },
  });

  if (!project) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <CalendarX2 className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">You need a supervisor assigned before scheduling meetings.</p>
        </CardContent>
      </Card>
    );
  }

  const now = new Date();
  const upcoming = project.meetings
    .filter((m) => !m.completed && new Date(m.scheduledAt) >= now)
    .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime())[0];
  const missed = project.meetings.filter((m) => !m.completed && new Date(m.scheduledAt) < now);
  const previous = project.meetings.filter((m) => m.completed);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold md:text-3xl">Meetings</h1>
          <p className="mt-1 text-sm text-muted-foreground">View your upcoming and previous project supervision meetings.</p>
        </div>
        <ScheduleMeetingDialog projectId={project.id} projectTitle={project.title} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Meeting</CardTitle>
        </CardHeader>
        <CardContent>
          {upcoming ? (
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">{upcoming.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatDate(upcoming.scheduledAt)}</p>
                {upcoming.notes && <p className="mt-2 text-sm text-muted-foreground">{upcoming.notes}</p>}
              </div>
              <Badge variant="brandSoft">Upcoming</Badge>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <CalendarClock className="size-7 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Nothing scheduled. Ask your supervisor for a slot.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {missed.length > 0 && (
        <Card className="glow-critical">
          <CardHeader>
            <CardTitle>Missed</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {missed.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-3 border-b border-border/60 py-2 last:border-0">
                <div>
                  <p className="text-sm font-medium">{m.title}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(m.scheduledAt)}</p>
                </div>
                <Badge variant="overdue">Missed</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Previous Meetings</CardTitle>
          <CardDescription>Review your previous supervision sessions.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col">
          {previous.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">No completed meetings yet.</p>
          ) : (
            previous.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-3 border-b border-border/60 py-3 last:border-0">
                <div>
                  <p className="text-sm font-medium">{m.title}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(m.scheduledAt)}</p>
                </div>
                <span className="text-xs font-medium text-success-700">Completed</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
