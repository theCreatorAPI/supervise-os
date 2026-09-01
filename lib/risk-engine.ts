import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";
import type { RiskLevel, RiskIndicatorType } from "@prisma/client";

const DAY = 1000 * 60 * 60 * 24;

export const INDICATOR_LABELS: Record<RiskIndicatorType, string> = {
  STALE_SUBMISSION: "No submission for 21+ days",
  MILESTONE_OVERDUE: "Milestone due date passed",
  REPEATED_RETURNS: "Milestone returned 2+ times in a row",
  REVIEW_OVERDUE: "Submission awaiting review 21+ days",
  MEETING_MISSED: "Scheduled meeting missed",
};

type ReviewLite = { decision: string; createdAt: Date };
type SubmissionLite = { submittedAt: Date; reviews: ReviewLite[] };
type MilestoneLite = { name: string; status: string; dueDate: Date | null; submissions: SubmissionLite[] };
type MeetingLite = { title: string; scheduledAt: Date; completed: boolean };
type ProjectLite = {
  status: string;
  milestones: MilestoneLite[];
  meetings: MeetingLite[];
};

type DetectedIndicator = {
  type: RiskIndicatorType;
  triggeredAt: Date;
  detail: string;
};

/** Pure detection: given project data, return every currently-active indicator with the date it first crossed threshold. */
export function detectIndicators(project: ProjectLite): DetectedIndicator[] {
  const now = Date.now();
  const indicators: DetectedIndicator[] = [];
  if (project.status !== "ACTIVE") return indicators;

  // 1. Stale submission — no submission for 21+ days (only once the project has started submitting).
  const allSubmissions = project.milestones.flatMap((m) => m.submissions);
  const lastSubmission = allSubmissions.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime())[0];
  if (lastSubmission) {
    const staleAt = new Date(lastSubmission.submittedAt.getTime() + 21 * DAY);
    if (staleAt.getTime() <= now) {
      const days = Math.floor((now - lastSubmission.submittedAt.getTime()) / DAY);
      indicators.push({
        type: "STALE_SUBMISSION",
        triggeredAt: staleAt,
        detail: `No submission in ${days} days`,
      });
    }
  }

  // 2. Milestone overdue — due date passed without reaching Approved.
  const overdueMilestones = project.milestones.filter(
    (m) => m.dueDate && m.dueDate.getTime() <= now && m.status !== "APPROVED"
  );
  if (overdueMilestones.length > 0) {
    const earliest = overdueMilestones.reduce((a, b) => (a.dueDate! < b.dueDate! ? a : b));
    indicators.push({
      type: "MILESTONE_OVERDUE",
      triggeredAt: earliest.dueDate!,
      detail:
        overdueMilestones.length === 1
          ? `"${earliest.name}" is past its due date`
          : `${overdueMilestones.length} milestones are past their due date (earliest: "${earliest.name}")`,
    });
  }

  // 3. Repeated returns — a milestone returned 2+ times in a row.
  const repeatOffenders: { name: string; triggeredAt: Date }[] = [];
  for (const m of project.milestones) {
    const decisions = m.submissions
      .flatMap((s) => s.reviews.map((r) => ({ decision: r.decision, createdAt: r.createdAt })))
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    let streak = 0;
    for (const d of decisions) {
      if (d.decision === "RETURNED") {
        streak++;
        if (streak === 2) repeatOffenders.push({ name: m.name, triggeredAt: d.createdAt });
      } else {
        streak = 0;
      }
    }
  }
  if (repeatOffenders.length > 0) {
    const earliest = repeatOffenders.reduce((a, b) => (a.triggeredAt < b.triggeredAt ? a : b));
    indicators.push({
      type: "REPEATED_RETURNS",
      triggeredAt: earliest.triggeredAt,
      detail: `"${earliest.name}" was returned 2+ times in a row`,
    });
  }

  // 4. Review overdue — a submission sat Under Review 21+ days without a Review record.
  const overdueReviews: { name: string; triggeredAt: Date }[] = [];
  for (const m of project.milestones) {
    if (m.status !== "UNDER_REVIEW") continue;
    const latest = m.submissions.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime())[0];
    if (!latest || latest.reviews.length > 0) continue;
    const overdueAt = new Date(latest.submittedAt.getTime() + 21 * DAY);
    if (overdueAt.getTime() <= now) overdueReviews.push({ name: m.name, triggeredAt: overdueAt });
  }
  if (overdueReviews.length > 0) {
    const earliest = overdueReviews.reduce((a, b) => (a.triggeredAt < b.triggeredAt ? a : b));
    indicators.push({
      type: "REVIEW_OVERDUE",
      triggeredAt: earliest.triggeredAt,
      detail: `"${earliest.name}" has been awaiting review 21+ days`,
    });
  }

  // 5. Meeting missed — scheduled date passed, still marked incomplete.
  const missed = project.meetings.filter((m) => !m.completed && m.scheduledAt.getTime() <= now);
  if (missed.length > 0) {
    const earliest = missed.reduce((a, b) => (a.scheduledAt < b.scheduledAt ? a : b));
    indicators.push({
      type: "MEETING_MISSED",
      triggeredAt: earliest.scheduledAt,
      detail:
        missed.length === 1
          ? `"${earliest.title}" was missed`
          : `${missed.length} scheduled meetings were missed (earliest: "${earliest.title}")`,
    });
  }

  return indicators;
}

