"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Lenis-driven smooth scrolling for the marketing pages.
 *
 * Two things have to be true for this to behave:
 *
 *  1. CSS `scroll-behavior: smooth` must be off while Lenis is running. Lenis
 *     animates `scrollTop` itself on every frame; if the browser is *also*
 *     easing that property, anchor jumps stutter and fight. The rule is removed
 *     from `html` here (and restored on unmount) rather than deleted from
 *     globals.css, so the dashboards — which don't mount Lenis — keep it.
 *
 *  2. ScrollTrigger has to be told where the scroll position now comes from,
 *     otherwise scrubbed parallax lags a frame behind the content.
 *
 * Reduced-motion visitors get no Lenis at all; native scrolling with the CSS
 * rule left intact is exactly what they asked for.
 */

gsap.registerPlugin(ScrollTrigger);

export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const root = document.documentElement;
    const previousBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
      // Touch devices already have momentum scrolling that feels better than
      // anything re-implemented in JS, and hijacking it costs responsiveness.
      syncTouch: false,
    });

    // Drive Lenis from GSAP's ticker so the two share a single rAF loop.
    const onTick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

    lenis.on("scroll", ScrollTrigger.update);

    // In-page anchors need to go through Lenis, or the browser's own jump
    // desynchronises it from the position it thinks it's at.
    const onAnchorClick = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement | null)?.closest?.('a[href^="#"]');
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href === "#") return;

      const target = document.querySelector(href);
      if (!target) return;

      event.preventDefault();
      // No manual offset: Lenis honours the target's own `scroll-margin-top`,
      // and every section here already carries `scroll-mt-24` for the fixed nav.
      // Passing another -96 on top of it lands the heading twice as far down.
      lenis.scrollTo(target as HTMLElement);
      history.pushState(null, "", href);
    };
    document.addEventListener("click", onAnchorClick);

    return () => {
      document.removeEventListener("click", onAnchorClick);
      lenis.off("scroll", ScrollTrigger.update);
      gsap.ticker.remove(onTick);
      lenis.destroy();
      root.style.scrollBehavior = previousBehavior;
    };
  }, []);

  return null;
}

export default SmoothScroll;
