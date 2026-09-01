import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CountUp } from "@/components/ui/count-up";
import { FunnelChart } from "@/components/supervise/charts/funnel-chart";
import { WorkloadChart } from "@/components/supervise/charts/workload-chart";
import { MILESTONE_TEMPLATE } from "@/lib/milestones";
import { Users, GraduationCap, AlertTriangle, Layers } from "lucide-react";

const ACTION_LABELS: Record<string, string> = {
  SUBMISSION: "submissions",
  RESUBMISSION: "resubmissions",
  REVIEW_APPROVED: "approvals",
  REVIEW_RETURNED: "returns",
  REVIEW_COMMENT_ONLY: "review comments",
  MEETING_SCHEDULED: "meetings scheduled",
  MEETING_COMPLETED: "meetings completed",
  MILESTONE_DUE_DATE_CHANGED: "due date changes",
  PROJECT_CREATED: "projects created",
  STUDENT_CREATED: "students added",
  STUDENT_ACTIVATED: "student activations",
  LECTURER_REGISTERED: "lecturer registrations",
};

export default async function ManagementOverviewPage() {
  // eslint-disable-next-line react-hooks/purity -- Date.now() in a Server Component's data fetch, not a render-path computation
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [students, lecturers, projects, milestones, recentEvents] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.user.findMany({ where: { role: "LECTURER" }, include: { projectsSupervised: { select: { riskLevel: true, status: true } } } }),
    prisma.project.findMany({ select: { riskLevel: true, status: true } }),
    prisma.milestone.findMany({ select: { name: true, order: true, status: true } }),
    prisma.auditEvent.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { action: true },
    }),
  ]);

  const activeProjects = projects.filter((p) => p.status === "ACTIVE");
  const atRiskCount = activeProjects.filter((p) => p.riskLevel === "AT_RISK" || p.riskLevel === "CRITICAL").length;
  const atRiskPct = activeProjects.length > 0 ? Math.round((atRiskCount / activeProjects.length) * 100) : 0;

  const funnelData = MILESTONE_TEMPLATE.map((name, i) => ({
    name,
    count: milestones.filter((m) => m.order === i + 1 && m.status === "APPROVED").length,
  }));

  const workloadData = lecturers
    .map((l) => ({ name: l.name.replace("Dr. ", ""), students: l.projectsSupervised.length, capacity: l.maxLoad }))
    .sort((a, b) => b.students - a.students);

  const activityCounts = new Map<string, number>();
  for (const e of recentEvents) {
    activityCounts.set(e.action, (activityCounts.get(e.action) ?? 0) + 1);
  }
  const activitySummary = Array.from(activityCounts.entries())
    .map(([action, count]) => ({ label: ACTION_LABELS[action] ?? action.toLowerCase().replace(/_/g, " "), count }))
    .sort((a, b) => b.count - a.count);

  const stats = [
    { label: "Total students", value: students, icon: GraduationCap, href: "/management/students" },
    { label: "Total lecturers", value: lecturers.length, icon: Users, href: "/management/workload" },
    { label: "Active projects", value: activeProjects.length, icon: Layers, href: "/management/students" },
    { label: "At risk", value: atRiskPct, suffix: "%", icon: AlertTriangle, href: "/management/at-risk" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold md:text-3xl">Department overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">Computer Science · supervision at a glance.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="transition-transform hover:-translate-y-0.5">
              <CardContent className="flex flex-col gap-2 pt-6">
                <s.icon className="size-4 text-brand-700" />
                <p className="font-display text-3xl font-bold">
                  <CountUp value={s.value} />
                  {s.suffix ?? ""}
                </p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Completion funnel</CardTitle>
            <CardDescription>How many projects have approved each milestone.</CardDescription>
          </CardHeader>
          <CardContent>
            <FunnelChart data={funnelData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Workload distribution</CardTitle>
            <CardDescription>Students supervised vs. capacity, per lecturer.</CardDescription>
          </CardHeader>
          <CardContent>
            <WorkloadChart data={workloadData} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Department activity, last 7 days</CardTitle>
          <CardDescription>Aggregated across every lecturer and student — not per-record detail.</CardDescription>
        </CardHeader>
        <CardContent>
          {activitySummary.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recorded activity in the last 7 days.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {activitySummary.map((a) => (
                <div key={a.label} className="rounded-lg border border-border-strong bg-background-elevated px-3 py-2.5">
                  <p className="font-display text-xl font-bold">{a.count}</p>
                  <p className="text-xs capitalize text-muted-foreground">{a.label}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
