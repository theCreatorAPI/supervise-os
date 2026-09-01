"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { proposeTopic, type ProposeTopicState } from "@/app/actions/proposals";

const initialState: ProposeTopicState = {};

export function ProposeTopicForm({ inProgress }: { inProgress: boolean }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(proposeTopic, initialState);

  useEffect(() => {
    if (state.success) {
      toast.success("Topic submitted for approval.");
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <Textarea
          id="title"
          name="title"
          placeholder="Enter your proposed research topic"
          required
          rows={3}
          className="flex-1"
        />
        {inProgress && (
          <div className="shrink-0 text-right">
            <p className="text-xs text-muted-foreground">Status</p>
            <Badge variant="brandSoft" className="mt-1">In Progress</Badge>
          </div>
        )}
      </div>
      {state.error && <p className="text-xs text-critical-700">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending && <Loader2 className="size-4 animate-spin" />}
        Submit for Approval
      </Button>
    </form>
  );
}
