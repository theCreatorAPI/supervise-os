"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, UserPlus, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { createStudent, type CreateStudentState } from "@/app/actions/auth";

const initialState: CreateStudentState = {};

export function AddStudentDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [state, formAction, pending] = useActionState(createStudent, initialState);

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [state.success, router]);

  const activationLink = state.activationUrl
    ? typeof window !== "undefined"
      ? `${window.location.origin}${state.activationUrl}`
      : state.activationUrl
    : null;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setCopied(false);
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="size-4" /> Add student
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a student</DialogTitle>
          <DialogDescription>
            They&apos;ll be pending activation until they set a password with the link below.
          </DialogDescription>
        </DialogHeader>

        {activationLink ? (
          <div className="flex flex-col gap-4">
            {state.emailedTo ? (
              <p className="rounded-lg border border-success-500/30 bg-success-500/10 px-3 py-2 text-xs text-success-700">
                Student created and the activation link was emailed to {state.emailedTo}.
              </p>
            ) : (
              <p className="rounded-lg border border-warn-500/30 bg-warn-500/10 px-3 py-2 text-xs text-warn-700">
                Student created, but the email didn&apos;t go out
                {state.emailError ? `: ${state.emailError}` : "."} Send them this link yourself.
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {state.emailedTo
                ? "You can also copy the link and send it another way."
                : "Copy the link and send it to them directly."}
            </p>
            <div className="flex items-center gap-2">
              <Input readOnly value={activationLink} className="text-xs" />
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={async () => {
                  await navigator.clipboard.writeText(activationLink);
                  setCopied(true);
                  toast.success("Activation link copied.");
                }}
              >
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              </Button>
            </div>
            <DialogFooter>
              <Button type="button" onClick={() => setOpen(false)}>
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form action={formAction} key={state.error ?? "new"} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" name="name" defaultValue={state.values?.name} placeholder="Layla Kim" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="matricNumber">Matric number</Label>
              <Input
                id="matricNumber"
                name="matricNumber"
                defaultValue={state.values?.matricNumber}
                placeholder="CSC/2021/041"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={state.values?.email}
                placeholder="student@university.edu"
                required
              />
            </div>
            {state.error && (
              <p className="rounded-lg border border-critical-500/30 bg-critical-500/10 px-3 py-2 text-xs text-critical-700">
                {state.error}
              </p>
            )}
            <DialogFooter>
              <Button type="submit" disabled={pending}>
                {pending && <Loader2 className="size-4 animate-spin" />}
                Create student
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
