import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataPagination } from "@/components/supervise/data-pagination";
import { buildQueryHref } from "@/lib/query";

const PER_PAGE = 8;

export default async function ManagementLecturersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const { q } = params;

  const lecturers = await prisma.user.findMany({
    where: { role: "LECTURER" },
    include: {
      department: true,
      projectsSupervised: { select: { status: true } },
    },
    orderBy: { name: "asc" },
  });

  const rows = lecturers.map((l) => ({
    id: l.id,
    name: l.name,
    department: l.department?.name ?? "—",
    students: l.projectsSupervised.length,
    activeProjects: l.projectsSupervised.filter((p) => p.status === "ACTIVE").length,
  }));

  const filtered = q
    ? rows.filter((r) => {
        const needle = q.toLowerCase();
        return r.name.toLowerCase().includes(needle) || r.department.toLowerCase().includes(needle);
      })
    : rows;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const page = Math.min(Math.max(1, Number(params.page) || 1), totalPages);
  const pageRows = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold md:text-3xl">Lecturers</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage lecturers and view their supervision activities.
        </p>
      </div>

      <form className="flex flex-wrap items-center gap-2" action="/management/lecturers">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search lecturers"
          aria-label="Search lecturers"
          className="h-10 min-w-55 flex-1 rounded-lg border border-border-strong bg-white px-4 text-sm outline-none focus:border-brand-600"
        />
      </form>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            {rows.length === 0 ? "No lecturers yet." : "No lecturers match that search."}
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="hidden overflow-x-auto p-0 md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="px-6 py-4 font-medium">Lecturer</th>
                    <th className="px-6 py-4 font-medium">Department</th>
                    <th className="px-6 py-4 font-medium">Students</th>
                    <th className="px-6 py-4 font-medium">Active Projects</th>
                    <th className="px-6 py-4 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((r) => (
                    <tr key={r.id} className="border-b border-border/60 last:border-0">
                      <td className="px-6 py-4 font-medium">{r.name}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-muted-foreground">{r.department}</td>
                      <td className="px-6 py-4 text-muted-foreground">{r.students}</td>
                      <td className="px-6 py-4 text-muted-foreground">{r.activeProjects}</td>
                      <td className="px-6 py-4">
                        <Button size="sm" variant="secondary" asChild>
                          <Link href={`/management/lecturers/${r.id}`}>View</Link>
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
                  href={`/management/lecturers/${r.id}`}
                  className="flex flex-col gap-1 rounded-xl border border-border-strong bg-black/2 p-3 transition-colors hover:bg-black/5"
                >
                  <p className="truncate text-sm font-medium">{r.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{r.department}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.students} students · {r.activeProjects} active projects
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
            noun="lecturers"
            hrefFor={(n) => buildQueryHref("/management/lecturers", params, { page: String(n) })}
          />
        </>
      )}
    </div>
  );
}
