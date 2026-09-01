"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleMeetingComplete } from "@/app/actions/meetings";

export function MeetingCompleteToggle({ meetingId, completed }: { meetingId: string; completed: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(completed);

  if (done) return null;

  return (
    <Button
      size="sm"
      variant="success"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const res = await toggleMeetingComplete(meetingId, true);
          if (res?.error) {
            toast.error(res.error);
            return;
          }
          setDone(true);
          toast.success("Meeting marked complete.");
          router.refresh();
        })
      }
    >
      {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
      Mark complete
    </Button>
  );
}
