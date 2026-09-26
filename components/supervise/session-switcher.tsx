"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarRange, Loader2 } from "lucide-react";
import { setAcademicSession } from "@/app/actions/academic-session";

/**
 * Switches which academic session the supervision screens are showing.
 *
 * A native select rather than a styled dropdown: it sits in the header on every
 * screen including narrow ones, where the platform's own picker is both more
 * usable and more accessible than anything rebuilt here.
 */
export function SessionSwitcher({
  sessions,
  selected,
}: {
  sessions: string[];
  selected: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function change(value: string) {
    if (value === selected) return;

    startTransition(async () => {
      const res = await setAcademicSession(value);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <label className="flex items-center gap-2 text-xs text-muted-foreground">
      {pending ? (
        <Loader2 className="size-4 shrink-0 animate-spin" />
      ) : (
        <CalendarRange className="size-4 shrink-0" />
      )}
      <span className="sr-only">Academic session</span>
      <select
        value={selected}
        disabled={pending}
        onChange={(e) => change(e.target.value)}
        aria-label="Academic session"
        className="h-9 rounded-lg border border-border-strong bg-white px-2.5 text-sm font-medium text-foreground outline-none focus:border-brand-600 disabled:opacity-60"
      >
        {sessions.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </label>
  );
}