export function computeRiskLevel(indicators: DetectedIndicator[]): RiskLevel {
  if (indicators.length === 0) return "NORMAL";
  const now = Date.now();
  const anyLongRunning = indicators.some((i) => now - i.triggeredAt.getTime() >= 35 * DAY);
  if (indicators.length >= 2 || anyLongRunning) return "CRITICAL";
  return "AT_RISK";
}

/** Recomputes risk for one project: upserts RiskIndicator rows, resolves stale ones, and updates the Project summary fields.
 *  Pass `silent: true` to skip escalation notifications (used by bulk/seed recomputation). */
export async function recomputeProjectRisk(projectId: string, options?: { silent?: boolean }) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      milestones: {
        include: { submissions: { include: { reviews: true } } },
      },
      meetings: true,
    },
  });
  if (!project) return null;

  const detected = detectIndicators(project);
  const level = computeRiskLevel(detected);
  const previousLevel = project.riskLevel;

  const existingActive = await prisma.riskIndicator.findMany({
    where: { projectId, status: "ACTIVE" },
  });
  const previousTypes = new Set(existingActive.map((r) => r.type));

  const detectedTypes = new Set(detected.map((d) => d.type));
  const newlyTriggered = detected.filter((d) => !previousTypes.has(d.type));

  // Resolve indicators that are no longer active.
  for (const row of existingActive) {
    if (!detectedTypes.has(row.type)) {
      await prisma.riskIndicator.update({
        where: { id: row.id },
        data: { status: "RESOLVED", resolvedAt: new Date() },
      });
    }
  }

  // Create or refresh active indicators.
  for (const d of detected) {
    const existing = existingActive.find((r) => r.type === d.type);
    if (existing) {
      await prisma.riskIndicator.update({
        where: { id: existing.id },
        data: { detail: d.detail, triggeredAt: d.triggeredAt },
      });
    } else {
      await prisma.riskIndicator.create({
        data: { projectId, type: d.type, detail: d.detail, triggeredAt: d.triggeredAt },
      });
    }
  }

  const reasons = detected.map((d) => d.detail);

  const updated = await prisma.project.update({
    where: { id: projectId },
    data: { riskLevel: level, riskReasons: JSON.stringify(reasons) },
  });

  if (!options?.silent) {
    const levelRank: Record<RiskLevel, number> = { NORMAL: 0, AT_RISK: 1, CRITICAL: 2 };
    if (levelRank[level] > levelRank[previousLevel]) {
      const levelLabel = level === "CRITICAL" ? "critical" : "at risk";
      await notify(project.supervisorId, `${updated.title} just became ${levelLabel}.`, `/lecturer/students/${projectId}`);
    }
    for (const d of newlyTriggered) {
      if (d.type === "MILESTONE_OVERDUE") {
        await notify(project.studentId, `A milestone is now past its due date: ${d.detail}`, "/student");
        await notify(project.supervisorId, `${updated.title}: ${d.detail}`, `/lecturer/students/${projectId}`);
      }
      if (d.type === "MEETING_MISSED") {
        await notify(project.supervisorId, `${updated.title}: ${d.detail}`, `/lecturer/meetings`, "meeting");
      }
    }
  }

  return updated;
}

export async function recomputeAllRisk() {
  const projects = await prisma.project.findMany({ where: { status: "ACTIVE" }, select: { id: true } });
  for (const p of projects) {
    await recomputeProjectRisk(p.id, { silent: true });
  }
}
