import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataPagination } from "@/components/supervise/data-pagination";
import { summariseProject, statusBadgeVariant } from "@/lib/project-status";
import { buildQueryHref } from "@/lib/query";

const PER_PAGE = 8;

const STATUS_OPTIONS = [
  { key: "all", label: "All statuses" },
  { key: "in-progress", label: "In Progress" },
  { key: "on-track", label: "On Track" },
  { key: "attention", label: "Needs Attention" },
  { key: "completed", label: "Completed" },
];

/** Native selects in a GET form: the flow sheet shows dropdowns here, and this
 *  keeps filtering server-side and functional without client JavaScript. */
const SELECT_CLASS =
  "h-10 min-w-44 flex-1 rounded-lg border border-border-strong bg-white px-3 text-sm outline-none focus:border-brand-600";

export default async function ManagementProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ department?: string; supervisor?: string; status?: string; page?: string }>;
}) {
  const params = await searchParams;
  const { department, supervisor, status } = params;

  const [projects, departments, supervisors] = await Promise.all([
    prisma.project.findMany({
      include: { student: true, supervisor: true, department: true, milestones: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.department.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({ where: { role: "LECTURER" }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  const rows = projects.map((p) => ({
    id: p.id,
    title: p.title,
    student: p.student.name,
    supervisor: p.supervisor.name,
    supervisorId: p.supervisorId,
    departmentId: p.departmentId,
    summary: summariseProject(p, p.milestones),
  }));

  let filtered = rows;
  if (department && department !== "all") filtered = filtered.filter((r) => r.departmentId === department);
  if (supervisor && supervisor !== "all") filtered = filtered.filter((r) => r.supervisorId === supervisor);
  if (status && status !== "all") filtered = filtered.filter((r) => r.summary.status.key === status);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const page = Math.min(Math.max(1, Number(params.page) || 1), totalPages);
  const pageRows = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold md:text-3xl">Projects</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage student projects and view their supervision status.
        </p>
      </div>

      <form className="flex flex-wrap items-center gap-2" action="/management/projects">
        <select name="department" defaultValue={department ?? "all"} aria-label="Filter by department" className={SELECT_CLASS}>
          <option value="all">All departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>

        <select name="supervisor" defaultValue={supervisor ?? "all"} aria-label="Filter by supervisor" className={SELECT_CLASS}>
          <option value="all">All supervisors</option>
          {supervisors.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <select name="status" defaultValue={status ?? "all"} aria-label="Filter by status" className={SELECT_CLASS}>
          {STATUS_OPTIONS.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>

        <Button type="submit" variant="secondary">
          Apply
        </Button>
      </form>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            {rows.length === 0 ? "No projects yet." : "No projects match those filters."}
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="hidden overflow-x-auto p-0 md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="px-6 py-4 font-medium">Project</th>
                    <th className="px-6 py-4 font-medium">Student</th>
                    <th className="px-6 py-4 font-medium">Supervisor</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((r) => (
                    <tr key={r.id} className="border-b border-border/60 last:border-0">
                      <td className="max-w-80 truncate px-6 py-4 font-medium">{r.title}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-muted-foreground">{r.student}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-muted-foreground">{r.supervisor}</td>
                      <td className="px-6 py-4">
                        <Badge variant={statusBadgeVariant(r.summary.status.key)}>{r.summary.status.label}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Button size="sm" variant="secondary" asChild>
                          <Link href={`/management/projects/${r.id}`}>View</Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>

            <CardContent className="flex flex-col gap-3 md:hidden">
              {pageRows.map((r) => (
                <Link
                  key={r.id}
                  href={`/management/projects/${r.id}`}
                  className="flex flex-col gap-2 rounded-xl border border-border-strong bg-black/2 p-3 transition-colors hover:bg-black/5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 truncate text-sm font-medium">{r.title}</p>
                    <Badge variant={statusBadgeVariant(r.summary.status.key)}>{r.summary.status.label}</Badge>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {r.student} · {r.supervisor}
                  </p>
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
            noun="projects"
            hrefFor={(n) => buildQueryHref("/management/projects", params, { page: String(n) })}
          />
        </>
      )}
    </div>
  );
}
