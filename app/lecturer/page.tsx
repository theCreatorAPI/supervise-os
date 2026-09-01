import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RiskBadge } from "@/components/supervise/risk-badge";
import { CountUp } from "@/components/ui/count-up";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DecideProposalButtons } from "@/components/supervise/decide-proposal-buttons";
import { initials, timeAgo } from "@/lib/utils";
import { ArrowRight, AlertTriangle, Clock, Users, CheckCircle2, Search, ClipboardCheck } from "lucide-react";

export default async function LecturerDashboard() {
  const session = await auth();
  if (!session?.user) return null;

  const projects = await prisma.project.findMany({
    where: { supervisorId: session.user.id },
    include: {
      student: true,
      milestones: { include: { submissions: { orderBy: { submittedAt: "asc" } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  const activeProjects = projects.filter((p) => p.status === "ACTIVE");
  const overdue = activeProjects.filter((p) => p.riskLevel === "CRITICAL");
  const atRisk = activeProjects.filter((p) => p.riskLevel === "AT_RISK");
  const onSchedule = activeProjects.filter((p) => p.riskLevel === "NORMAL");

  const awaitingReview = projects
    .flatMap((p) =>
      p.milestones
        .filter((m) => m.status === "UNDER_REVIEW")
        .map((m) => ({
          project: p,
          milestone: m,
          submission: m.submissions[m.submissions.length - 1],
        }))
    )
    .filter((x) => x.submission)
    .sort((a, b) => a.submission.submittedAt.getTime() - b.submission.submittedAt.getTime());

  const needsAttention = [...overdue, ...atRisk].sort((a, b) => (a.riskLevel === b.riskLevel ? 0 : a.riskLevel === "CRITICAL" ? -1 : 1));

  const pendingProposals = await prisma.topicProposal.findMany({
    where: { status: "PENDING", student: { pendingSupervisorId: session.user.id } },
    include: { student: true },
    orderBy: { createdAt: "asc" },
  });

  const stats = [
    { label: "Students", value: projects.length, icon: Users, color: "text-brand-700", href: "/lecturer/students" },
    { label: "Awaiting review", value: awaitingReview.length, icon: Search, color: "text-brand-700", href: "/lecturer/students" },
    { label: "Critical", value: overdue.length, icon: AlertTriangle, color: "text-critical-700", href: "/lecturer/at-risk?risk=CRITICAL" },
    { label: "At risk", value: atRisk.length, icon: Clock, color: "text-warn-700", href: "/lecturer/at-risk?risk=AT_RISK" },
    { label: "Normal", value: onSchedule.length, icon: CheckCircle2, color: "text-success-700", href: "/lecturer/students?risk=NORMAL" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold md:text-3xl">Welcome back, {session.user.name?.split(" ")[0]}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Here&apos;s where every one of your students stands, right now.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="transition-transform hover:-translate-y-0.5">
              <CardContent className="flex flex-col gap-2 pt-6">
                <s.icon className={`size-4 ${s.color}`} />
                <p className="font-display text-3xl font-bold">
                  <CountUp value={s.value} />
                </p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {pendingProposals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="size-4 text-brand-700" /> Topic proposals awaiting your decision
            </CardTitle>
            <CardDescription>Approving one creates the student&apos;s project automatically.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {pendingProposals.map((p) => (
              <div
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-strong bg-black/[0.02] p-3"
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{initials(p.student.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{p.student.name}</p>
                    <p className="text-xs text-muted-foreground">{p.title}</p>
                  </div>
                </div>
                <DecideProposalButtons proposalId={p.id} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-warn-700" /> Needs your attention
            </CardTitle>
            <CardDescription>Projects flagged by the risk engine.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {needsAttention.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border-strong px-4 py-8 text-center text-sm text-muted-foreground">
                Nothing on fire. Everyone&apos;s on track 🎉
              </p>
            ) : (
              needsAttention.slice(0, 6).map((p) => (
                <Link
                  key={p.id}
                  href={`/lecturer/students/${p.id}`}
                  className="flex items-center gap-3 rounded-xl border border-border-strong bg-black/[0.02] p-3 transition-colors hover:bg-black/[0.05]"
                >
                  <Avatar>
                    <AvatarFallback>{initials(p.student.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.student.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{p.title}</p>
                  </div>
                  <RiskBadge level={p.riskLevel} />
                </Link>
              ))
            )}
            {needsAttention.length > 6 && (
              <Button variant="secondary" size="sm" asChild>
                <Link href="/lecturer/at-risk">
                  View all {needsAttention.length} <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="size-4 text-brand-700" /> Awaiting your review
            </CardTitle>
            <CardDescription>Oldest submissions first.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {awaitingReview.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border-strong px-4 py-8 text-center text-sm text-muted-foreground">
                Inbox zero. Nothing waiting on you.
              </p>
            ) : (
              awaitingReview.slice(0, 6).map((x) => (
                <Link
                  key={x.submission.id}
                  href={`/lecturer/review/${x.submission.id}`}
                  className="flex items-center gap-3 rounded-xl border border-border-strong bg-black/[0.02] p-3 transition-colors hover:bg-black/[0.05]"
                >
                  <Avatar>
                    <AvatarFallback>{initials(x.project.student.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {x.project.student.name} · {x.milestone.name}
                    </p>
                    <p className="text-xs text-muted-foreground">Submitted {timeAgo(x.submission.submittedAt)}</p>
                  </div>
                  <Badge variant="brand">v{x.submission.version}</Badge>
                </Link>
              ))
            )}
            {awaitingReview.length > 6 && (
              <Button variant="secondary" size="sm" asChild>
                <Link href="/lecturer/students">
                  View all students <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
