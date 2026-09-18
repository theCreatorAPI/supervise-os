import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { AddStudentDialog } from "@/components/supervise/add-student-dialog";
import { summariseProject, statusBadgeVariant } from "@/lib/project-status";
import { cn } from "@/lib/utils";

/** The status vocabulary the supervisor flow filters on. */
const FILTERS = [
  { key: "all", label: "All Students" },
  { key: "in-progress", label: "Active" },
  { key: "attention", label: "Needs Attention" },
  { key: "completed", label: "Completed" },
];

const SORTS = [
  { key: "recent", label: "Most recent" },
  { key: "name", label: "Student name" },
  { key: "progress", label: "Progress" },
];

const PER_PAGE = 6;

/** Rebuilds the current query string with one key changed — keeps filter, sort and search together. */
function buildHref(params: Record<string, string | undefined>, changes: Record<string, string | undefined>) {
  const next = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...params, ...changes })) {
    if (v && v !== "all" && !(k === "page" && v === "1")) next.set(k, v);
  }
  const qs = next.toString();
  return qs ? `/lecturer/students?${qs}` : "/lecturer/students";
}

export default async function LecturerStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; sort?: string; page?: string }>;
}) {
  const session = await auth();
  if (!session?.user) return null;
  const params = await searchParams;
  const { status, q, sort } = params;

  const projects = await prisma.project.findMany({
    where: { supervisorId: session.user.id },
    include: { student: true, milestones: true },
    orderBy: { createdAt: "desc" },
  });

  let rows = projects.map((p) => ({
    id: p.id,
    student: p.student.name,
    title: p.title,
    createdAt: p.createdAt,
    summary: summariseProject(p, p.milestones),
  }));

  if (status && status !== "all") rows = rows.filter((r) => r.summary.status.key === status);

  if (q) {
    const needle = q.toLowerCase();
    rows = rows.filter(
      (r) => r.student.toLowerCase().includes(needle) || r.title.toLowerCase().includes(needle)
    );
  }

  if (sort === "name") rows.sort((a, b) => a.student.localeCompare(b.student));
  else if (sort === "progress") rows.sort((a, b) => b.summary.progress - a.summary.progress);

  const totalPages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
  const page = Math.min(Math.max(1, Number(params.page) || 1), totalPages);
  const pageRows = rows.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold md:text-3xl">My Students</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage and monitor students under your supervision
          </p>
        </div>
        <AddStudentDialog />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <form className="min-w-55 flex-1" action="/lecturer/students">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search students..."
            className="h-10 w-full rounded-lg border border-border-strong bg-white px-4 text-sm outline-none focus:border-brand-600"
          />
          {status && <input type="hidden" name="status" value={status} />}
          {sort && <input type="hidden" name="sort" value={sort} />}
        </form>

        {/* Sort is a set of links rather than a <select>, so it needs no client JS */}
        <div className="flex items-center gap-1 rounded-lg border border-border-strong bg-white p-1">
          {SORTS.map((s) => (
            <Link
              key={s.key}
              href={buildHref(params, { sort: s.key, page: undefined })}
              className={cn(
                "rounded-md px-3 py-2 text-xs font-medium transition-colors",
                (sort ?? "recent") === s.key
                  ? "bg-brand-500 text-white"
                  : "text-muted-foreground hover:bg-black/5"
              )}
            >
              {s.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={buildHref(params, { status: f.key, page: undefined })}
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

      {pageRows.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            {projects.length === 0
              ? "No students yet. Add your first one to get started."
              : "No students match this filter."}
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {pageRows.map((r) => (
            <Card key={r.id}>
              <CardContent className="flex flex-col gap-4 py-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{r.student}</p>
                    <p className="truncate text-xs text-muted-foreground">{r.title}</p>
                  </div>
                  <Badge variant={statusBadgeVariant(r.summary.status.key)}>{r.summary.status.label}</Badge>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>Project Progress</span>
                      <span className="font-medium text-foreground">{r.summary.progress}%</span>
                    </div>
                    <ProgressBar value={r.summary.progress} />
                  </div>

                  <div className="flex items-end justify-between gap-6 sm:justify-start">
                    <div>
                      <p className="text-xs text-muted-foreground">Current Chapter</p>
                      <p className="mt-0.5 text-sm font-semibold">
                        {r.summary.currentMilestone?.name ?? "—"}
                      </p>
                    </div>
                    <Button size="sm" asChild>
                      <Link href={`/lecturer/students/${r.id}`}>View Project</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button size="sm" variant="secondary" disabled={page === 1} asChild={page !== 1}>
            {page === 1 ? (
              <span>Previous</span>
            ) : (
              <Link href={buildHref(params, { page: String(page - 1) })}>Previous</Link>
            )}
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={buildHref(params, { page: String(n) })}
              aria-current={n === page ? "page" : undefined}
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-lg border text-sm font-medium transition-colors",
                n === page
                  ? "border-brand-600/50 bg-brand-500 text-white"
                  : "border-border-strong bg-white text-muted-foreground hover:bg-black/5"
              )}
            >
              {n}
            </Link>
          ))}
          <Button size="sm" variant="secondary" disabled={page === totalPages} asChild={page !== totalPages}>
            {page === totalPages ? (
              <span>Next</span>
            ) : (
              <Link href={buildHref(params, { page: String(page + 1) })}>Next</Link>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
