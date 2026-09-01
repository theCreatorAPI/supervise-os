import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatDate, formatDateTime } from "@/lib/utils";
import { ArrowRight, FileText } from "lucide-react";

const STATUS_LABEL: Record<string, string> = {
  NOT_STARTED: "Not Started",
  IN_PROGRESS: "In Progress",
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  RETURNED: "Returned",
  APPROVED: "Completed",
};

const STATUS_COLOR: Record<string, string> = {
  NOT_STARTED: "text-muted-foreground",
  IN_PROGRESS: "text-brand-700",
  SUBMITTED: "text-brand-700",
  UNDER_REVIEW: "text-warn-700",
  RETURNED: "text-critical-700",
  APPROVED: "text-success-700",
};

export default async function MyProjectPage() {
  const session = await auth();
  if (!session?.user) return null;

  const project = await prisma.project.findFirst({
    where: { studentId: session.user.id },
    include: {
      supervisor: true,
      department: true,
      milestones: {
        orderBy: { order: "asc" },
        include: { submissions: { orderBy: { version: "desc" }, take: 1 } },
      },
    },
  });

  if (!project) {
    return (
      <div className="mx-auto max-w-xl text-center">
        <h1 className="font-display text-2xl font-bold">No project yet</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Once your proposed topic is approved, your full project overview appears here.
        </p>
        <Link href="/student/project-approval" className="mt-4 inline-block text-sm text-brand-700 hover:underline">
          Go to Project Approval
        </Link>
      </div>
    );
  }

  const currentMilestone = project.milestones.find((m) => m.status !== "APPROVED");
  const overallStatus = currentMilestone ? STATUS_LABEL[currentMilestone.status] : "Completed";
  const overallColor = currentMilestone ? STATUS_COLOR[currentMilestone.status] : "text-success-700";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold md:text-3xl">My Project</h1>
        <p className="mt-1 text-sm text-muted-foreground">Final Year Research Project</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Overview</CardTitle>
          <CardDescription>{project.title}</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Supervisor</p>
            <p className="mt-1 text-sm font-medium">{project.supervisor.name}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Department</p>
            <p className="mt-1 text-sm font-medium">{project.department?.name ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Academic Session</p>
            <p className="mt-1 text-sm font-medium">{project.session ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Status</p>
            <p className={`mt-1 text-sm font-medium ${overallColor}`}>{overallStatus}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Milestones</CardTitle>
          <CardDescription>Track your project stages and completion status.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[420px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border-strong text-left text-xs text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">Milestone</th>
                <th className="pb-2 pr-4 font-medium">Status</th>
                <th className="pb-2 font-medium">Due date</th>
              </tr>
            </thead>
            <tbody>
              {project.milestones.map((m) => (
                <tr key={m.id} className="border-b border-border/60 last:border-0">
                  <td className="py-3 pr-4 font-medium">{m.name}</td>
                  <td className={`py-3 pr-4 ${STATUS_COLOR[m.status]}`}>{STATUS_LABEL[m.status]}</td>
                  <td className="py-3 text-muted-foreground">{m.dueDate ? formatDate(m.dueDate) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-4" /> Project Documents
          </CardTitle>
          <CardDescription>View your submitted chapters, versions, and review status.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col">
          {project.milestones
            .filter((m) => m.submissions.length > 0)
            .map((m) => {
              const latest = m.submissions[0];
              return (
                <div key={m.id} className="flex items-center justify-between gap-3 border-b border-border/60 py-3 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{m.name}</p>
                    <p className="text-xs text-muted-foreground">Submitted · PDF · {formatDateTime(latest.submittedAt)}</p>
                  </div>
                  <span className={`shrink-0 text-xs font-medium ${STATUS_COLOR[m.status]}`}>
                    {m.status === "UNDER_REVIEW" ? "Under Review" : m.status === "APPROVED" ? "Reviewed" : STATUS_LABEL[m.status]}
                  </span>
                </div>
              );
            })}
          {project.milestones.every((m) => m.submissions.length === 0) && (
            <p className="py-4 text-sm text-muted-foreground">No documents submitted yet.</p>
          )}
          <Link href="/student/submissions" className="mt-3 flex w-fit items-center gap-1 text-sm text-brand-700 hover:underline">
            View all submissions <ArrowRight className="size-3.5" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
