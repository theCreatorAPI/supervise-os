"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { timeAgo } from "@/lib/utils";

type Notification = {
  id: string;
  message: string;
  read: boolean;
  createdAt: Date | string;
  link: string | null;
};

export function NotificationsList({ notifications }: { notifications: Notification[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [items, setItems] = useState(notifications);

  const unreadCount = items.filter((n) => !n.read).length;

  const markAll = () => {
    startTransition(async () => {
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markAll" }),
      });
      toast.success("All notifications marked as read.");
      router.refresh();
    });
  };

  const markOne = (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "markOne", id }),
    });
  };

  if (items.length === 0) {
    return <p className="py-12 text-center text-sm text-muted-foreground">No notifications yet.</p>;
  }

  return (
    <div className="flex flex-col">
      {items.map((n) => (
        <Link
          key={n.id}
          href={n.link ?? "#"}
          onClick={() => markOne(n.id)}
          className="flex items-start gap-3 border-b border-border/60 py-3 last:border-0 hover:bg-black/[0.02]"
        >
          {!n.read && <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-600" />}
          <div className={n.read ? "min-w-0 flex-1 pl-3.5" : "min-w-0 flex-1"}>
            <p className="text-sm font-medium text-foreground">{n.message}</p>
          </div>
          <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(n.createdAt)}</span>
        </Link>
      ))}
      {unreadCount > 0 && (
        <button onClick={markAll} className="mt-3 self-end text-sm text-brand-700 hover:underline">
          Mark all as read
        </button>
      )}
    </div>
  );
}
