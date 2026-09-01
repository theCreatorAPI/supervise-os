"use client";

import { motion } from "framer-motion";

const NODES = [
  { x: 40, y: 60 },
  { x: 130, y: 30 },
  { x: 220, y: 55 },
  { x: 260, y: 130 },
  { x: 170, y: 155 },
  { x: 70, y: 140 },
];

export function CompletionIllustration() {
  return (
    <svg viewBox="0 0 300 190" className="h-full w-full" role="img" aria-label="A fully completed chain of approved milestones">
      {NODES.map((n, i) => {
        const next = NODES[(i + 1) % NODES.length];
        return (
          <motion.line
            key={`l-${i}`}
            x1={n.x}
            y1={n.y}
            x2={next.x}
            y2={next.y}
            stroke="var(--success-500)"
            strokeWidth={2.5}
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
          />
        );
      })}
      {NODES.map((n, i) => (
        <motion.g
          key={`n-${i}`}
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ type: "spring", stiffness: 240, damping: 16, delay: i * 0.08 }}
        >
          <circle cx={n.x} cy={n.y} r="15" fill="var(--success-500)" stroke="white" strokeWidth={3} />
          <path
            d={`M ${n.x - 5} ${n.y} l 3.5 3.5 l 7 -8`}
            fill="none"
            stroke="white"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </motion.g>
      ))}
    </svg>
  );
}
