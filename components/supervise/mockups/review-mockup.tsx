import { BrowserFrame } from "@/components/supervise/browser-frame";
import { MilestoneStatusBadge } from "@/components/supervise/milestone-status-badge";
import { Check, RotateCcw, MessageSquare, FileText } from "lucide-react";

const DECISIONS = [
  { label: "Approve", icon: Check, activeClass: "border-success-500/60 bg-success-500/10 text-success-700" },
  { label: "Return", icon: RotateCcw, activeClass: "border-border-strong bg-black/[0.02] text-muted-foreground" },
  { label: "Comment only", icon: MessageSquare, activeClass: "border-border-strong bg-black/[0.02] text-muted-foreground" },
];

export function ReviewMockup() {
  return (
    <BrowserFrame title="lecturer/review">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
            <FileText className="size-4" />
          </div>
          <div>
            <p className="text-sm font-semibold">Chapter 2 — Literature Review</p>
            <p className="text-xs text-muted-foreground">v2 · Layla Kim</p>
          </div>
        </div>
        <MilestoneStatusBadge status="UNDER_REVIEW" />
      </div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Decision</p>
      <div className="grid grid-cols-3 gap-2">
        {DECISIONS.map((d) => (
          <div
            key={d.label}
            className={`flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-medium ${d.activeClass}`}
          >
            <d.icon className="size-4" />
            {d.label}
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-xl border border-border-strong bg-background-elevated p-3 text-xs text-muted-foreground">
        &ldquo;Strong improvement over the last draft — approved. Keep this level of rigor going.&rdquo;
      </div>
    </BrowserFrame>
  );
}
