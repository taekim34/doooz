import * as React from "react";
import { cn } from "@/lib/utils";

export interface LevelPillProps {
  level: number;
  className?: string;
}

export function LevelPill({ level, className }: LevelPillProps) {
  return (
    <span
      data-nums=""
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-pill text-[12px] font-bold leading-none",
        "bg-[image:var(--accent-gradient)] text-white",
        "[&:where([data-mode='parent']_*,[data-mode='parent'])]:bg-none",
        "[&:where([data-mode='parent']_*,[data-mode='parent'])]:border",
        "[&:where([data-mode='parent']_*,[data-mode='parent'])]:border-[color:var(--accent-color)]",
        "[&:where([data-mode='parent']_*,[data-mode='parent'])]:text-[color:var(--accent-color)]",
        className,
      )}
    >
      Lv&nbsp;{level}
    </span>
  );
}
