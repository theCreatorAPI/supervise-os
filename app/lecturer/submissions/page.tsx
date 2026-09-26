import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSupervisorSessions } from "@/lib/academic-session";
import { submissionStatus } from "@/lib/submission-status";
import { formatDate, cn } from "@/lib/utils";

/**
 * Every submission across the lecturer's students, newest first.
 *
 * Filtering runs on the server through searchParams rather than client state,
 * matching the roster page — it keeps the result shareable as a URL and avoids
 * shipping the whole submission list to the browser just to filter it.
 */

const FILTERS = [
  { key: "all", label: "All statuses" },
  { key: "under-review", label: "Under review" },
  { key: "correction", label: "Correction required" },
  { key: "approved", label: "Approved" },
];

/** The date windows the flow spec's "All dates" control offers. */
const DATE_RANGES = [
  { key: "all", label: "All dates", days: null },
  { key: "7d", label: "Last 7 days", days: 7 },
  { key: "30d", label: "Last 30 days", days: 30 },
  { key: "90d", label: "Last 90 days", days: 90 },
];

/** Rebuilds the query string with one key changed, so filters compose. */
function buildHref(params: Record<string, string | undefined>, changes: Record<string, string | undefined>) {
  const next = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...params, ...changes })) {
    if (v && v !== "all") next.set(k, v);
  }
  const qs = next.toString();
  return qs ? `/lecturer/submissions?${qs}` : "/lecturer/submissions";
}

export default async function LecturerSubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; range?: string }>;
}) {
  const session = await auth();
  if (!session?.user) return null;
  const params = await searchParams;
  const { status, q, range } = params;

  const { selected } = await getSupervisorSessions(session.user.id);

  const submissions = await prisma.submission.findMany({
    where: { milestone: { project: { supervisorId: session.user.id, session: selected } } },
    include: {
      reviews: true,
      milestone: { include: { project: { include: { student: true } } } },
    },
    orderBy: { submittedAt: "desc" },
    take: 200,
  });

  const rows = submissions.map((s) => ({
    id: s.id,
    student: s.milestone.project.student.name,
    project: s.milestone.project.title,
    milestone: s.milestone.name,
    version: s.version,
    submittedAt: s.submittedAt,
    status: submissionStatus(s.reviews),
  }));

  let filtered = status && status !== "all" ? rows.filter((r) => r.status.key === status) : rows;

  const window = DATE_RANGES.find((d) => d.key === range)?.days ?? null;
  if (window) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - window);
    filtered = filtered.filter((r) => r.submittedAt >= cutoff);
  }
  if (q) {
    const needle = q.toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.student.toLowerCase().includes(needle) ||
        r.project.toLowerCase().includes(needle) ||
        r.milestone.toLowerCase().includes(needle)
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold md:text-3xl">Submissions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review and manage submissions from your students.
        </p>
      </div>

      <form className="flex flex-wrap items-center gap-2" action="/lecturer/submissions">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search students, projects or milestones..."
          className="h-10 min-w-55 flex-1 rounded-lg border border-border-strong bg-white px-4 text-sm outline-none focus:border-brand-600"
        />
        {status && <input type="hidden" name="status" value={status} />}
        {range && <input type="hidden" name="range" value={range} />}
      </form>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={buildHref(params, { status: f.key })}
            className={cn(
              "rounded-full border px-3.5 py-2 text-xs font-medium transition-colors",
              (status ?? "all") === f.key
                ? "border-brand-600/50 bg-brand-500 text-white"
                : "border-border-strong bg-black/2 text-muted-foreground hover:bg-black/6"
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {DATE_RANGES.map((d) => (
          <Link
            key={d.key}
            href={buildHref(params, { range: d.key })}
            className={cn(
              "rounded-full border px-3.5 py-2 text-xs font-medium transition-colors",
              (range ?? "all") === d.key
                ? "border-brand-600/50 bg-brand-600 text-white"
                : "border-border-strong bg-white text-muted-foreground hover:bg-black/5"
            )}
          >
            {d.label}
          </Link>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            {rows.length === 0
              ? "No submissions yet. They'll appear here the moment a student uploads one."
              : "No submissions match that search."}
          </CardContent>
        </Card>
      ) : (
        <Card>
          {/* Desktop: a table, as in the flow spec */}
          <CardContent className="hidden overflow-x-auto p-0 md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-6 py-4 font-medium">Student</th>
                  <th className="px-6 py-4 font-medium">Project</th>
                  <th className="px-6 py-4 font-medium">Submission</th>
                  <th className="px-6 py-4 font-medium">Submitted</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-border/60 last:border-0">
                    <td className="px-6 py-4 font-medium">{r.student}</td>
                    <td className="max-w-70 truncate px-6 py-4 text-muted-foreground">{r.project}</td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {r.milestone} <span className="text-xs">· v{r.version}</span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-muted-foreground">
                      {formatDate(r.submittedAt)}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={r.status.variant}>{r.status.label}</Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button size="sm" variant="secondary" asChild>
                        <Link href={`/lecturer/review/${r.id}`}>Review</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>

          {/* Mobile: the same rows as stacked cards — a six-column table can't shrink this far */}
          <CardContent className="flex flex-col gap-3 md:hidden">
            {filtered.map((r) => (
              <Link
                key={r.id}
                href={`/lecturer/review/${r.id}`}
                className="flex flex-col gap-2 rounded-xl border border-border-strong bg-black/[0.02] p-3 transition-colors hover:bg-black/[0.05]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{r.student}</p>
                    <p className="truncate text-xs text-muted-foreground">{r.project}</p>
                  </div>
                  <Badge variant={r.status.variant}>{r.status.label}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {r.milestone} · v{r.version} · {formatDate(r.submittedAt)}
                </p>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
