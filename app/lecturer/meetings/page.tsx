import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MeetingCompleteToggle } from "@/components/supervise/meeting-complete-toggle";
import { formatDateTime } from "@/lib/utils";
import { CalendarClock } from "lucide-react";

export default async function LecturerMeetingsPage() {
  const session = await auth();
  if (!session?.user) return null;

  const meetings = await prisma.meeting.findMany({
    where: { project: { supervisorId: session.user.id } },
    include: { project: { include: { student: true } } },
    orderBy: { scheduledAt: "asc" },
  });

  const now = new Date();
  const upcoming = meetings.filter((m) => !m.completed && new Date(m.scheduledAt) >= now);
  const missed = meetings.filter((m) => !m.completed && new Date(m.scheduledAt) < now);
  const completed = meetings.filter((m) => m.completed).sort((a, b) => b.scheduledAt.getTime() - a.scheduledAt.getTime());

  const sections = [
    { title: "Missed", items: missed, badge: "overdue" as const, empty: "Nothing missed. Good." },
    { title: "Upcoming", items: upcoming, badge: "brandSoft" as const, empty: "Nothing scheduled." },
    { title: "Completed", items: completed.slice(0, 10), badge: "onSchedule" as const, empty: "No completed meetings yet." },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold md:text-3xl">Meetings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Across all your students.</p>
      </div>

      {sections.map((section) => (
        <Card key={section.title}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="size-4" /> {section.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {section.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">{section.empty}</p>
            ) : (
              section.items.map((m) => (
                <div key={m.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-black/[0.02] px-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium">
                      {m.project.student.name} · {m.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(m.scheduledAt)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={section.badge}>{section.title}</Badge>
                    {!m.completed && <MeetingCompleteToggle meetingId={m.id} completed={m.completed} />}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
