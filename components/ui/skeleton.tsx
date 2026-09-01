import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "animate-shimmer rounded-lg bg-gradient-to-r from-black/[0.04] via-black/[0.09] to-black/[0.04]",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
