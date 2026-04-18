import * as React from "react";
import { cn } from "@/lib/utils";

export interface ProgressTrackProps {
  /** 0-100. Values outside are clamped. */
  value: number;
  size?: "sm" | "md";
  className?: string;
}

export function ProgressTrack({ value, size = "md", className }: ProgressTrackProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        "w-full overflow-hidden rounded-pill bg-black/5",
        // Kid: taller, more visible
        "h-3",
        size === "sm" && "h-2",
        // Parent override: thinner
        "[&:where([data-mode='parent']_*,[data-mode='parent'])]:h-1",
        size === "sm" &&
          "[&:where([data-mode='parent']_*,[data-mode='parent'])]:h-0.5",
        className,
      )}
    >
      <div
        data-fill=""
        className={cn(
          "h-full rounded-pill transition-spring",
          "bg-[image:var(--accent-gradient)]",
          "[&:where([data-mode='parent']_*,[data-mode='parent'])]:bg-none",
          "[&:where([data-mode='parent']_*,[data-mode='parent'])]:bg-[color:var(--ink)]",
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
