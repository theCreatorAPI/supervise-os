import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all duration-150 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 focus-visible:ring-offset-background [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer",
  {
    variants: {
      variant: {
        default: "btn-morph bg-transparent text-brand-700",
        secondary:
          "border border-border-strong bg-white text-foreground shadow-[0_1px_2px_rgba(16,24,40,0.04)] hover:bg-background-elevated",
        outline:
          "border border-border-strong bg-transparent text-foreground hover:bg-black/[0.03]",
        ghost: "text-foreground hover:bg-black/[0.04]",
        destructive:
          "bg-critical-600 text-white shadow-[0_1px_2px_rgba(16,24,40,0.06)] hover:bg-critical-700",
        success:
          "bg-success-600 text-white shadow-[0_1px_2px_rgba(16,24,40,0.06)] hover:bg-success-700",
        link: "text-brand-700 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 px-3.5 text-xs",
        lg: "h-12 px-7 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />
  );
}

export { Button, buttonVariants };
