"use client";

import { motion } from "framer-motion";

const NODES = [
  { x: 60, y: 70, state: "done" },
  { x: 205, y: 40, state: "done" },
  { x: 340, y: 90, state: "active" },
  { x: 300, y: 220, state: "pending" },
  { x: 120, y: 250, state: "risk" },
  { x: 40, y: 180, state: "done" },
];

const HUB = { x: 200, y: 155 };

function nodeFill(state: string) {
  switch (state) {
    case "done":
      return "var(--brand-500)";
    case "active":
      return "var(--brand-300)";
    case "risk":
      return "var(--warn-500)";
    default:
      return "#ffffff";
  }
}

export function HeroIllustration() {
  return (
    <svg viewBox="0 0 400 320" className="h-full w-full" role="img" aria-label="Diagram of a supervisor hub connected to student milestone nodes in various states">
      <defs>
        <radialGradient id="hero-glow" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="var(--brand-100)" stopOpacity="0.9" />
          <stop offset="100%" stopColor="var(--brand-100)" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx={HUB.x} cy={HUB.y} r={150} fill="url(#hero-glow)" />

      {NODES.map((n, i) => (
        <motion.line
          key={`line-${i}`}
          x1={HUB.x}
          y1={HUB.y}
          x2={n.x}
          y2={n.y}
          stroke="var(--border-strong)"
          strokeWidth={2}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.15 + i * 0.08, ease: "easeOut" }}
        />
      ))}

      <motion.circle
        cx={HUB.x}
        cy={HUB.y}
        r={34}
        fill="var(--brand-700)"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 160, damping: 14 }}
      />
      <circle cx={HUB.x} cy={HUB.y} r={34} fill="none" stroke="var(--brand-300)" strokeWidth={2} opacity={0.5} />
      <path
        d={`M ${HUB.x - 10} ${HUB.y + 4} l 7 7 l 14 -16`}
        fill="none"
        stroke="white"
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {NODES.map((n, i) => (
        <motion.g
          key={`node-${i}`}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 16, delay: 0.4 + i * 0.08 }}
        >
          <circle cx={n.x} cy={n.y} r={16} fill={nodeFill(n.state)} stroke="white" strokeWidth={3} />
          {n.state === "done" && (
            <path
              d={`M ${n.x - 6} ${n.y} l 4 4 l 8 -9`}
              fill="none"
              stroke="white"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {n.state === "risk" && <circle cx={n.x} cy={n.y} r={4} fill="white" />}
          {n.state === "active" && (
            <motion.circle
              cx={n.x}
              cy={n.y}
              r={16}
              fill="none"
              stroke="var(--brand-500)"
              strokeWidth={2}
              animate={{ scale: [1, 1.4], opacity: [0.6, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
            />
          )}
        </motion.g>
      ))}
    </svg>
  );
}
