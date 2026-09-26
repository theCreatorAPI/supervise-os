import { cookies } from "next/headers";

/**
 * Academic sessions, written the way universities write them: "2025/2026".
 *
 * A session is the intake a student belongs to. It is stamped on the student
 * when their supervisor invites them and copied onto the project when their
 * topic is approved, so a 2025 cohort stays separate from a 2026 one even though
 * both are supervised by the same lecturer.
 *
 * Note the two columns are spelled differently: `User.academicSession` and
 * `Project.session`. They are the same concept. `Project.session` predates this
 * and is read by the already-deployed app, so renaming it would break production
 * the moment the migration ran and before the new build went out.
 */

/** Cookie holding the session a lecturer is currently looking at. */
export const SESSION_COOKIE = "academic-session";

/**
 * The session a date falls in. University years start in the autumn, so
 * September onwards belongs to the year that is starting, not the one ending.
 */
export function currentAcademicSession(date: Date = new Date()): string {
  const year = date.getFullYear();
  const startYear = date.getMonth() >= 8 ? year : year - 1;
  return `${startYear}/${startYear + 1}`;
}

/** Sorts newest first, which is the order a lecturer wants to see them in. */
export function sortSessions(sessions: string[]): string[] {
  return [...new Set(sessions)].sort((a, b) => b.localeCompare(a));
}

/**
 * Resolves which session to show.
 *
 * Falls back to the newest available rather than the current calendar one: a
 * lecturer whose students are all from last year should see their students, not
 * an empty screen for a session nobody has been enrolled into yet.
 */
export async function getSelectedSession(available: string[]): Promise<string> {
  const options = sortSessions([...available, currentAcademicSession()]);
  const stored = (await cookies()).get(SESSION_COOKIE)?.value;

  if (stored && options.includes(stored)) return stored;

  return options.find((s) => available.includes(s)) ?? options[0];
}

/**
 * The sessions a supervisor has people in, and which one they are looking at.
 *
 * Draws on both projects and invited students: a student invited into a new
 * session has no project until their topic is approved, and that session still
 * has to be selectable or the supervisor could never reach their own approvals
 * queue.
 */
export async function getSupervisorSessions(lecturerId: string) {
  const { prisma } = await import("./prisma");

  const [projectSessions, studentSessions] = await Promise.all([
    prisma.project.findMany({
      where: { supervisorId: lecturerId, session: { not: null } },
      select: { session: true },
      distinct: ["session"],
    }),
    prisma.user.findMany({
      where: { pendingSupervisorId: lecturerId, academicSession: { not: null } },
      select: { academicSession: true },
      distinct: ["academicSession"],
    }),
  ]);

  const available = [
    ...projectSessions.map((p) => p.session as string),
    ...studentSessions.map((s) => s.academicSession as string),
  ];

  const sessions = sortSessions([...available, currentAcademicSession()]);
  const selected = await getSelectedSession(available);

  return { sessions, selected };
}
