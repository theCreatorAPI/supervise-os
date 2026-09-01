import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Check, Circle, Clock, FileUp, RotateCcw, Search } from "lucide-react";

const CONFIG: Record<
  string,
  { label: string; variant: "default" | "brand" | "brandSoft" | "onSchedule" | "atRisk" | "overdue" | "outline"; icon: React.ElementType }
> = {
  NOT_STARTED: { label: "Not Started", variant: "outline", icon: Circle },
  IN_PROGRESS: { label: "In Progress", variant: "brandSoft", icon: Clock },
  SUBMITTED: { label: "Submitted", variant: "brand", icon: FileUp },
  UNDER_REVIEW: { label: "Under Review", variant: "atRisk", icon: Search },
  RETURNED: { label: "Returned", variant: "overdue", icon: RotateCcw },
  APPROVED: { label: "Approved", variant: "onSchedule", icon: Check },
};

export function MilestoneStatusBadge({ status, className }: { status: string; className?: string }) {
  const c = CONFIG[status] ?? CONFIG.NOT_STARTED;
  const Icon = c.icon;
  return (
    <Badge variant={c.variant} className={cn(className)}>
      <Icon className="size-3" />
      {c.label}
    </Badge>
  );
}
