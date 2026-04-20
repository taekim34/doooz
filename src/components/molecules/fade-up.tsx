"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface FadeUpProps {
  children: React.ReactNode;
  /** Stagger delay in ms */
  delay?: number;
  /** Animation duration in ms */
  duration?: number;
  className?: string;
  /** Wrapper element type */
  as?: "div" | "section" | "li";
}

export function FadeUp({
  children,
  delay = 0,
  duration = 400,
  className,
  as = "div",
}: FadeUpProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced || !el || typeof IntersectionObserver === "undefined") {
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
  }, []);

  return (
    <div
      ref={ref}
      role={as !== "div" ? "presentation" : undefined}
      data-as={as !== "div" ? as : undefined}
      className={cn(
        visible
          ? "animate-[fadeUpMol] fill-mode-both"
          : "opacity-0 translate-y-4",
        className,
      )}
      style={
        visible
          ? {
              animationDuration: `${duration}ms`,
              animationDelay: `${delay}ms`,
              animationTimingFunction: "var(--ease-spring)",
              animationFillMode: "both",
              "--fade-up-translate": "16px",
            } as React.CSSProperties
          : undefined
      }
    >
      <style>{`
        @keyframes fadeUpMol {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      {children}
    </div>
  );
}
