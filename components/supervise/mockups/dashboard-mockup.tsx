import { BrowserFrame } from "@/components/supervise/browser-frame";
import { ProgressConstellation } from "@/components/supervise/progress-constellation";
import { RiskBadge } from "@/components/supervise/risk-badge";
import { CalendarClock } from "lucide-react";

const MOCK_MILESTONES = [
  { id: "1", name: "Topic Approval", order: 1, status: "APPROVED", dueDate: null },
  { id: "2", name: "Proposal", order: 2, status: "APPROVED", dueDate: null },
  { id: "3", name: "Chapter 1", order: 3, status: "APPROVED", dueDate: null },
  { id: "4", name: "Chapter 2", order: 4, status: "UNDER_REVIEW", dueDate: null },
  { id: "5", name: "Methodology", order: 5, status: "NOT_STARTED", dueDate: null },
  { id: "6", name: "Results", order: 6, status: "NOT_STARTED", dueDate: null },
];

export function DashboardMockup() {
  return (
    <BrowserFrame title="student">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <RiskBadge level="NORMAL" />
          <p className="mt-2 font-display text-lg font-bold leading-tight">
            Federated Learning for Low-Bandwidth Clinics
          </p>
          <p className="text-xs text-muted-foreground">Supervised by Dr. Amara Chen</p>
        </div>
      </div>
      <ProgressConstellation milestones={MOCK_MILESTONES} />
      <div className="mt-3 flex items-center gap-2 rounded-xl border border-border-strong bg-background-elevated px-3 py-2.5 text-xs">
        <CalendarClock className="size-3.5 text-brand-700" />
        <span className="font-medium">Methodology review</span>
        <span className="text-muted-foreground">· in 6 days</span>
      </div>
    </BrowserFrame>
  );
}
