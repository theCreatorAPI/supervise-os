import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCards } from "@/components/supervise/stat-cards";
import { ActivityFeed } from "@/components/supervise/detail-summary";
import { auth } from "@/auth";
import { formatDate, greeting, firstName, timeAgo } from "@/lib/utils";

/**
 * Department dashboard, following the admin flow sheet: a greeting, four
 * headline figures, the approval queue, then recent activity.
 *
 * The aggregate charts that used to sit here now live on the Workload screen, so
 * this page stays the overview the flow describes rather than a mixed dashboard.
 */
export default async function ManagementOverviewPage() {
  const session = await auth();

  const [students, lecturers, activeProjects, proposals, recentEvents] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.user.count({ where: { role: "LECTURER" } }),
    prisma.project.count({ where: { status: "ACTIVE" } }),
    prisma.topicProposal.findMany({
      where: { status: "PENDING" },
      include: { student: { include: { department: true } } },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.auditEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { project: { select: { id: true } } },
    }),
  ]);

  const pendingApprovals = await prisma.topicProposal.count({ where: { status: "PENDING" } });

  // `pendingSupervisorId` is a plain column rather than a relation, so the
  // supervisors behind the queue are resolved in one extra lookup.
  const supervisorIds = [...new Set(proposals.map((p) => p.student.pendingSupervisorId).filter(Boolean))] as string[];
  const supervisors = supervisorIds.length
    ? await prisma.user.findMany({ where: { id: { in: supervisorIds } }, select: { id: true, name: true } })
    : [];
  const supervisorName = new Map(supervisors.map((s) => [s.id, s.name]));

  const stats = [
    { label: "Total Students", value: students, href: "/management/students" },
    { label: "Total Lecturers", value: lecturers, href: "/management/lecturers" },
    { label: "Active Projects", value: activeProjects, href: "/management/projects" },
    {
      label: "Pending Approvals",
      value: pendingApprovals,
      tone: pendingApprovals > 0 ? ("warn" as const) : ("default" as const),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold md:text-3xl">
          {greeting()}, {firstName(session?.user?.name)}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s an overview of your department&apos;s project supervision activities.
        </p>
      </div>

      <StatCards stats={stats} />

      <Card>
        <CardHeader>
          <CardTitle>Projects Awaiting Approval</CardTitle>
          <CardDescription>Shows projects currently awaiting supervisor approval.</CardDescription>
        </CardHeader>

        {proposals.length === 0 ? (
          <CardContent>
            <p className="py-2 text-sm text-muted-foreground">Nothing is waiting on approval right now.</p>
          </CardContent>
        ) : (
          <>
            {/* Desktop: the table from the flow sheet */}
            <CardContent className="hidden overflow-x-auto p-0 md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="px-6 py-4 font-medium">Student</th>
                    <th className="px-6 py-4 font-medium">Project</th>
                    <th className="px-6 py-4 font-medium">Supervisor</th>
                    <th className="px-6 py-4 font-medium">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {proposals.map((p) => (
                    <tr key={p.id} className="border-b border-border/60 last:border-0">
                      <td className="px-6 py-4 font-medium">{p.student.name}</td>
                      <td className="max-w-80 px-6 py-4 text-muted-foreground">{p.title}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-muted-foreground">
                        {p.student.pendingSupervisorId
                          ? supervisorName.get(p.student.pendingSupervisorId) ?? "Unassigned"
                          : "Unassigned"}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-muted-foreground">{formatDate(p.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>

            {/* Mobile: the same rows stacked, since four columns can't shrink this far */}
            <CardContent className="flex flex-col gap-3 md:hidden">
              {proposals.map((p) => (
                <div key={p.id} className="rounded-xl border border-border-strong bg-black/2 p-3">
                  <p className="text-sm font-medium">{p.student.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{p.title}</p>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {p.student.pendingSupervisorId
                      ? supervisorName.get(p.student.pendingSupervisorId) ?? "Unassigned"
                      : "Unassigned"}{" "}
                    · {formatDate(p.createdAt)}
                  </p>
                </div>
              ))}
            </CardContent>
          </>
        )}
      </Card>

      <ActivityFeed
        title="Recent Activity"
        description="Latest supervision activity across the department."
        emptyLabel="No recorded activity yet."
        items={recentEvents.map((e) => ({
          id: e.id,
          text: e.description,
          when: timeAgo(e.createdAt),
          href: e.projectId ? `/management/projects/${e.projectId}` : undefined,
        }))}
      />

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" asChild>
          <Link href="/management/at-risk">View at-risk projects</Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link href="/management/workload">View lecturer workload</Link>
        </Button>
      </div>
    </div>
  );
}
