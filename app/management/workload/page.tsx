import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressRing } from "@/components/ui/progress-ring";
import { cn } from "@/lib/utils";

const SORTS: Record<string, (a: Row, b: Row) => number> = {
  students: (a, b) => b.students - a.students,
  awaiting: (a, b) => b.awaiting - a.awaiting,
  overdue: (a, b) => b.overdue - a.overdue,
  atRisk: (a, b) => b.atRisk - a.atRisk,
};

type Row = {
  id: string;
  name: string;
  title: string | null;
  students: number;
  capacity: number;
  awaiting: number;
  overdue: number;
  atRisk: number;
};

function ringColor(pct: number) {
  if (pct >= 100) return "#D9502C";
  if (pct >= 75) return "#E8912B";
  return "#F2B705";
}

export default async function ManagementWorkloadPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const { sort } = await searchParams;
  const lecturers = await prisma.user.findMany({
    where: { role: "LECTURER" },
    include: {
      projectsSupervised: {
        include: { milestones: { select: { status: true } } },
      },
    },
  });

  const rows: Row[] = lecturers.map((l) => ({
    id: l.id,
    name: l.name,
    title: l.title,
    students: l.projectsSupervised.length,
    capacity: l.maxLoad,
    awaiting: l.projectsSupervised.reduce((sum, p) => sum + p.milestones.filter((m) => m.status === "UNDER_REVIEW").length, 0),
    overdue: l.projectsSupervised.filter((p) => p.riskLevel === "CRITICAL").length,
    atRisk: l.projectsSupervised.filter((p) => p.riskLevel === "AT_RISK").length,
  }));

  const sortFn = SORTS[sort ?? "students"] ?? SORTS.students;
  rows.sort(sortFn);

  const columns = [
    { key: "students", label: "Students" },
    { key: "awaiting", label: "Awaiting review" },
    { key: "overdue", label: "Critical" },
    { key: "atRisk", label: "At risk" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold md:text-3xl">Lecturer workload</h1>
        <p className="mt-1 text-sm text-muted-foreground">Capacity at a glance — who&apos;s stretched, who has room.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {rows.map((r) => {
          const pct = Math.round((r.students / r.capacity) * 100);
          return (
            <Card key={r.id}>
              <CardContent className="flex flex-col items-center gap-3 pt-6 text-center">
                <ProgressRing value={Math.min(pct, 100)} color={ringColor(pct)}>
                  <div className="text-center">
                    <p className="font-display text-lg font-bold">{r.students}</p>
                    <p className="text-[10px] text-muted-foreground">/{r.capacity}</p>
                  </div>
                </ProgressRing>
                <div>
                  <p className="text-sm font-semibold">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.title}</p>
                </div>
                {pct >= 100 && <span className="text-[11px] font-semibold text-critical-700">Over capacity</span>}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Full breakdown</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border-strong text-left text-xs text-muted-foreground">
                <th className="pb-3 pr-4 font-medium">Lecturer</th>
                {columns.map((c) => (
                  <th key={c.key} className="pb-3 pr-4 font-medium">
                    <Link
                      href={`/management/workload?sort=${c.key}`}
                      className={cn("hover:text-foreground", (sort ?? "students") === c.key && "text-brand-700")}
                    >
                      {c.label}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border/50">
                  <td className="py-3 pr-4 font-medium">{r.name}</td>
                  <td className="py-3 pr-4">
                    {r.students}/{r.capacity}
                  </td>
                  <td className="py-3 pr-4">{r.awaiting}</td>
                  <td className="py-3 pr-4 text-critical-700">{r.overdue}</td>
                  <td className="py-3 pr-4 text-warn-700">{r.atRisk}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
