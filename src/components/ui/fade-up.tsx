"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

export interface FadeUpProps {
  children: React.ReactNode;
  /** Stagger delay in ms. Caller computes e.g. `index * 80`. */
  delay?: number;
  className?: string;
  /** When true, runs once on mount instead of on viewport intersection. Useful when already-visible content shouldn't wait. */
  immediate?: boolean;
}

export function FadeUp({ children, delay = 0, className, immediate = false }: FadeUpProps) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = React.useState(immediate);

  React.useEffect(() => {
    if (immediate) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            io.disconnect();
            break;
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [immediate]);

  return (
    <div
      ref={ref}
      className={cn(
        visible ? "animate-fadeInUp" : "opacity-0",
        "motion-reduce:animate-none motion-reduce:opacity-100",
        className,
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
