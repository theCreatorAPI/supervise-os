import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { RiskBadge } from "@/components/supervise/risk-badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { initials, cn } from "@/lib/utils";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "CRITICAL", label: "Critical" },
  { key: "AT_RISK", label: "At Risk" },
  { key: "NORMAL", label: "Normal" },
];

export default async function ManagementStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ risk?: string; q?: string }>;
}) {
  const { risk, q } = await searchParams;

  const projects = await prisma.project.findMany({
    include: { student: true, supervisor: true, milestones: true },
    orderBy: { createdAt: "desc" },
  });

  let filtered = risk && risk !== "all" ? projects.filter((p) => p.riskLevel === risk) : projects;
  if (q) {
    const needle = q.toLowerCase();
    filtered = filtered.filter(
      (p) => p.student.name.toLowerCase().includes(needle) || p.title.toLowerCase().includes(needle)
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold md:text-3xl">All students</h1>
        <p className="mt-1 text-sm text-muted-foreground">{projects.length} students across the department.</p>
      </div>

      <form className="flex flex-wrap items-center gap-2" action="/management/students">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search by name or project title..."
          className="h-10 flex-1 min-w-[200px] rounded-xl border border-border-strong bg-black/[0.03] px-4 text-sm outline-none focus:border-brand/60"
        />
        {risk && <input type="hidden" name="risk" value={risk} />}
      </form>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.key === "all" ? "/management/students" : `/management/students?risk=${f.key}`}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
              (risk ?? "all") === f.key
                ? "border-brand-600/50 bg-brand-500 text-white"
                : "border-border-strong bg-black/[0.02] text-muted-foreground hover:bg-black/[0.06]"
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-muted-foreground">No students match.</CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((p) => {
            const approved = p.milestones.filter((m) => m.status === "APPROVED").length;
            const pct = (approved / p.milestones.length) * 100;
            return (
              <Link key={p.id} href={`/management/students/${p.id}`}>
                <Card className="transition-transform hover:-translate-y-0.5">
                  <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:gap-6">
                    <div className="flex items-center gap-3 sm:w-64">
                      <Avatar>
                        <AvatarFallback>{initials(p.student.name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{p.student.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{p.supervisor.name}</p>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {approved}/{p.milestones.length} milestones
                        </span>
                        <span>{Math.round(pct)}%</span>
                      </div>
                      <ProgressBar value={pct} gradient={p.riskLevel === "CRITICAL" ? "from-critical-600 to-critical-500" : p.riskLevel === "AT_RISK" ? "from-warn-600 to-warn-500" : "from-brand-600 to-brand-500"} />
                    </div>
                    <div className="flex items-center gap-3">
                      {p.status !== "ACTIVE" && <Badge variant="outline">{p.status}</Badge>}
                      <RiskBadge level={p.riskLevel} />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
