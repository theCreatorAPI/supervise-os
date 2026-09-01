import Link from "next/link";
import { auth } from "@/auth";
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

export default async function LecturerAtRiskPage({
  searchParams,
}: {
  searchParams: Promise<{ risk?: string }>;
}) {
  const session = await auth();
  if (!session?.user) return null;
  const { risk } = await searchParams;

  const levels = (risk === "CRITICAL" ? ["CRITICAL"] : risk === "AT_RISK" ? ["AT_RISK"] : ["AT_RISK", "CRITICAL"]) as (
    | "AT_RISK"
    | "CRITICAL"
  )[];

  const projects = await prisma.project.findMany({
    where: { supervisorId: session.user.id, riskLevel: { in: levels } },
    include: { student: true },
    orderBy: [{ riskLevel: "asc" }, { createdAt: "desc" }],
  });

  const sorted = [...projects].sort((a, b) => (a.riskLevel === b.riskLevel ? 0 : a.riskLevel === "CRITICAL" ? -1 : 1));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold md:text-3xl">Students at risk</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {sorted.length === 0 ? "Nobody flagged right now." : `${sorted.length} project${sorted.length === 1 ? "" : "s"} need attention.`}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.key === "all" ? "/lecturer/at-risk" : `/lecturer/at-risk?risk=${f.key}`}
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

      {sorted.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <ShieldAlert className="size-8 text-success-700" />
            <p className="text-sm text-muted-foreground">All clear. Every project is on schedule.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {sorted.map((p) => {
            const reasons: string[] = JSON.parse(p.riskReasons || "[]");
            return (
              <Link key={p.id} href={`/lecturer/students/${p.id}`}>
                <Card className={riskGlowClass(p.riskLevel)}>
                  <CardContent className="flex flex-col gap-3 py-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{initials(p.student.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold">{p.student.name}</p>
                          <p className="text-xs text-muted-foreground">{p.title}</p>
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
