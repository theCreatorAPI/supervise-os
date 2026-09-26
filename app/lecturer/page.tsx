import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CountUp } from "@/components/ui/count-up";
import { ProgressBar } from "@/components/ui/progress-bar";
import { summariseProject, statusBadgeVariant } from "@/lib/project-status";
import { getSupervisorSessions } from "@/lib/academic-session";
import { firstName, timeAgo, greeting } from "@/lib/utils";
import { Users, FolderKanban, Search, CalendarClock } from "lucide-react";

export default async function LecturerDashboard() {
  const session = await auth();
  if (!session?.user) return null;

  // Everything on this screen is scoped to one intake, so a supervisor carrying
  // students across several sessions sees one cohort at a time.
  const { selected } = await getSupervisorSessions(session.user.id);

  const projects = await prisma.project.findMany({
    where: { supervisorId: session.user.id, session: selected },
    include: {
      student: true,
      milestones: { include: { submissions: { orderBy: { submittedAt: "asc" } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  const activeProjects = projects.filter((p) => p.status === "ACTIVE");

  const awaitingReview = projects.flatMap((p) =>
    p.milestones.filter((m) => m.status === "UNDER_REVIEW").map((m) => m.id)
  );

  // "This week" — the next seven days, which is what a supervisor is preparing for.
  const weekFromNow = new Date();
  weekFromNow.setDate(weekFromNow.getDate() + 7);
  const upcomingMeetings = await prisma.meeting.count({
    where: {
      project: { supervisorId: session.user.id, session: selected },
      completed: false,
      scheduledAt: { gte: new Date(), lte: weekFromNow },
    },
  });

  const pendingProposals = await prisma.topicProposal.findMany({
    where: {
      status: "PENDING",
      student: { pendingSupervisorId: session.user.id, academicSession: selected },
    },
    select: { id: true },
  });

  const recentActivity = await prisma.auditEvent.findMany({
    where: { project: { supervisorId: session.user.id, session: selected } },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  const stats = [
    {
      label: "Total Students",
      caption: "Active students",
      value: projects.length,
      icon: Users,
      href: "/lecturer/students",
    },
    {
      label: "Active Projects",
      caption: "Currently supervised",
      value: activeProjects.length,
      icon: FolderKanban,
      href: "/lecturer/students",
    },
    {
      label: "Pending Reviews",
      caption: "Awaiting your review",
      value: awaitingReview.length,
      icon: Search,
      href: "/lecturer/submissions?status=under-review",
    },
    {
      label: "Upcoming Meetings",
      caption: "This week",
      value: upcomingMeetings,
      icon: CalendarClock,
      href: "/lecturer/meetings",
    },
  ];

  const roster = projects.map((p) => ({
    id: p.id,
    student: p.student.name,
    title: p.title,
    summary: summariseProject(p, p.milestones),
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold md:text-3xl">
          {greeting()}, {firstName(session.user.name)}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s an overview of your supervision activities.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="h-full transition-transform hover:-translate-y-0.5">
              <CardContent className="flex flex-col gap-1 py-5">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <s.icon className="size-4" />
                  <p className="text-xs font-medium">{s.label}</p>
                </div>
                <p className="font-display text-3xl font-bold">
                  <CountUp value={s.value} />
                </p>
                <p className="text-xs text-muted-foreground">{s.caption}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Approvals</CardTitle>
          <CardDescription>Research topics awaiting your review</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-strong bg-black/2 px-4 py-3">
            <p className="text-sm">
              {pendingProposals.length === 0
                ? "No topics are waiting on you right now"
                : `${pendingProposals.length} project${pendingProposals.length === 1 ? "" : "s"} awaiting your review`}
            </p>
            <Link
              href="/lecturer/approvals"
              className="-my-1 shrink-0 py-1.5 text-sm font-medium text-brand-700 hover:underline"
            >
              View approvals →
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My Students</CardTitle>
          <CardDescription>Students currently under your supervision</CardDescription>
        </CardHeader>

        {roster.length === 0 ? (
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No students yet. Add one from My Students to get started.
          </CardContent>
        ) : (
          <>
            {/* Desktop: the table from the flow spec */}
            <CardContent className="hidden overflow-x-auto p-0 md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="px-6 py-3 font-medium">Student</th>
                    <th className="px-6 py-3 font-medium">Project</th>
                    <th className="px-6 py-3 font-medium">Progress</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {roster.slice(0, 6).map((r) => (
                    <tr key={r.id} className="border-b border-border/60 last:border-0">
                      <td className="px-6 py-3.5 font-medium">{r.student}</td>
                      <td className="max-w-70 truncate px-6 py-3.5 text-muted-foreground">{r.title}</td>
                      <td className="px-6 py-3.5">{r.summary.progress}%</td>
                      <td className="px-6 py-3.5">
                        <Badge variant={statusBadgeVariant(r.summary.status.key)}>{r.summary.status.label}</Badge>
                      </td>
                      <td className="px-6 py-3.5">
                        <Button size="sm" variant="secondary" asChild>
                          <Link href={`/lecturer/students/${r.id}`}>View</Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>

            {/* Mobile: the same rows, stacked */}
            <CardContent className="flex flex-col gap-3 md:hidden">
              {roster.slice(0, 6).map((r) => (
                <Link
                  key={r.id}
                  href={`/lecturer/students/${r.id}`}
                  className="flex flex-col gap-2 rounded-xl border border-border-strong bg-black/2 p-3 transition-colors hover:bg-black/5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{r.student}</p>
                      <p className="truncate text-xs text-muted-foreground">{r.title}</p>
                    </div>
                    <Badge variant={statusBadgeVariant(r.summary.status.key)}>{r.summary.status.label}</Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <ProgressBar value={r.summary.progress} className="flex-1" />
                    <span className="text-xs text-muted-foreground">{r.summary.progress}%</span>
                  </div>
                </Link>
              ))}
            </CardContent>
          </>
        )}
      </Card>

      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates from your students</CardDescription>
          </div>
          <Link
            href="/lecturer/notifications"
            className="-my-1 shrink-0 py-1.5 text-sm font-medium text-brand-700 hover:underline"
          >
            View All
          </Link>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {recentActivity.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nothing yet. Activity appears here as your students submit and you review.
            </p>
          ) : (
            recentActivity.map((event) => (
              <div
                key={event.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border-strong bg-black/2 px-4 py-3"
              >
                <p className="min-w-0 text-sm">{event.description}</p>
                <p className="shrink-0 text-xs text-muted-foreground">{timeAgo(event.createdAt)}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
