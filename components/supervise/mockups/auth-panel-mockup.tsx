import { Check, Clock3, Search } from "lucide-react";
import { BrowserFrame } from "@/components/supervise/browser-frame";
import { RiskBadge } from "@/components/supervise/risk-badge";

const INSIGHTS = [
  {
    icon: Check,
    tone: "text-success-700 bg-success-500/10",
    label: "Chapter 2 approved",
    detail: "Reviewed 2 days ago",
  },
  {
    icon: Clock3,
    tone: "text-brand-700 bg-brand-50",
    label: "Methodology review",
    detail: "Due in 6 days",
  },
  {
    icon: Search,
    tone: "text-warn-700 bg-warn-500/10",
    label: "1 project at risk",
    detail: "Needs a check-in",
  },
];

export function AuthPanelMockup() {
  return (
    <BrowserFrame title="student/project" className="w-[300px]">
      <div className="flex items-center justify-between">
        <RiskBadge level="NORMAL" />
        <span className="text-[11px] text-muted-foreground">Chapter 2 of 6</span>
      </div>
      <p className="mt-2.5 font-display text-sm font-bold leading-snug">
        Federated Learning for Low-Bandwidth Clinics
      </p>
      <p className="text-[11px] text-muted-foreground">Supervised by Dr. Amara Chen</p>

      <div className="mt-3.5 flex flex-col gap-2">
        {INSIGHTS.map((item) => (
          <div key={item.label} className="flex items-center gap-2.5 rounded-lg border border-border bg-background-elevated/60 px-2.5 py-2">
            <span className={`flex size-6 shrink-0 items-center justify-center rounded-md ${item.tone}`}>
              <item.icon className="size-3.5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium leading-tight">{item.label}</p>
              <p className="text-[10px] text-muted-foreground">{item.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </BrowserFrame>
  );
}
