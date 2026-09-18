"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { giveFeedback, type FeedbackState } from "@/app/actions/feedback";

const initialState: FeedbackState = {};

type ReviewEntry = {
  id: string;
  comment: string;
  decision: string;
  author: string;
};

/**
 * "Review & Comments" from the supervisor flow.
 *
 * Commenting and deciding are deliberately separate here: a supervisor leaves as
 * many notes as they need, then takes one decision that closes the review. All
 * three buttons post the same form — `name="decision"` on each submit button
 * puts its own value into the FormData, so no client state tracks which was
 * pressed.
 */
export function ReviewPanel({
  submissionId,
  milestoneName,
  reviews,
  decided,
}: {
  submissionId: string;
  milestoneName: string;
  reviews: ReviewEntry[];
  /** The closing decision, once one has been taken. */
  decided: "APPROVED" | "RETURNED" | null;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(giveFeedback, initialState);
  const announced = useRef(false);

  useEffect(() => {
    if (state.success && !announced.current) {
      announced.current = true;
      toast.success(`Feedback saved for "${milestoneName}".`);
      router.refresh();
    }
    if (!state.success) announced.current = false;
  }, [state.success, milestoneName, router]);

  return (
    <div className="flex flex-col gap-5">
      <form action={formAction} className="flex flex-col gap-3">
        <input type="hidden" name="submissionId" value={submissionId} />

        {!decided && (
          <>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Textarea
                name="comment"
                rows={2}
                placeholder="Write a comment..."
                className="flex-1"
              />
              <Button
                type="submit"
                name="decision"
                value="COMMENT_ONLY"
                variant="secondary"
                disabled={pending}
                className="shrink-0 self-start"
              >
                {pending && <Loader2 className="size-4 animate-spin" />}
                Add Comment
              </Button>
            </div>

            {state.error && (
              <p className="rounded-lg border border-critical-500/30 bg-critical-500/10 px-3 py-2 text-xs text-critical-700">
                {state.error}
              </p>
            )}
          </>
        )}

        {reviews.length > 0 && (
          <div className="flex flex-col gap-3">
            {reviews.map((r) => (
              <div key={r.id} className="border-b border-border/60 pb-3 last:border-0 last:pb-0">
                <p className="text-sm">{r.comment}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">{r.author}</p>
                  {r.decision !== "COMMENT_ONLY" && (
                    <Badge variant={r.decision === "APPROVED" ? "onSchedule" : "overdue"}>
                      {r.decision === "APPROVED" ? "Approved" : "Correction Required"}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {decided ? (
          <div className="rounded-xl border border-border-strong bg-black/2 px-4 py-3">
            <p className="text-sm font-medium">Review Complete</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {decided === "APPROVED"
                ? "Submission approved successfully."
                : "Submission returned to student for corrections."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Review Decision</p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="submit"
                name="decision"
                value="RETURNED"
                variant="outline"
                disabled={pending}
                className="border-critical-500/60 text-critical-700 hover:bg-critical-500/10"
              >
                Correction Required
              </Button>
              <Button
                type="submit"
                name="decision"
                value="APPROVED"
                variant="success"
                disabled={pending}
              >
                Approve Submission
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
