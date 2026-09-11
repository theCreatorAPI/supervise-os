"use client";

import { useRef } from "react";
import { animated, useSpring } from "@react-spring/web";

/**
 * Pointer-reactive lift and tilt for the capability cards, on react-spring.
 *
 * Springs are the right tool here specifically because this motion is
 * interruptible: the pointer can reverse mid-travel, and a spring carries its
 * current velocity into the new target instead of restarting a fixed-duration
 * tween. That is the one thing duration-based libraries handle badly, so it is
 * the one job react-spring owns in this codebase.
 *
 * Nothing else animates these elements — the reveal-on-scroll wrapper sits on a
 * parent, so the two never write to the same transform.
 */

const TILT_DEGREES = 5;
const LIFT_PX = -6;

export function SpringCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const [style, api] = useSpring(() => ({
    rotateX: 0,
    rotateY: 0,
    y: 0,
    config: { mass: 1, tension: 260, friction: 26 },
  }));

  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const onMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (reduced || event.pointerType === "touch") return;
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;

    api.start({
      rotateY: px * TILT_DEGREES * 2,
      rotateX: -py * TILT_DEGREES * 2,
      y: LIFT_PX,
    });
  };

  const onLeave = () => api.start({ rotateX: 0, rotateY: 0, y: 0 });

  return (
    // Perspective belongs to the parent: react-spring composes the transform
    // from rotateX/rotateY/y, and a perspective() inside that same transform
    // would be overwritten on every frame.
    <div style={{ perspective: 900 }}>
      <animated.div
        ref={ref}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        className={className}
        style={{ ...style, willChange: "transform" }}
      >
        {children}
      </animated.div>
    </div>
  );
}
