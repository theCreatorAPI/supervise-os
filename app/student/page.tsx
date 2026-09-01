import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { AuditLog } from "@/components/supervise/audit-log";
import { cn, formatDate, greeting } from "@/lib/utils";
import { ArrowRight, CalendarClock, CheckCircle2, Circle, ClipboardList, Gauge, ListChecks, Sparkles } from "lucide-react";

export default async function StudentDashboard() {
  const session = await auth();
  if (!session?.user) return null;

  const project = await prisma.project.findFirst({
    where: { studentId: session.user.id },
    include: {
      supervisor: true,
      milestones: { orderBy: { order: "asc" } },
      meetings: { orderBy: { scheduledAt: "asc" } },
      auditEvents: { orderBy: { createdAt: "desc" }, take: 8 },
    },
  });

  const timeGreeting = greeting();
  const firstName = session.user.name?.split(" ")[0] ?? "there";

  if (!project) {
    return (
      <div className="mx-auto max-w-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-brand-50">
            <Sparkles className="size-6 text-brand-700" />
          </div>
          <h1 className="font-display text-2xl font-bold">
            {timeGreeting}, {firstName}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Propose a topic to get your milestone journey started — head over to Project Approval.
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
            <ClipboardList className="size-8 text-muted-foreground" />
            <Button asChild size="lg">
              <Link href="/student/project-approval">
                Go to Project Approval <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentMilestone = project.milestones.find((m) => m.status !== "APPROVED");
  const approvedCount = project.milestones.filter((m) => m.status === "APPROVED").length;
  const progressPct = Math.round((approvedCount / project.milestones.length) * 100);
  const nextMeeting = project.meetings.find((m) => !m.completed && new Date(m.scheduledAt) > new Date());
  const upcomingMeetingsCount = project.meetings.filter((m) => !m.completed && new Date(m.scheduledAt) > new Date()).length;
  const pendingActions = project.milestones.filter(
    (m) => m.status === "RETURNED" || (currentMilestone && m.id === currentMilestone.id && m.status !== "UNDER_REVIEW")
  ).length;

  const stats = [
    { label: "Project Progress", value: `${progressPct}%`, sub: "Overall completion", icon: Gauge },
    { label: "Pending Actions", value: pendingActions, sub: "Tasks requiring attention", icon: ListChecks },
    {
      label: "Upcoming Meetings",
      value: upcomingMeetingsCount,
      sub: nextMeeting ? `${nextMeeting.title} · ${formatDate(nextMeeting.scheduledAt)}` : "Nothing scheduled",
      icon: CalendarClock,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold md:text-3xl">
          {timeGreeting}, {firstName}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Here&apos;s what&apos;s happening with your project today</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-1">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <s.icon className="size-4" /> {s.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-display text-3xl font-bold text-brand-700">{s.value}</p>
              <p className="mt-1 truncate text-xs text-muted-foreground">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Project Progress</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div>
              <p className="mb-2 text-sm font-medium">{progressPct}% Complete</p>
              <ProgressBar value={progressPct} />
            </div>
            <div>
              <p className="mb-3 text-sm font-semibold">Project Milestones</p>
              <div className="flex flex-col gap-3">
                {project.milestones.map((m) => {
                  const done = m.status === "APPROVED";
                  const active = !done && currentMilestone?.id === m.id;
                  const Icon = done ? CheckCircle2 : Circle;
                  return (
                    <div key={m.id} className="flex items-center justify-between gap-3 text-sm">
                      <span className="flex items-center gap-2">
                        <Icon
                          className={cn(
                            "size-4",
                            done ? "text-success-600" : active ? "fill-brand-500 text-brand-500" : "text-muted-foreground"
                          )}
                        />
                        {m.name}
                      </span>
                      <span
                        className={
                          done ? "text-xs font-medium text-success-700" : active ? "text-xs font-medium text-brand-700" : "text-xs text-muted-foreground"
                        }
                      >
                        {done ? "Completed" : active ? "In Progress" : "Not Started"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Next Action</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {currentMilestone ? (
              <>
                <div>
                  <p className="text-sm font-semibold">
                    {currentMilestone.status === "UNDER_REVIEW" ? "Awaiting review: " : "Submit "}
                    {currentMilestone.name}
                  </p>
                  {currentMilestone.dueDate && (
                    <p className="mt-1 text-xs text-muted-foreground">Due {formatDate(currentMilestone.dueDate)}</p>
                  )}
                </div>
                <Button asChild>
                  <Link href="/student/submissions">
                    View Details <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">All milestones complete. Nice work.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <AuditLog events={project.auditEvents} />
        </CardContent>
      </Card>
    </div>
  );
}
