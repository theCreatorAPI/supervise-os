import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { RiskBadge } from "@/components/supervise/risk-badge";
import { MilestoneStatusBadge } from "@/components/supervise/milestone-status-badge";
import { ProgressConstellation } from "@/components/supervise/progress-constellation";
import { MilestoneDueDateEditor } from "@/components/supervise/milestone-due-date-editor";
import { AuditLog } from "@/components/supervise/audit-log";
import { initials, formatDateTime } from "@/lib/utils";
import { ChevronLeft, Mail, Search } from "lucide-react";

export default async function LecturerProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const session = await auth();
  if (!session?.user) return null;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      student: true,
      milestones: {
        orderBy: { order: "asc" },
        include: { submissions: { orderBy: { version: "desc" }, include: { reviews: true } } },
      },
      meetings: { orderBy: { scheduledAt: "desc" }, take: 3 },
      auditEvents: { orderBy: { createdAt: "desc" }, take: 15 },
    },
  });

  if (!project) notFound();
  if (project.status !== "ACTIVE" && project.supervisorId !== session.user.id) redirect("/lecturer");
  if (project.supervisorId !== session.user.id) redirect("/lecturer");

  const reasons: string[] = JSON.parse(project.riskReasons || "[]");

  return (
    <div className="flex flex-col gap-6">
      <Link href="/lecturer/students" className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" /> Back to students
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Avatar className="size-12">
            <AvatarFallback className="text-sm">{initials(project.student.name)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <RiskBadge level={project.riskLevel} />
              {project.status !== "ACTIVE" && <Badge variant="outline">{project.status}</Badge>}
            </div>
            <h1 className="font-display text-2xl font-bold md:text-3xl">{project.student.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{project.title}</p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Mail className="size-3" /> {project.student.email}
            </p>
          </div>
        </div>
      </div>

      {reasons.length > 0 && (
        <Card className={project.riskLevel === "CRITICAL" ? "glow-critical" : "glow-warn"}>
          <CardContent className="flex flex-col gap-2 py-4">
            <p className="text-sm font-semibold text-warn-700">Risk factors</p>
            <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
              {reasons.map((r) => (
                <li key={r} className="flex items-start gap-2">
                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-warn-700" /> {r}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Progress Constellation</CardTitle>
        </CardHeader>
        <CardContent>
          <ProgressConstellation milestones={project.milestones} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Milestones</CardTitle>
          <CardDescription>Review submissions, adjust due dates.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {project.milestones.map((m) => {
            const latest = m.submissions[0];
            return (
              <div key={m.id} className="rounded-xl border border-border-strong bg-black/[0.02] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">M{m.order}</Badge>
                    <span className="text-sm font-semibold">{m.name}</span>
                    <MilestoneStatusBadge status={m.status} />
                  </div>
                  <MilestoneDueDateEditor milestoneId={m.id} dueDate={m.dueDate} />
                </div>
                {latest ? (
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>
                      v{latest.version} · {latest.fileName} · submitted {formatDateTime(latest.submittedAt)}
                    </span>
                    {m.status === "UNDER_REVIEW" && (
                      <Button size="sm" asChild>
                        <Link href={`/lecturer/review/${latest.id}`}>
                          <Search className="size-3.5" /> Review
                        </Link>
                      </Button>
                    )}
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-muted-foreground">No submissions yet.</p>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent meetings</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {project.meetings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No meetings scheduled yet.</p>
          ) : (
            project.meetings.map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-lg bg-black/[0.02] px-3 py-2 text-sm">
                <span>{m.title}</span>
                <span className="text-xs text-muted-foreground">{formatDateTime(m.scheduledAt)}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activity log</CardTitle>
          <CardDescription>Every recorded action on this project.</CardDescription>
        </CardHeader>
        <CardContent>
          <AuditLog events={project.auditEvents} />
        </CardContent>
      </Card>
    </div>
  );
}
