import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { RiskBadge, riskGlowClass } from "@/components/supervise/risk-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials, cn } from "@/lib/utils";
import { ShieldAlert } from "lucide-react";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "CRITICAL", label: "Critical" },
  { key: "AT_RISK", label: "At Risk" },
];

export default async function ManagementAtRiskPage({
  searchParams,
}: {
  searchParams: Promise<{ risk?: string; supervisorId?: string }>;
}) {
  const { risk, supervisorId } = await searchParams;
  const levels = (risk === "CRITICAL" ? ["CRITICAL"] : risk === "AT_RISK" ? ["AT_RISK"] : ["AT_RISK", "CRITICAL"]) as (
    | "AT_RISK"
    | "CRITICAL"
  )[];

  const [projects, lecturers] = await Promise.all([
    prisma.project.findMany({
      where: { riskLevel: { in: levels }, ...(supervisorId ? { supervisorId } : {}) },
      include: { student: true, supervisor: true },
    }),
    prisma.user.findMany({ where: { role: "LECTURER" }, orderBy: { name: "asc" } }),
  ]);

  const sorted = [...projects].sort((a, b) => (a.riskLevel === b.riskLevel ? 0 : a.riskLevel === "CRITICAL" ? -1 : 1));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold md:text-3xl">Department-wide risk</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {sorted.length} project{sorted.length === 1 ? "" : "s"} flagged across every lecturer.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => {
          const params = new URLSearchParams();
          if (f.key !== "all") params.set("risk", f.key);
          if (supervisorId) params.set("supervisorId", supervisorId);
          const href = params.toString() ? `/management/at-risk?${params}` : "/management/at-risk";
          return (
            <Link
              key={f.key}
              href={href}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                (risk ?? "all") === f.key
                  ? "border-brand-600/50 bg-brand-500 text-white"
                  : "border-border-strong bg-black/[0.02] text-muted-foreground hover:bg-black/[0.06]"
              )}
            >
              {f.label}
            </Link>
          );
        })}
        <span className="mx-1 h-4 w-px bg-border-strong" />
        <Link
          href={risk ? `/management/at-risk?risk=${risk}` : "/management/at-risk"}
          className={cn(
            "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
            !supervisorId
              ? "border-brand-600/50 bg-brand-500 text-white"
              : "border-border-strong bg-black/[0.02] text-muted-foreground hover:bg-black/[0.06]"
          )}
        >
          All supervisors
        </Link>
        {lecturers.map((l) => {
          const params = new URLSearchParams();
          if (risk) params.set("risk", risk);
          params.set("supervisorId", l.id);
          return (
            <Link
              key={l.id}
              href={`/management/at-risk?${params}`}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                supervisorId === l.id
                  ? "border-brand-600/50 bg-brand-500 text-white"
                  : "border-border-strong bg-black/[0.02] text-muted-foreground hover:bg-black/[0.06]"
              )}
            >
              {l.name}
            </Link>
          );
        })}
      </div>

      {sorted.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <ShieldAlert className="size-8 text-success-700" />
            <p className="text-sm text-muted-foreground">Nothing flagged department-wide. Impressive.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {sorted.map((p) => {
            const reasons: string[] = JSON.parse(p.riskReasons || "[]");
            return (
              <Link key={p.id} href={`/management/students/${p.id}`}>
                <Card className={riskGlowClass(p.riskLevel)}>
                  <CardContent className="flex flex-col gap-3 py-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{initials(p.student.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold">{p.student.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {p.title} · supervised by {p.supervisor.name}
                          </p>
                        </div>
                      </div>
                      <RiskBadge level={p.riskLevel} />
                    </div>
                    <ul className="flex flex-col gap-1 pl-1 text-sm text-muted-foreground">
                      {reasons.map((r) => (
                        <li key={r} className="flex items-start gap-2">
                          <span className="mt-1.5 size-1 shrink-0 rounded-full bg-warn-700" /> {r}
                        </li>
                      ))}
                    </ul>
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
