"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { scheduleMeeting, type MeetingState } from "@/app/actions/meetings";

const initialState: MeetingState = {};

type ProjectOption = { id: string; label: string };

/**
 * Schedules a supervision meeting.
 *
 * Two shapes, one dialog: given a `projectId` it schedules against that project
 * (the project page), and given a list of `projects` it asks which student first
 * (the meetings index, where nothing is selected yet).
 */
export function ScheduleMeetingDialog({
  projectId,
  projectTitle,
  projects,
}: {
  projectId?: string;
  projectTitle?: string;
  projects?: ProjectOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(scheduleMeeting, initialState);

  useEffect(() => {
    if (state.success) {
      toast.success("Meeting scheduled.");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reacting to a server action result, not mirroring props
      setOpen(false);
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" /> Schedule meeting
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule a meeting</DialogTitle>
          <DialogDescription>
            {projectTitle ? `For ${projectTitle}` : "Pick the student, then a time."}
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          {projectId ? (
            <input type="hidden" name="projectId" value={projectId} />
          ) : (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="projectId">Student</Label>
              <Select name="projectId" required>
                <SelectTrigger id="projectId">
                  <SelectValue placeholder="Choose a student" />
                </SelectTrigger>
                <SelectContent>
                  {(projects ?? []).map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" defaultValue="Supervision meeting" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="scheduledAt">Date &amp; time</Label>
            <Input id="scheduledAt" name="scheduledAt" type="datetime-local" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea id="notes" name="notes" placeholder="What do you want to cover?" />
          </div>
          {state.error && (
            <p className="rounded-lg border border-critical-500/30 bg-critical-500/10 px-3 py-2 text-xs text-critical-700">
              {state.error}
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              Schedule
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
