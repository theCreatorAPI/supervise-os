"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AuthPanelMockup } from "@/components/supervise/mockups/auth-panel-mockup";

const SLIDES = [
  {
    title: "Every milestone, in one live view",
    body: "Track submissions, reviews and approvals for every project from a single dashboard.",
  },
  {
    title: "Risk surfaces before it's late",
    body: "Stale submissions, overdue reviews and missed meetings are flagged the moment they happen.",
  },
  {
    title: "Workload you can actually see",
    body: "Capacity per supervisor at a glance, so nobody quietly ends up carrying twice the load.",
  },
];

const ROTATE_MS = 6000;

export function AuthShowcase() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    // Respect a reduced-motion preference by not auto-advancing.
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const timer = window.setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, ROTATE_MS);
    return () => window.clearInterval(timer);
  }, []);

  const slide = SLIDES[index];

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-3xl bg-linear-to-br from-[#8aa653] via-brand-500 to-brand-700">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(white_1px,transparent_1px)] bg-size-[22px_22px] opacity-[0.10]"
      />
      <div aria-hidden className="absolute -right-20 -top-24 size-96 rounded-full bg-brand-300/30 blur-[110px]" />

      <div className="relative z-10 px-10 pt-12 lg:px-14 lg:pt-14">
        <div className="min-h-[9rem] max-w-md">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
            >
              <h2 className="text-2xl font-semibold leading-snug text-white lg:text-[1.75rem]">
                {slide.title}
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-white/80">{slide.body}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-7 flex items-center gap-2">
          {SLIDES.map((s, i) => (
            <button
              key={s.title}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show slide ${i + 1}: ${s.title}`}
              aria-current={i === index}
              className={
                i === index
                  ? "h-1.5 w-8 rounded-full bg-white transition-all"
                  : "size-1.5 rounded-full bg-white/40 transition-all hover:bg-white/70"
              }
            />
          ))}
        </div>
      </div>

      {/* Product screenshot, angled into the panel and cropped by its edges */}
      <div className="relative z-10 mt-6 flex-1">
        <div
          className="absolute left-16 top-0 w-fit origin-top-left drop-shadow-[0_40px_70px_rgba(12,20,6,0.55)] lg:left-24"
          style={{ transform: "perspective(1400px) rotateX(8deg) rotateY(-22deg) rotate(6deg) scale(1.55)" }}
        >
          <AuthPanelMockup />
        </div>
      </div>
    </div>
  );
}
