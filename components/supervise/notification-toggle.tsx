"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import type { SettingsState } from "@/app/actions/settings";

export function NotificationToggle({
  initialEnabled,
  action,
}: {
  initialEnabled: boolean;
  action: (enabled: boolean) => Promise<SettingsState>;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [isPending, startTransition] = useTransition();

  return (
    <Switch
      checked={enabled}
      disabled={isPending}
      onCheckedChange={(next) => {
        setEnabled(next);
        startTransition(async () => {
          const res = await action(next);
          if (res?.error) {
            toast.error(res.error);
            setEnabled(!next);
            return;
          }
          toast.success(next ? "Enabled." : "Turned off.");
        });
      }}
    />
  );
}
