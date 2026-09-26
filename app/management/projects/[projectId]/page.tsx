import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DetailSummary, ActivityFeed } from "@/components/supervise/detail-summary";
import { MilestoneStatusBadge } from "@/components/supervise/milestone-status-badge";
import { summariseProject, statusBadgeVariant } from "@/lib/project-status";
import { formatDate } from "@/lib/utils";

export default async function ManagementProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      student: { include: { department: true } },
      supervisor: true,
      department: true,
      milestones: { orderBy: { order: "asc" } },
      auditEvents: { orderBy: { createdAt: "desc" }, take: 6 },
    },
  });

  if (!project) notFound();

  const summary = summariseProject(project, project.milestones);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold md:text-3xl">Project Details</h1>
        <p className="mt-1 text-sm text-muted-foreground">View project information and supervision status.</p>
      </div>

      <DetailSummary
        fields={[
          { label: "Project", value: project.title },
          { label: "Student", value: project.student.name },
          { label: "Supervisor", value: project.supervisor.name },
          {
            label: "Department",
            value: project.department?.name ?? project.student.department?.name ?? "—",
          },
          {
            label: "Project Status",
            value: <Badge variant={statusBadgeVariant(summary.status.key)}>{summary.status.label}</Badge>,
          },
          { label: "Current Milestone", value: summary.currentMilestone?.name ?? "—" },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Project Milestones</CardTitle>
          <CardDescription>Track progress across the project&apos;s milestones.</CardDescription>
        </CardHeader>

        <CardContent className="hidden overflow-x-auto p-0 md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-6 py-4 font-medium">Milestone</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Due Date</th>
              </tr>
            </thead>
            <tbody>
              {project.milestones.map((m) => (
                <tr key={m.id} className="border-b border-border/60 last:border-0">
                  <td className="px-6 py-4 font-medium">{m.name}</td>
                  <td className="px-6 py-4">
                    <MilestoneStatusBadge status={m.status} />
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-muted-foreground">
                    {m.dueDate ? formatDate(m.dueDate) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>

        <CardContent className="flex flex-col gap-3 md:hidden">
          {project.milestones.map((m) => (
            <div key={m.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border-strong bg-black/2 p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{m.name}</p>
                <p className="text-xs text-muted-foreground">{m.dueDate ? formatDate(m.dueDate) : "No due date"}</p>
              </div>
              <MilestoneStatusBadge status={m.status} />
            </div>
          ))}
        </CardContent>
      </Card>

      <ActivityFeed
        title="Recent Activity"
        description="Recent activity related to this project."
        emptyLabel="No recorded activity for this project yet."
        items={project.auditEvents.map((e) => ({
          id: e.id,
          text: e.description,
          when: formatDate(e.createdAt),
        }))}
      />

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" asChild>
          <Link href={`/management/students/${project.id}`}>Student details</Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link href={`/management/lecturers/${project.supervisorId}`}>Supervisor details</Link>
        </Button>
      </div>
    </div>
  );
}
