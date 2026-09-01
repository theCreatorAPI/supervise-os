"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteProposal } from "@/app/actions/proposals";

export function DeleteProposalButton({ proposalId }: { proposalId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const res = await deleteProposal(proposalId);
          if (res?.error) {
            toast.error(res.error);
            return;
          }
          toast.success("Proposal deleted.");
          router.refresh();
        })
      }
    >
      {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
      Delete
    </Button>
  );
}
