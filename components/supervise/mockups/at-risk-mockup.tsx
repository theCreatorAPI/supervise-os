import { BrowserFrame } from "@/components/supervise/browser-frame";
import { RiskBadge } from "@/components/supervise/risk-badge";

const FLAGGED = [
  {
    name: "Theo Owusu",
    initials: "TO",
    reasons: ["No submission in 41 days", "1 scheduled meeting was missed"],
    level: "CRITICAL",
  },
  {
    name: "Miles Rossi",
    initials: "MR",
    reasons: ["Milestone due date passed"],
    level: "AT_RISK",
  },
];

export function AtRiskMockup() {
  return (
    <BrowserFrame title="lecturer/at-risk">
      <p className="mb-3 text-sm font-semibold">Students at risk</p>
      <div className="flex flex-col gap-2.5">
        {FLAGGED.map((s) => (
          <div key={s.name} className="rounded-xl border border-border-strong p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-500 text-[10px] font-semibold text-white">
                  {s.initials}
                </span>
                <span className="text-xs font-semibold">{s.name}</span>
              </div>
              <RiskBadge level={s.level} />
            </div>
            <ul className="flex flex-col gap-1 pl-1 text-[11px] text-muted-foreground">
              {s.reasons.map((r) => (
                <li key={r} className="flex items-start gap-1.5">
                  <span className="mt-1 size-1 shrink-0 rounded-full bg-warn-700" /> {r}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </BrowserFrame>
  );
}
