"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Scroll-linked parallax, powered by GSAP's ScrollTrigger.
 *
 * This is deliberately the only scroll-*scrubbed* motion in the codebase.
 * `ScrollReveal` (framer-motion) still owns one-shot "animate in when it enters
 * the viewport" reveals; what it can't do is tie a transform continuously to
 * scroll position, which is what gives the hero and the section visuals their
 * sense of depth. Keeping the two concerns in separate components stops them
 * fighting over the same element.
 */

gsap.registerPlugin(ScrollTrigger);

type ParallaxProps = {
  children: React.ReactNode;
  /** Vertical drift across the scrubbed range, in pixels. Negative moves up. */
  y?: number;
  /** Fade to this opacity across the range. 1 leaves opacity alone. */
  fadeTo?: number;
  /** Where the scrub starts/ends, in ScrollTrigger's syntax. */
  start?: string;
  end?: string;
  className?: string;
};

export function Parallax({
  children,
  y = -80,
  fadeTo = 1,
  start = "top top",
  end = "bottom top",
  className,
}: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Scrubbed motion is exactly the kind of thing reduced-motion users opt out
    // of, and unlike CSS transitions the globals.css block can't reach it.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      gsap.to(el, {
        y,
        ...(fadeTo !== 1 ? { opacity: fadeTo } : {}),
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start,
          end,
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      });
    }, el);

    return () => ctx.revert();
  }, [y, fadeTo, start, end]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
