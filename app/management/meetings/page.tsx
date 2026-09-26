import { prisma } from "@/lib/prisma";
import { StatCards } from "@/components/supervise/stat-cards";
import { AttentionPanel, ActivityFeed } from "@/components/supervise/detail-summary";
import { formatDate } from "@/lib/utils";

export default async function ManagementMeetingsPage() {
  const meetings = await prisma.meeting.findMany({
    include: { project: { include: { student: true } } },
    orderBy: { scheduledAt: "desc" },
    take: 500,
  });

  const now = new Date();
  const upcoming = meetings.filter((m) => !m.completed && m.scheduledAt >= now);
  const completed = meetings.filter((m) => m.completed);

  // Scheduled, the date has passed, and nobody has marked it done — the meeting
  // either didn't happen or wasn't recorded. Either way it needs chasing.
  const overdue = meetings.filter((m) => !m.completed && m.scheduledAt < now);

  // A completed meeting with no action items leaves the student with nothing
  // agreed, which is the thing supervision is meant to produce.
  const missingActionItems = completed.filter((m) => !m.actionItems?.trim());

  const attention = [
    upcoming.length > 0 &&
      `${upcoming.length} upcoming meeting${upcoming.length === 1 ? " has" : "s have"} not been confirmed`,
    overdue.length > 0 &&
      `${overdue.length} scheduled meeting${overdue.length === 1 ? " has" : "s have"} been overdue for follow-up`,
    missingActionItems.length > 0 &&
      `${missingActionItems.length} recent meeting${missingActionItems.length === 1 ? " has" : "s have"} no recorded action items`,
  ].filter(Boolean) as string[];

  const stats = [
    { label: "Total Meetings", value: meetings.length },
    { label: "Upcoming", value: upcoming.length, tone: "brand" as const },
    { label: "Completed", value: completed.length, tone: "success" as const },
    {
      label: "Needs Attention",
      value: overdue.length + missingActionItems.length,
      tone: "critical" as const,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold md:text-3xl">Meetings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Monitor supervision meetings and departmental meeting activity.
        </p>
      </div>

      <StatCards stats={stats} />

      <AttentionPanel
        title="Meetings Requiring Attention"
        description="Meetings that may require departmental follow-up."
        items={attention}
        emptyLabel="No meetings need departmental follow-up right now."
      />

      <ActivityFeed
        title="Recent Meeting Activity"
        description="Latest supervision meeting activity across the department."
        emptyLabel="No meetings scheduled yet."
        items={meetings.slice(0, 8).map((m) => ({
          id: m.id,
          text: `Meeting with ${m.project.student.name} ${m.completed ? "completed" : "scheduled"}`,
          when: formatDate(m.scheduledAt),
          href: `/management/projects/${m.projectId}`,
        }))}
      />
    </div>
  );
}
