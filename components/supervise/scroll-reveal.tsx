"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const OFFSETS: Record<string, { x?: number; y?: number }> = {
  left: { x: -40 },
  right: { x: 40 },
  up: { y: 32 },
};

export function ScrollReveal({
  children,
  direction = "up",
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  direction?: "left" | "right" | "up";
  delay?: number;
  className?: string;
}) {
  // Framer animates via inline styles, so the reduced-motion block in globals.css
  // (which only overrides CSS transitions) can't reach these — opt out explicitly.
  const reduced = useReducedMotion();
  const offset = reduced ? {} : OFFSETS[direction];

  return (
    <motion.div
      initial={{ opacity: 0, ...offset }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, amount: 0.3, margin: "0px 0px -10% 0px" }}
      transition={reduced ? { duration: 0 } : { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className={cn("min-w-0", className)}
    >
      {children}
    </motion.div>
  );
}
