"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function SignOutAction() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-black/[0.03]"
    >
      <div>
        <p className="text-sm font-medium text-critical-700">Sign out</p>
        <p className="text-xs text-muted-foreground">Sign out of your Supervise OS account.</p>
      </div>
      <LogOut className="size-4 shrink-0 text-critical-700" />
    </button>
  );
}
