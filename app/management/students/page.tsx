import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataPagination } from "@/components/supervise/data-pagination";
import { FilterChips } from "@/components/supervise/filter-chips";
import { summariseProject, statusBadgeVariant } from "@/lib/project-status";
import { buildQueryHref } from "@/lib/query";

const PER_PAGE = 8;

const STATUS_FILTERS = [
  { key: "all", label: "All statuses" },
  { key: "in-progress", label: "In Progress" },
  { key: "on-track", label: "On Track" },
  { key: "attention", label: "Needs Attention" },
  { key: "completed", label: "Completed" },
];

export default async function ManagementStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const params = await searchParams;
  const { q, status } = params;

  const projects = await prisma.project.findMany({
    include: { student: { include: { department: true } }, supervisor: true, milestones: true },
    orderBy: { createdAt: "desc" },
  });

  const rows = projects.map((p) => ({
    id: p.id,
    student: p.student.name,
    department: p.student.department?.name ?? "—",
    supervisor: p.supervisor.name,
    title: p.title,
    summary: summariseProject(p, p.milestones),
  }));

  let filtered = status && status !== "all" ? rows.filter((r) => r.summary.status.key === status) : rows;
  if (q) {
    const needle = q.toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.student.toLowerCase().includes(needle) ||
        r.title.toLowerCase().includes(needle) ||
        r.supervisor.toLowerCase().includes(needle)
    );
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const page = Math.min(Math.max(1, Number(params.page) || 1), totalPages);
  const pageRows = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold md:text-3xl">Students</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage students and view their project supervision information.
        </p>
      </div>

      <form className="flex flex-wrap items-center gap-2" action="/management/students">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search students"
          aria-label="Search students"
          className="h-10 min-w-55 flex-1 rounded-lg border border-border-strong bg-white px-4 text-sm outline-none focus:border-brand-600"
        />
        {status && <input type="hidden" name="status" value={status} />}
      </form>

      <FilterChips
        label="Filter students by project status"
        options={STATUS_FILTERS}
        active={status}
        hrefFor={(key) => buildQueryHref("/management/students", params, { status: key, page: undefined })}
      />

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            {rows.length === 0 ? "No students yet." : "No students match that search."}
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            {/* Desktop: the flow sheet's table */}
            <CardContent className="hidden overflow-x-auto p-0 md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="px-6 py-4 font-medium">Students</th>
                    <th className="px-6 py-4 font-medium">Department</th>
                    <th className="px-6 py-4 font-medium">Supervisor</th>
                    <th className="px-6 py-4 font-medium">Project Status</th>
                    <th className="px-6 py-4 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((r) => (
                    <tr key={r.id} className="border-b border-border/60 last:border-0">
                      <td className="px-6 py-4 font-medium">{r.student}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-muted-foreground">{r.department}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-muted-foreground">{r.supervisor}</td>
                      <td className="px-6 py-4">
                        <Badge variant={statusBadgeVariant(r.summary.status.key)}>{r.summary.status.label}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Button size="sm" variant="secondary" asChild>
                          <Link href={`/management/students/${r.id}`}>View</Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>

            {/* Mobile: stacked rows */}
            <CardContent className="flex flex-col gap-3 md:hidden">
              {pageRows.map((r) => (
                <Link
                  key={r.id}
                  href={`/management/students/${r.id}`}
                  className="flex flex-col gap-2 rounded-xl border border-border-strong bg-black/2 p-3 transition-colors hover:bg-black/5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{r.student}</p>
                      <p className="truncate text-xs text-muted-foreground">{r.department}</p>
                    </div>
                    <Badge variant={statusBadgeVariant(r.summary.status.key)}>{r.summary.status.label}</Badge>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{r.supervisor}</p>
                </Link>
              ))}
            </CardContent>
          </Card>

          <DataPagination
            page={page}
            totalPages={totalPages}
            totalItems={filtered.length}
            firstItem={(page - 1) * PER_PAGE + 1}
            lastItem={Math.min(page * PER_PAGE, filtered.length)}
            noun="students"
            hrefFor={(n) => buildQueryHref("/management/students", params, { page: String(n) })}
          />
        </>
      )}
    </div>
  );
}
