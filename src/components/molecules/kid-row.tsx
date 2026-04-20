import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { Route } from "next";
import { CharacterAvatar } from "./character-avatar";
import { ProgressTrack } from "@/components/atoms/progress-track";

/* ------------------------------------------------------------------ */
/*  CVA variants                                                       */
/* ------------------------------------------------------------------ */

const kidRowVariants = cva(
  "flex items-center gap-3 rounded-lg p-3 transition-colors",
  {
    variants: {
      interactive: {
        true: "hover:bg-[color:var(--surface-raised)] cursor-pointer",
        false: "",
      },
    },
    defaultVariants: {
      interactive: false,
    },
  },
);

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export interface KidRowProps extends VariantProps<typeof kidRowVariants> {
  name: string;
  characterId: string;
  level: number;
  /** 0-100 progress percentage */
  progress: number;
  completedCount: number;
  totalCount: number;
  href?: string;
  className?: string;
}

const Chevron = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    className="shrink-0 text-[color:var(--ink-subtle)]"
  >
    <path
      d="M6 4l4 4-4 4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const KidRow = React.forwardRef<HTMLDivElement, KidRowProps>(
  (
    {
      name,
      characterId,
      level,
      progress,
      completedCount,
      totalCount,
      href,
      className,
    },
    ref,
  ) => {
    const content = (
      <>
        <CharacterAvatar characterId={characterId} size="lg" level={level} />

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="truncate text-sm font-semibold text-[color:var(--ink)]">
              {name}
            </span>
            <span className="text-xs text-[color:var(--ink-subtle)]">
              Lv.{level}
            </span>
          </div>

          {totalCount > 0 && (
            <ProgressTrack value={progress} className="mt-1.5 h-1" />
          )}
        </div>

        <div className="shrink-0 text-right">
          <span className="text-lg font-bold text-[color:var(--ink)]">
            {completedCount}/{totalCount}
          </span>
        </div>

        {href && <Chevron />}
      </>
    );

    if (href) {
      return (
        <Link
          href={href as Route}
          className={cn(
            kidRowVariants({ interactive: true }),
            className,
          )}
        >
          {content}
        </Link>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(kidRowVariants({ interactive: false }), className)}
      >
        {content}
      </div>
    );
  },
);

KidRow.displayName = "KidRow";

export { KidRow, kidRowVariants };
