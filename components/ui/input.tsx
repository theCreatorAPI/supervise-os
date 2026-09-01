import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-xl border border-border-strong bg-black/[0.03] px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-colors focus:border-brand/60 focus:bg-black/[0.05] focus:ring-2 focus:ring-brand/20 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export { Input };
