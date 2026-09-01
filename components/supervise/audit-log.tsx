import { Clock } from "lucide-react";
import { timeAgo } from "@/lib/utils";

type AuditEventLite = {
  id: string;
  action: string;
  description: string;
  createdAt: Date | string;
};

export function AuditLog({ events }: { events: AuditEventLite[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground">No activity recorded yet.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {events.map((e) => (
        <div key={e.id} className="flex items-start gap-3">
          <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
            <Clock className="size-3" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-foreground">{e.description}</p>
            <p className="text-xs text-muted-foreground">{timeAgo(e.createdAt)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
