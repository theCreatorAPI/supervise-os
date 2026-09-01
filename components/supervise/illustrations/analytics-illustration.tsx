"use client";

import { motion } from "framer-motion";

const BARS = [40, 70, 55, 90, 65];

export function AnalyticsIllustration() {
  return (
    <svg viewBox="0 0 400 240" className="h-full w-full" role="img" aria-label="Abstract bar chart and capacity ring representing workload analytics">
      <circle cx="200" cy="120" r="118" fill="var(--brand-50)" />

      <g transform="translate(50, 200)">
        {BARS.map((h, i) => (
          <motion.rect
            key={i}
            x={i * 34}
            width="22"
            rx="6"
            fill={i === 3 ? "var(--warn-500)" : "var(--brand-500)"}
            initial={{ height: 0, y: 0 }}
            whileInView={{ height: h, y: -h }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.7, delay: i * 0.08, ease: "easeOut" }}
          />
        ))}
      </g>

      <g transform="translate(300, 90)">
        <circle r="44" fill="none" stroke="var(--border-strong)" strokeWidth="10" />
        <motion.circle
          r="44"
          fill="none"
          stroke="var(--success-500)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={2 * Math.PI * 44}
          initial={{ strokeDashoffset: 2 * Math.PI * 44 }}
          whileInView={{ strokeDashoffset: 2 * Math.PI * 44 * 0.22 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 1, ease: "easeOut" }}
          transform="rotate(-90)"
        />
        <text textAnchor="middle" dy="6" fontSize="20" fontWeight="700" fill="var(--foreground)">
          78%
        </text>
      </g>
    </svg>
  );
}
