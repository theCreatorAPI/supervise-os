import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { DetailSummary, ActivityFeed } from "@/components/supervise/detail-summary";
import { summariseProject, statusBadgeVariant } from "@/lib/project-status";
import { formatDate } from "@/lib/utils";

export default async function ManagementStudentDetailPage({
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
      milestones: { orderBy: { order: "asc" }, include: { submissions: { orderBy: { version: "desc" }, take: 1 } } },
      auditEvents: { orderBy: { createdAt: "desc" }, take: 6 },
    },
  });

  if (!project) notFound();

  const summary = summariseProject(project, project.milestones);

  const lastSubmission = project.milestones
    .flatMap((m) => m.submissions)
    .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime())[0];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold md:text-3xl">Student Details</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View student information and project supervision details.
        </p>
      </div>

      <DetailSummary
        fields={[
          { label: "Student", value: project.student.name },
          { label: "Department", value: project.student.department?.name ?? "—" },
          { label: "Supervisor", value: project.supervisor.name },
          {
            label: "Project Status",
            value: <Badge variant={statusBadgeVariant(summary.status.key)}>{summary.status.label}</Badge>,
          },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Project Information</CardTitle>
          <CardDescription>Overview of the student&apos;s current project.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Project</p>
            <p className="mt-1 text-sm font-medium wrap-break-word">{project.title}</p>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Current Milestone</p>
            <p className="mt-1 text-sm font-medium">{summary.currentMilestone?.name ?? "—"}</p>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Progress</p>
            <p className="mt-1 text-sm font-medium">{summary.progress}%</p>
            <ProgressBar value={summary.progress} className="mt-2" />
            <p className="mt-1.5 text-xs text-muted-foreground">
              {summary.approvedCount} of {summary.totalCount} milestones approved
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Last Submission</p>
            <p className="mt-1 text-sm font-medium">
              {lastSubmission ? formatDate(lastSubmission.submittedAt) : "None yet"}
            </p>
          </div>
        </CardContent>
      </Card>

      <ActivityFeed
        title="Supervision Activity"
        description="Recent activity related to the student's project."
        emptyLabel="No recorded activity for this project yet."
        items={project.auditEvents.map((e) => ({
          id: e.id,
          text: e.description,
          when: formatDate(e.createdAt),
        }))}
      />

      <div>
        <Button variant="secondary" asChild>
          <Link href={`/management/projects/${project.id}`}>View full project</Link>
        </Button>
      </div>
    </div>
  );
}
