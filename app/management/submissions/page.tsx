import { prisma } from "@/lib/prisma";
import { StatCards } from "@/components/supervise/stat-cards";
import { AttentionPanel, ActivityFeed } from "@/components/supervise/detail-summary";
import { submissionStatus } from "@/lib/submission-status";
import { timeAgo } from "@/lib/utils";

const DAY = 1000 * 60 * 60 * 24;

/** The flow sheet's "under review for more than 3 days" prompt. */
const SLOW_REVIEW_DAYS = 3;

/**
 * Past this, a submission is genuinely overdue rather than merely slow. It
 * matches the risk engine's REVIEW_OVERDUE threshold on purpose, so this screen
 * and the At Risk screen never disagree about the same submission.
 */
const OVERDUE_REVIEW_DAYS = 21;

export default async function ManagementSubmissionsPage() {
  const submissions = await prisma.submission.findMany({
    include: {
      reviews: true,
      milestone: { include: { project: { include: { student: true } } } },
    },
    orderBy: { submittedAt: "desc" },
    take: 500,
  });

  const rows = submissions.map((s) => ({
    id: s.id,
    student: s.milestone.project.student.name,
    studentId: s.milestone.project.studentId,
    milestone: s.milestone.name,
    version: s.version,
    submittedAt: s.submittedAt,
    status: submissionStatus(s.reviews),
  }));

  const underReview = rows.filter((r) => r.status.key === "under-review");
  const corrections = rows.filter((r) => r.status.key === "correction");
  const approved = rows.filter((r) => r.status.key === "approved");

  // eslint-disable-next-line react-hooks/purity -- Date.now() in a Server Component's data fetch, not a render-path computation
  const now = Date.now();
  const slowReviews = underReview.filter((r) => now - r.submittedAt.getTime() > SLOW_REVIEW_DAYS * DAY);
  const overdueReviews = underReview.filter((r) => now - r.submittedAt.getTime() > OVERDUE_REVIEW_DAYS * DAY);
  const studentsWithCorrections = new Set(corrections.map((r) => r.studentId)).size;

  // Only real conditions are listed: an empty panel says so rather than inventing
  // reassuring copy.
  const attention = [
    slowReviews.length > 0 &&
      `${slowReviews.length} submission${slowReviews.length === 1 ? " has" : "s have"} been under review for more than ${SLOW_REVIEW_DAYS} days`,
    studentsWithCorrections > 0 &&
      `${studentsWithCorrections} student${studentsWithCorrections === 1 ? " has" : "s have"} outstanding corrections`,
    overdueReviews.length > 0 &&
      `${overdueReviews.length} submission${overdueReviews.length === 1 ? " is" : "s are"} past their expected review date`,
  ].filter(Boolean) as string[];

  const stats = [
    { label: "Total Submissions", value: rows.length },
    { label: "Under Review", value: underReview.length, tone: "brand" as const },
    { label: "Correction Required", value: corrections.length, tone: "critical" as const },
    { label: "Approved", value: approved.length, tone: "success" as const },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold md:text-3xl">Submissions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Monitor submission activity and identify items requiring attention.
        </p>
      </div>

      <StatCards stats={stats} />

      <AttentionPanel
        title="Attention Required"
        description="Submission items that may require administrative follow-up."
        items={attention}
        emptyLabel="Nothing needs administrative follow-up right now."
      />

      <ActivityFeed
        title="Recent Submission Activity"
        description="Latest submission events across the department."
        emptyLabel="No submissions yet."
        items={rows.slice(0, 8).map((r) => ({
          id: r.id,
          text: `${r.student} submitted ${r.milestone} (v${r.version}) — ${r.status.label}`,
          when: timeAgo(r.submittedAt),
        }))}
      />
    </div>
  );
}
