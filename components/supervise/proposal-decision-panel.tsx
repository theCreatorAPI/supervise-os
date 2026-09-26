"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { decideProposal } from "@/app/actions/proposals";

/**
 * "Review Decision" on the project approval screen.
 *
 * Both buttons submit the same feedback box, matching the flow sheet: the
 * supervisor writes once and then chooses what that writing means. Approving is
 * allowed without a comment, but requesting changes is not — sending a topic back
 * with no reason leaves the student guessing at what to fix.
 */
export function ProposalDecisionPanel({
  proposalId,
  topic,
}: {
  proposalId: string;
  topic: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState<string | null>(null);

  function decide(decision: "APPROVED" | "REJECTED") {
    if (decision === "REJECTED" && feedback.trim().length < 3) {
      setError("Tell the student what needs changing before sending it back.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const res = await decideProposal(proposalId, decision, feedback);
      if (res?.error) {
        setError(res.error);
        return;
      }
      toast.success(
        decision === "APPROVED" ? `"${topic}" approved — the project is created.` : "Changes requested."
      );
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <label htmlFor="proposal-feedback" className="text-sm font-medium">
          Approval decision
        </label>
        <Textarea
          id="proposal-feedback"
          name="feedback"
          rows={3}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Add feedback or comments for the student"
          className="mt-2"
          disabled={pending}
        />
      </div>

      {error && (
        <p className="rounded-lg border border-critical-500/30 bg-critical-500/10 px-3 py-2 text-xs text-critical-700">
          {error}
        </p>
      )}

      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="destructive" disabled={pending} onClick={() => decide("REJECTED")}>
          Request Changes
        </Button>
        <Button variant="success" disabled={pending} onClick={() => decide("APPROVED")}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          Approve Project
        </Button>
      </div>
    </div>
  );
}
