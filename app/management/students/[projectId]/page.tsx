import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { RiskBadge } from "@/components/supervise/risk-badge";
import { MilestoneStatusBadge } from "@/components/supervise/milestone-status-badge";
import { ProgressConstellation } from "@/components/supervise/progress-constellation";
import { initials, formatDate, formatDateTime } from "@/lib/utils";
import { Mail } from "lucide-react";

export default async function ManagementProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      student: true,
      supervisor: true,
      milestones: {
        orderBy: { order: "asc" },
        include: { submissions: { orderBy: { version: "desc" }, take: 1 } },
      },
      meetings: { orderBy: { scheduledAt: "desc" }, take: 5 },
    },
  });

  if (!project) notFound();
  const reasons: string[] = JSON.parse(project.riskReasons || "[]");

  return (
    <div className="flex flex-col gap-6">
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
            <Mail className="size-3" /> {project.student.email} · supervised by {project.supervisor.name}
          </p>
        </div>
      </div>

      {reasons.length > 0 && (
        <Card className={project.riskLevel === "CRITICAL" ? "glow-critical" : "glow-warn"}>
          <CardContent className="flex flex-col gap-2 py-4">
            <p className="text-sm font-semibold text-warn-300">Risk factors</p>
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
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {project.milestones.map((m) => (
            <div key={m.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border-strong bg-black/[0.02] p-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline">M{m.order}</Badge>
                <span className="text-sm font-semibold">{m.name}</span>
                <MilestoneStatusBadge status={m.status} />
              </div>
              <span className="text-xs text-muted-foreground">
                {m.dueDate ? `Due ${formatDate(m.dueDate)}` : "No due date"}
              </span>
            </div>
          ))}
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
    </div>
  );
}
