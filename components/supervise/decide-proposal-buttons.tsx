"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { decideProposal } from "@/app/actions/proposals";

export function DecideProposalButtons({ proposalId }: { proposalId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function decide(decision: "APPROVED" | "REJECTED") {
    startTransition(async () => {
      const res = await decideProposal(proposalId, decision);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      toast.success(decision === "APPROVED" ? "Topic approved — project created." : "Topic rejected.");
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" variant="success" disabled={isPending} onClick={() => decide("APPROVED")}>
        {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
        Approve
      </Button>
      <Button size="sm" variant="destructive" disabled={isPending} onClick={() => decide("REJECTED")}>
        <X className="size-3.5" />
        Reject
      </Button>
    </div>
  );
}
