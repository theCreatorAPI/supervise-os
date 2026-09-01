"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Check, Clock, RotateCcw, Search, Lock } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

type Milestone = {
  id: string;
  name: string;
  order: number;
  status: string;
  dueDate: Date | string | null;
  href?: string;
};

const NODE_STYLES: Record<string, { icon: React.ElementType; ring: string; fill: string; glow: string }> = {
  NOT_STARTED: { icon: Lock, ring: "border-black/15", fill: "bg-black/[0.03]", glow: "" },
  IN_PROGRESS: { icon: Clock, ring: "border-brand-500/60", fill: "bg-brand-50", glow: "shadow-[0_0_0_3px_rgba(79,95,49,0.12)]" },
  SUBMITTED: { icon: Clock, ring: "border-brand-500/60", fill: "bg-brand-50", glow: "shadow-[0_0_0_3px_rgba(79,95,49,0.12)]" },
  UNDER_REVIEW: { icon: Search, ring: "border-warn-500/60", fill: "bg-warn-500/10", glow: "shadow-[0_0_0_3px_rgba(217,119,6,0.12)]" },
  RETURNED: { icon: RotateCcw, ring: "border-critical-500/60", fill: "bg-critical-500/10", glow: "shadow-[0_0_0_3px_rgba(220,38,38,0.12)]" },
  APPROVED: { icon: Check, ring: "border-success-500/70", fill: "bg-success-500/10", glow: "shadow-[0_0_0_3px_rgba(22,163,74,0.12)]" },
};

export function ProgressConstellation({ milestones }: { milestones: Milestone[] }) {
  const sorted = [...milestones].sort((a, b) => a.order - b.order);
  const activeIndex = sorted.findIndex((m) => m.status !== "APPROVED");
  const completedCount = sorted.filter((m) => m.status === "APPROVED").length;

  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="relative flex min-w-max items-start gap-0 px-2 pt-4">
        {sorted.map((m, i) => {
          const style = NODE_STYLES[m.status] ?? NODE_STYLES.NOT_STARTED;
          const Icon = style.icon;
          const isLast = i === sorted.length - 1;
          const nextCompleted = m.status === "APPROVED";
          const href = m.href;
          const isActive = i === activeIndex;

          const node = (
            <div className="flex flex-col items-center gap-3 w-32">
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.06, type: "spring", stiffness: 200, damping: 16 }}
                whileHover={href ? { scale: 1.08, y: -2 } : undefined}
                className={cn(
                  "relative flex size-14 items-center justify-center rounded-2xl border-2 transition-shadow",
                  style.ring,
                  style.fill,
                  style.glow,
                  href && "cursor-pointer"
                )}
              >
                {isActive && (
                  <span className="absolute inset-0 rounded-2xl border-2 border-brand-500/50 animate-pulse-glow" />
                )}
                <Icon className={cn("size-5", nextCompleted ? "text-success-700" : "text-foreground/80")} />
                <span className="absolute -top-2 -right-2 flex size-5 items-center justify-center rounded-full bg-background-elevated text-[10px] font-bold text-muted-foreground border border-border-strong">
                  {m.order}
                </span>
              </motion.div>
              <div className="text-center">
                <p className={cn("text-xs font-semibold leading-tight", isActive && "text-brand-700")}>{m.name}</p>
                {m.dueDate && (
                  <p className="mt-0.5 text-[10px] text-muted-foreground">{formatDate(m.dueDate)}</p>
                )}
              </div>
            </div>
          );

          return (
            <div key={m.id} className="flex items-start">
              {href ? (
                <Link href={href} className="outline-none">
                  {node}
                </Link>
              ) : (
                node
              )}
              {!isLast && (
                <div className="relative mt-7 h-0.5 w-14 overflow-hidden rounded-full bg-black/[0.06]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: nextCompleted ? "100%" : "0%" }}
                    transition={{ delay: i * 0.06 + 0.15, duration: 0.6, ease: "easeOut" }}
                    className="absolute inset-y-0 left-0 bg-success-500"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-3 px-2 text-xs text-muted-foreground">
        {completedCount} of {sorted.length} milestones approved
      </p>
    </div>
  );
}
