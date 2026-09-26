import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { CountUp } from "@/components/ui/count-up";
import { cn } from "@/lib/utils";

/**
 * The four-across summary tiles at the top of the management screens.
 *
 * The reference sheet colours some figures to mark severity. Those tones come
 * from the app's own palette rather than the reference's blue, so these screens
 * stay part of the same product as the rest of the app.
 */

export type StatTone = "default" | "brand" | "warn" | "critical" | "success";

export type Stat = {
  label: string;
  value: number;
  suffix?: string;
  tone?: StatTone;
  href?: string;
};

const TONE: Record<StatTone, string> = {
  default: "text-foreground",
  brand: "text-brand-700",
  warn: "text-warn-700",
  critical: "text-critical-700",
  success: "text-success-700",
};

export function StatCards({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((s) => {
        const body = (
          <Card className={cn("h-full", s.href && "transition-transform hover:-translate-y-0.5")}>
            <CardContent className="flex flex-col gap-1.5 pt-6">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={cn("font-display text-3xl font-bold", TONE[s.tone ?? "default"])}>
                <CountUp value={s.value} />
                {s.suffix ?? ""}
              </p>
            </CardContent>
          </Card>
        );

        return s.href ? (
          <Link key={s.label} href={s.href} className="min-w-0">
            {body}
          </Link>
        ) : (
          <div key={s.label} className="min-w-0">
            {body}
          </div>
        );
      })}
    </div>
  );
}
