import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { History as HistoryIcon, ArrowRight } from "lucide-react";

export default async function SubmissionsPage() {
  const session = await auth();
  if (!session?.user) return null;

  const project = await prisma.project.findFirst({
    where: { studentId: session.user.id },
    include: {
      milestones: {
        orderBy: { order: "asc" },
        include: {
          submissions: {
            orderBy: { version: "desc" },
            include: { reviews: true },
          },
        },
      },
    },
  });

  const allSubmissions = (project?.milestones ?? []).flatMap((m) =>
    m.submissions.map((s) => ({ ...s, milestoneId: m.id, milestoneName: m.name, milestoneStatus: m.status }))
  );
  allSubmissions.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());

  const latestPerMilestone = (project?.milestones ?? [])
    .filter((m) => m.submissions.length > 0)
    .map((m) => ({ milestone: m, submission: m.submissions[0] }));

  const submittedCount = latestPerMilestone.length;
  const reviewedCount = latestPerMilestone.filter((x) => x.milestone.status === "APPROVED" || x.milestone.status === "RETURNED").length;
  const underReviewCount = latestPerMilestone.filter((x) => x.milestone.status === "UNDER_REVIEW").length;

  const needsAttention = latestPerMilestone.find((x) => x.milestone.status === "UNDER_REVIEW" || x.milestone.status === "RETURNED");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold md:text-3xl">Submissions</h1>
        <p className="mt-1 text-sm text-muted-foreground">Track your submitted work and respond to reviews.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Submission Status</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4">
          <div>
            <p className="font-display text-3xl font-bold">{submittedCount}</p>
            <p className="text-xs text-muted-foreground">Submitted</p>
          </div>
          <div>
            <p className="font-display text-3xl font-bold text-success-700">{reviewedCount}</p>
            <p className="text-xs text-muted-foreground">Reviewed</p>
          </div>
          <div>
            <p className="font-display text-3xl font-bold text-warn-700">{underReviewCount}</p>
            <p className="text-xs text-muted-foreground">Under Review</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Submissions</CardTitle>
          <CardDescription>Your latest submitted project work.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col">
          {allSubmissions.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <HistoryIcon className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Nothing submitted yet.</p>
            </div>
          ) : (
            allSubmissions.slice(0, 8).map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 border-b border-border/60 py-3 last:border-0">
                <div>
                  <p className="text-sm font-medium">{s.milestoneName}</p>
                  <p className="text-xs text-muted-foreground">Submitted {formatDate(s.submittedAt)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Badge
                    variant={s.milestoneStatus === "APPROVED" ? "onSchedule" : s.milestoneStatus === "RETURNED" ? "overdue" : "brandSoft"}
                  >
                    {s.milestoneStatus === "UNDER_REVIEW" ? "Under Review" : s.milestoneStatus === "APPROVED" ? "Reviewed" : s.milestoneStatus === "RETURNED" ? "Returned" : "Submitted"}
                  </Badge>
                  <Link
                    href={`/student/submit/${s.milestoneId}`}
                    className="flex items-center gap-1 text-xs text-brand-700 hover:underline"
                  >
                    View details <ArrowRight className="size-3" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {needsAttention && (
        <Card>
          <CardHeader>
            <CardTitle>Action Required</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold">
                {needsAttention.milestone.name} is currently{" "}
                {needsAttention.milestone.status === "UNDER_REVIEW" ? "under review." : "returned for correction."}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {needsAttention.milestone.status === "UNDER_REVIEW"
                  ? "No action is required until your supervisor provides feedback."
                  : "Resubmit your work with the requested corrections."}
              </p>
            </div>
            <Badge variant={needsAttention.milestone.status === "UNDER_REVIEW" ? "brandSoft" : "overdue"}>
              {needsAttention.milestone.status === "UNDER_REVIEW" ? "Under Review" : "Returned"}
            </Badge>
          </CardContent>
        </Card>
      )}

      {!project && (
        <p className="text-sm text-muted-foreground">
          You don&apos;t have a project yet.{" "}
          <Link href="/student/project-approval" className="text-brand-700 hover:underline">
            Propose a topic
          </Link>{" "}
          to get started.
        </p>
      )}
    </div>
  );
}
