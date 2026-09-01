"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Loader2, RotateCcw, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { giveFeedback, type FeedbackState } from "@/app/actions/feedback";

const initialState: FeedbackState = {};

const DECISIONS = [
  { value: "APPROVED", label: "Approve", icon: Check, activeClass: "border-success-500/60 bg-success-500/10 text-success-300" },
  { value: "RETURNED", label: "Return", icon: RotateCcw, activeClass: "border-critical-500/60 bg-critical-500/10 text-critical-300" },
  { value: "COMMENT_ONLY", label: "Comment only", icon: MessageSquare, activeClass: "border-brand-600/60 bg-brand-600/10 text-brand-700" },
] as const;

export function FeedbackForm({ submissionId, milestoneName }: { submissionId: string; milestoneName: string }) {
  const router = useRouter();
  const [decision, setDecision] = useState<(typeof DECISIONS)[number]["value"]>("APPROVED");
  const [state, formAction, pending] = useActionState(giveFeedback, initialState);

  useEffect(() => {
    if (state.success) {
      toast.success(`Feedback sent for "${milestoneName}".`);
      router.push("/lecturer");
      router.refresh();
    }
  }, [state.success, milestoneName, router]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="submissionId" value={submissionId} />
      <input type="hidden" name="decision" value={decision} />

      <div className="flex flex-col gap-1.5">
        <Label>Decision</Label>
        <div className="grid grid-cols-3 gap-2">
          {DECISIONS.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => setDecision(d.value)}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-medium transition-all",
                decision === d.value ? d.activeClass : "border-border-strong bg-black/[0.02] text-muted-foreground hover:bg-black/[0.05]"
              )}
            >
              <d.icon className="size-4" />
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="comment">Comment</Label>
        <Textarea id="comment" name="comment" placeholder="Be specific — what needs to change, or what worked well?" required rows={5} />
      </div>

      {state.error && (
        <p className="rounded-lg border border-critical-500/30 bg-critical-500/10 px-3 py-2 text-xs text-critical-700">
          {state.error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        Send feedback
      </Button>
    </form>
  );
}
