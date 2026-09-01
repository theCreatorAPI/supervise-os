"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { updateMilestoneDueDate } from "@/app/actions/milestones";

export function MilestoneDueDateEditor({ milestoneId, dueDate }: { milestoneId: string; dueDate: Date | string | null }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(dueDate ? new Date(dueDate).toISOString().slice(0, 10) : "");
  const [isPending, startTransition] = useTransition();

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <Pencil className="size-3" />
        {dueDate ? `Due ${formatDate(dueDate)}` : "Set due date"}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <Input
        type="date"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-8 w-36 text-xs"
      />
      <Button
        size="sm"
        className="h-8 px-2.5"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const res = await updateMilestoneDueDate(milestoneId, value);
            if (res?.error) {
              toast.error(res.error);
              return;
            }
            setEditing(false);
            router.refresh();
          })
        }
      >
        {isPending ? <Loader2 className="size-3 animate-spin" /> : "Save"}
      </Button>
    </div>
  );
}
