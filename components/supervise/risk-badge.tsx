import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const CONFIG: Record<string, { label: string; variant: "onSchedule" | "atRisk" | "overdue"; dot: string; pulse?: boolean }> = {
  NORMAL: { label: "Normal", variant: "onSchedule", dot: "bg-success-500" },
  AT_RISK: { label: "At Risk", variant: "atRisk", dot: "bg-warn-500", pulse: true },
  CRITICAL: { label: "Critical", variant: "overdue", dot: "bg-critical-500", pulse: true },
};

export function RiskBadge({ level, className }: { level: string; className?: string }) {
  const c = CONFIG[level] ?? CONFIG.NORMAL;
  return (
    <Badge variant={c.variant} className={className}>
      <span className={cn("size-1.5 rounded-full", c.dot, c.pulse && "animate-pulse-glow")} />
      {c.label}
    </Badge>
  );
}

export function riskGlowClass(level: string) {
  if (level === "CRITICAL") return "glow-critical";
  if (level === "AT_RISK") return "glow-warn";
  return "";
}
