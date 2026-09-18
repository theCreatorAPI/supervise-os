import type { Milestone, Project } from "@prisma/client";

/**
 * The derived figures the supervisor screens show for a project: how far along
 * it is, which chapter is live, and the one-word status badge.
 *
 * These live together because the dashboard table, the student roster and the
 * project page all display the same three things, and they must agree — a
 * project reading "82% · On Track" in one place and "In Progress" in another is
 * worse than either label alone.
 */

export type ProjectSummary = {
  /** Approved milestones as a percentage of all of them, rounded. */
  progress: number;
  approvedCount: number;
  totalCount: number;
  /** The milestone actually being worked on — the first not yet approved. */
  currentMilestone: Milestone | null;
  status: { key: "completed" | "attention" | "on-track" | "in-progress"; label: string };
};

/** Status labels, in the vocabulary the supervisor flow uses. */
const STATUS = {
  completed: { key: "completed" as const, label: "Completed" },
  attention: { key: "attention" as const, label: "Needs Attention" },
  onTrack: { key: "on-track" as const, label: "On Track" },
  inProgress: { key: "in-progress" as const, label: "In Progress" },
};

/** Past this share of milestones approved, a healthy project reads as On Track. */
const ON_TRACK_THRESHOLD = 75;

export function summariseProject(
  project: Pick<Project, "status" | "riskLevel">,
  milestones: Milestone[]
): ProjectSummary {
  const ordered = [...milestones].sort((a, b) => a.order - b.order);
  const totalCount = ordered.length;
  const approvedCount = ordered.filter((m) => m.status === "APPROVED").length;
  const progress = totalCount === 0 ? 0 : Math.round((approvedCount / totalCount) * 100);

  const currentMilestone = ordered.find((m) => m.status !== "APPROVED") ?? ordered[totalCount - 1] ?? null;

  // Order matters: a finished project is finished even if it was once flagged,
  // and a flagged one needs attention regardless of how far along it is.
  // Annotated, or `let` narrows to the initialiser's literal key and rejects the
  // other three branches.
  let status: ProjectSummary["status"] = STATUS.inProgress;
  if (project.status === "COMPLETED" || (totalCount > 0 && approvedCount === totalCount)) {
    status = STATUS.completed;
  } else if (project.riskLevel === "AT_RISK" || project.riskLevel === "CRITICAL") {
    status = STATUS.attention;
  } else if (progress >= ON_TRACK_THRESHOLD) {
    status = STATUS.onTrack;
  }

  return { progress, approvedCount, totalCount, currentMilestone, status };
}

/** Badge variant for each status, so the colour is decided once. */
export function statusBadgeVariant(key: ProjectSummary["status"]["key"]) {
  switch (key) {
    case "completed":
      return "onSchedule" as const;
    case "attention":
      return "atRisk" as const;
    case "on-track":
      return "brandSoft" as const;
    default:
      return "outline" as const;
  }
}
