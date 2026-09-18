"use client";

import { useActionState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { updateMeetingRecord, type MeetingState } from "@/app/actions/meetings";

const initialState: MeetingState = {};

/**
 * The supervisor's write-up for one meeting: what was discussed, and what the
 * student owes before the next one. Both fields save together — they're two
 * halves of the same record, and splitting them into separate forms would mean
 * two round trips to write up one meeting.
 */
export function MeetingRecordForm({
  meetingId,
  notes,
  actionItems,
}: {
  meetingId: string;
  notes: string | null;
  actionItems: string | null;
}) {
  const [state, formAction, pending] = useActionState(updateMeetingRecord, initialState);
  const announced = useRef(false);

  useEffect(() => {
    if (state.success && !announced.current) {
      announced.current = true;
      toast.success("Meeting record saved.");
    }
    if (!state.success) announced.current = false;
  }, [state.success]);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="meetingId" value={meetingId} />

      <div className="flex flex-col gap-2">
        <label htmlFor="notes" className="text-sm font-medium">
          Meeting Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          defaultValue={notes ?? ""}
          placeholder="What was discussed?"
          className="w-full rounded-xl border border-border-strong bg-white px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-brand-600"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="actionItems" className="text-sm font-medium">
          Action Items
        </label>
        <textarea
          id="actionItems"
          name="actionItems"
          rows={4}
          defaultValue={actionItems ?? ""}
          placeholder="What should the student do before the next meeting?"
          className="w-full rounded-xl border border-border-strong bg-white px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-brand-600"
        />
      </div>

      {state.error && (
        <p className="rounded-lg border border-critical-500/30 bg-critical-500/10 px-3 py-2 text-xs text-critical-700">
          {state.error}
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          Save record
        </Button>
      </div>
    </form>
  );
}
