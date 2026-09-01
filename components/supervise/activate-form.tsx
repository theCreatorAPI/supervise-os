"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { activateStudent, type ActivateState } from "@/app/actions/auth";

const initialState: ActivateState = {};

export function ActivateForm({ token, studentName }: { token: string; studentName: string }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(activateStudent, initialState);

  useEffect(() => {
    if (state.success) {
      toast.success("Account activated. Sign in to get started.");
      router.push("/sign-in");
    }
  }, [state.success, router]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      <p className="text-sm text-muted-foreground">
        Welcome, <span className="font-medium text-foreground">{studentName}</span>. Set a password to activate
        your account.
      </p>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">New password</Label>
        <Input id="password" name="password" type="password" placeholder="At least 6 characters" required />
      </div>
      {state.error && (
        <p className="rounded-lg border border-critical-500/30 bg-critical-500/10 px-3 py-2 text-xs text-critical-700">
          {state.error}
        </p>
      )}
      <Button type="submit" size="lg" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        Activate account
      </Button>
    </form>
  );
}
