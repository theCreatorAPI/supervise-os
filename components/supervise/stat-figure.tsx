"use client";

import { useEffect, useRef } from "react";
import { animate, utils } from "animejs";

/**
 * The numerals in the stats band, counted up by anime.js.
 *
 * anime's job here is the value interpolation itself — it tweens a plain number
 * through an eased curve and hands back each frame, which is awkward to express
 * in the transform-oriented libraries used elsewhere. The element's opacity and
 * position are left alone so the surrounding `ScrollReveal` keeps ownership of
 * them.
 *
 * The count runs once, when the figure first scrolls into view.
 */

export function StatFigure({
  value,
  suffix = "",
  className,
}: {
  value: number;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  // A ref, not state: whether the count has run doesn't affect what React
  // renders, and setting state from inside the effect would cascade a render.
  const hasRun = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || hasRun.current) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.textContent = String(value);
      hasRun.current = true;
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        hasRun.current = true;

        const counter = { n: 0 };
        animate(counter, {
          n: value,
          duration: 1400,
          ease: "out(3)",
          onUpdate: () => {
            el.textContent = String(utils.round(counter.n, 0));
          },
        });
      },
      { threshold: 0.4 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);

  return (
    <span className={className}>
      {/* Server-rendered with the final value so the figure is correct with JS
          off, and correct for crawlers; the observer overwrites it on entry. */}
      <span ref={ref}>{value}</span>
      {suffix}
    </span>
  );
}
