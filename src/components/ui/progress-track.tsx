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
        "w-full overflow-hidden rounded-pill",
        // Kid: taller, more visible
        "h-3",
        size === "sm" && "h-2",
        // Parent override: thinner
        "[&:where([data-mode='parent']_*,[data-mode='parent'])]:h-1",
        size === "sm" &&
          "[&:where([data-mode='parent']_*,[data-mode='parent'])]:h-0.5",
        className,
      )}
      style={{
        background: "color-mix(in srgb, var(--ink) 6%, transparent)",
      }}
    >
      <div
        data-fill=""
        className={cn(
          "relative h-full rounded-pill transition-spring",
          "bg-[image:var(--accent-gradient)]",
          "[&:where([data-mode='parent']_*,[data-mode='parent'])]:bg-none",
          "[&:where([data-mode='parent']_*,[data-mode='parent'])]:bg-[color:var(--ink)]",
        )}
        style={{
          width: `${clamped}%`,
          boxShadow:
            "0 0 12px color-mix(in srgb, var(--accent-color) 60%, transparent), inset 0 1px 0 rgba(255,255,255,0.5)",
        }}
      >
        {/* Glass shine overlay */}
        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-pill"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 60%)",
          }}
        />
      </div>
    </div>
  );
}
