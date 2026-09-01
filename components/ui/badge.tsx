import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold tracking-wide",
  {
    variants: {
      variant: {
        default: "border-border-strong bg-black/5 text-foreground",
        brand: "border-brand/30 bg-brand/15 text-brand-700",
        brandSoft: "border-brand-300/40 bg-brand-300/15 text-brand-700",
        onSchedule: "border-success-500/30 bg-success-500/10 text-success-700",
        atRisk: "border-warn-500/30 bg-warn-500/10 text-warn-700",
        overdue: "border-critical-500/40 bg-critical-500/15 text-critical-700",
        outline: "border-border-strong bg-transparent text-muted-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}

export { Badge, badgeVariants };
