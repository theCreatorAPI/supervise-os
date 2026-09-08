"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";

/**
 * The reference's photographic showcase panel: floating glass readouts over a
 * landscape, with a slide counter and arrows. The landscape is procedural (no
 * licensed photography), and each slide is one step of the supervision cycle,
 * carrying that step's real numbers.
 */

type Slide = {
  step: string;
  body: string;
  /** Left card — a weekly bar series. */
  bars: { label: string; value: string; sub: string; series: number[] };
  /** Right card — a trend line. */
  trend: { label: string; primary: [string, string]; secondary: [string, string] };
};

const SLIDES: Slide[] = [
  {
    step: "Submit",
    body: "Students drag and drop each milestone's document. Every upload is versioned automatically, so nothing is overwritten and nothing goes missing.",
    bars: {
      label: "Submission activity",
      value: "12",
      sub: "this week",
      series: [40, 62, 48, 80, 55, 92, 70],
    },
    trend: { label: "Milestone uploads", primary: ["6", "per project"], secondary: ["Formats", "PDF · DOCX"] },
  },
  {
    step: "Review",
    body: "Lecturers preview, approve, return or comment in place. The milestone status updates the moment they act — no status email required.",
    bars: {
      label: "Reviews completed",
      value: "28",
      sub: "this week",
      series: [30, 55, 70, 60, 85, 72, 95],
    },
    trend: { label: "Review turnaround", primary: ["3d", "average"], secondary: ["Fastest", "same day"] },
  },
  {
    step: "Track",
    body: "Every project's health is visible in real time — to the student, the supervisor, and the department — with the exact reason a project was flagged.",
    bars: {
      label: "Projects on track",
      value: "92%",
      sub: "at-risk caught early",
      series: [58, 64, 71, 68, 80, 86, 92],
    },
    trend: { label: "Students tracked", primary: ["64", "active"], secondary: ["At risk", "7 flagged"] },
  },
];

/** A gentle rolling-hills backdrop, standing in for the reference's landscape. */
function Hills() {
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden">
      <svg className="size-full" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#eef2e6" />
            <stop offset="100%" stopColor="#cfdcb8" />
          </linearGradient>
          <linearGradient id="hillA" x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0%" stopColor="#9db772" />
            <stop offset="100%" stopColor="#6f8c46" />
          </linearGradient>
          <linearGradient id="hillB" x1="0" y1="0" x2="0.3" y2="1">
            <stop offset="0%" stopColor="#7d9c4b" />
            <stop offset="100%" stopColor="#4f5f31" />
          </linearGradient>
          <linearGradient id="hillC" x1="0" y1="0" x2="0.2" y2="1">
            <stop offset="0%" stopColor="#5c743a" />
            <stop offset="100%" stopColor="#2d3a1b" />
          </linearGradient>
        </defs>
        <rect width="1200" height="600" fill="url(#sky)" />
        <path d="M0 300 C 190 232, 330 300, 520 288 C 720 274, 860 214, 1200 268 L1200 600 L0 600 Z" fill="url(#hillA)" />
        <path d="M0 386 C 210 322, 400 400, 610 378 C 830 354, 1000 316, 1200 366 L1200 600 L0 600 Z" fill="url(#hillB)" />
        <path d="M0 480 C 230 432, 430 500, 660 480 C 900 458, 1040 428, 1200 464 L1200 600 L0 600 Z" fill="url(#hillC)" />
      </svg>
    </div>
  );
}

export function ShowcaseCarousel() {
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];

  const go = (delta: number) => setIndex((i) => (i + delta + SLIDES.length) % SLIDES.length);

  return (
    <div className="relative min-h-[36rem] overflow-hidden rounded-4xl">
      <Hills />

      {/* Layout rules, as in the reference */}
      <div aria-hidden className="absolute inset-y-0 left-[22%] hidden w-px bg-white/25 lg:block" />
      <div aria-hidden className="absolute inset-y-0 right-[28%] hidden w-px bg-white/25 lg:block" />

      <div className="relative flex min-h-[36rem] flex-col justify-between gap-10 p-6 sm:p-10">
        {/* Floating readouts */}
        <div className="flex flex-wrap items-start justify-end gap-4 pt-2 sm:gap-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={`bars-${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="w-56 rounded-2xl border border-white/50 bg-white/75 p-4 backdrop-blur-md"
            >
              <p className="text-[13px] font-medium text-foreground">{slide.bars.label}</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{slide.bars.value}</p>
              <p className="text-[11px] text-muted-foreground">{slide.bars.sub}</p>
              <div className="mt-3 flex h-12 items-end gap-1.5">
                {slide.bars.series.map((v, i) => (
                  <motion.span
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${v}%` }}
                    transition={{ delay: i * 0.04, duration: 0.35 }}
                    className="flex-1 rounded-sm bg-brand-500/70"
                  />
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.div
              key={`trend-${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, delay: 0.05 }}
              className="w-60 rounded-2xl border border-white/50 bg-white/75 p-4 backdrop-blur-md"
            >
              <p className="text-[13px] font-medium text-foreground">{slide.trend.label}</p>
              <div className="mt-3 flex items-end justify-between gap-4">
                <div>
                  <p className="text-2xl font-semibold text-foreground">{slide.trend.primary[0]}</p>
                  <p className="text-[11px] text-muted-foreground">{slide.trend.primary[1]}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{slide.trend.secondary[1]}</p>
                  <p className="text-[11px] text-muted-foreground">{slide.trend.secondary[0]}</p>
                </div>
              </div>
              <svg viewBox="0 0 200 44" className="mt-3 w-full" fill="none" aria-hidden preserveAspectRatio="none">
                <path
                  d="M0 34 L33 26 L66 30 L100 18 L133 22 L166 10 L200 6"
                  stroke="var(--brand-600)"
                  strokeWidth="1.5"
                />
                {[0, 33, 66, 100, 133, 166, 200].map((x, i) => (
                  <circle key={x} cx={x} cy={[34, 26, 30, 18, 22, 10, 6][i]} r="2" fill="var(--brand-600)" />
                ))}
              </svg>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Controls and caption */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous step"
              className="flex size-11 items-center justify-center rounded-full bg-white/80 text-foreground backdrop-blur-md transition-colors hover:bg-white"
            >
              <ArrowLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next step"
              className="flex size-11 items-center justify-center rounded-full bg-white/80 text-foreground backdrop-blur-md transition-colors hover:bg-white"
            >
              <ArrowRight className="size-4" />
            </button>
            <span className="text-[13px] text-white/80" aria-live="polite">
              [ {String(index + 1).padStart(2, "0")}/{String(SLIDES.length).padStart(2, "0")} ]
            </span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={`caption-${index}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3 }}
              className="max-w-sm"
            >
              <p className="text-lg font-semibold text-white">{slide.step}</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-white/85">{slide.body}</p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
