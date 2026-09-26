import type { ReviewDecision } from "@prisma/client";

/**
 * A submission's status is derived rather than stored: the newest review on it
 * decides, and an unreviewed submission is simply still waiting.
 *
 * Shared by the supervisor and management submission screens so a submission
 * cannot read "Under Review" on one and "Correction Required" on the other.
 */

export type SubmissionStatusKey = "under-review" | "correction" | "approved";

export type SubmissionStatus = {
  key: SubmissionStatusKey;
  label: string;
  variant: "brandSoft" | "overdue" | "onSchedule";
};

const UNDER_REVIEW: SubmissionStatus = { key: "under-review", label: "Under Review", variant: "brandSoft" };
const CORRECTION: SubmissionStatus = { key: "correction", label: "Correction Required", variant: "overdue" };
const APPROVED: SubmissionStatus = { key: "approved", label: "Approved", variant: "onSchedule" };

export function submissionStatus(
  reviews: { decision: ReviewDecision | string; createdAt: Date }[]
): SubmissionStatus {
  if (reviews.length === 0) return UNDER_REVIEW;

  const latest = [...reviews].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];

  if (latest.decision === "APPROVED") return APPROVED;
  if (latest.decision === "RETURNED") return CORRECTION;

  // A comment-only review leaves the submission awaiting a decision.
  return UNDER_REVIEW;
}
