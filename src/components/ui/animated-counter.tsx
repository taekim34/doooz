"use client";
import { useState, useEffect, useRef } from "react";

export function useAnimatedCounter(
  target: number,
  duration = 800,
  delay = 0,
): number {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mm = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mm.matches) {
      setValue(target);
      return;
    }

    let start: number | null = null;
    const timeout = window.setTimeout(() => {
      const step = (ts: number) => {
        if (start === null) start = ts;
        const elapsed = ts - start;
        const p = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        setValue(Math.round(eased * target));
        if (p < 1) rafRef.current = requestAnimationFrame(step);
      };
      rafRef.current = requestAnimationFrame(step);
    }, delay);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration, delay]);

  return value;
}
