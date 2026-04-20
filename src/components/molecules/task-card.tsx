"use client";

import { cn } from "@/lib/utils";

export type TaskCardProps = {
  title: string;
  points: number;
  status: "pending" | "completed" | "overdue" | "pardoned";
  onToggle?: () => void;
  assigneeName?: string;
  className?: string;
};

export function TaskCard({
  title,
  points,
  status,
  onToggle,
  assigneeName,
  className,
}: TaskCardProps) {
  const isCompleted = status === "completed";
  const isOverdue = status === "overdue";
  const isPardoned = status === "pardoned";

  return (
    <div
      className={cn(
        "relative flex w-full items-center gap-4 rounded-[22px] p-4 transition-all",
        className,
      )}
      style={{
        background: isPardoned
          ? "color-mix(in srgb, var(--surface-raised) 70%, transparent)"
          : "var(--surface-raised)",
        boxShadow: isCompleted
          ? "0 12px 28px -18px rgba(45,27,61,0.12), inset 0 1px 0 rgba(255,255,255,0.6)"
          : "var(--shadow-card, 0 1px 3px rgba(0,0,0,0.06))",
        borderLeft: isOverdue ? "4px solid var(--error)" : undefined,
        opacity: isPardoned ? 0.7 : 1,
      }}
    >
      {/* Check circle */}
      <button
        type="button"
        onClick={onToggle}
        disabled={!onToggle || isPardoned}
        aria-label={isCompleted ? "Mark incomplete" : "Mark complete"}
        className="flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-full transition-all disabled:cursor-not-allowed"
        style={
          isCompleted
            ? {
                background: "var(--accent-gradient, var(--accent))",
                boxShadow:
                  "0 4px 8px -2px color-mix(in srgb, var(--accent) 40%, transparent)",
              }
            : {
                border:
                  "1.5px solid color-mix(in srgb, var(--accent) 55%, transparent)",
                background:
                  "color-mix(in srgb, var(--accent) 5%, transparent)",
              }
        }
      >
        {isCompleted && (
          <svg width="12" height="12" viewBox="0 0 18 18" fill="none">
            <path
              d="M4 9.5L7.5 13l7-8"
              stroke="#fff"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            "text-[16px] font-semibold leading-snug",
            isCompleted && "line-through",
          )}
          style={{
            color: isCompleted || isPardoned
              ? "color-mix(in srgb, var(--ink) 40%, transparent)"
              : "var(--ink)",
            textDecorationThickness: "1.5px",
          }}
        >
          {title}
        </div>
        {assigneeName && (
          <div
            className="mt-0.5 text-[13px]"
            style={{ color: "var(--ink-subtle)" }}
          >
            {assigneeName}
          </div>
        )}
      </div>

      {/* Points + status badge */}
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span
          className="text-[14px] font-bold"
          style={{ color: "var(--accent)" }}
        >
          {isCompleted ? `+${points}` : `${points} pt`}
        </span>
        {isPardoned && (
          <span
            className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
            style={{
              background: "color-mix(in srgb, var(--ink-subtle) 15%, transparent)",
              color: "var(--ink-subtle)",
            }}
          >
            pardoned
          </span>
        )}
        {isOverdue && (
          <span
            className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
            style={{
              background: "color-mix(in srgb, #EF4444 12%, transparent)",
              color: "var(--error)",
            }}
          >
            overdue
          </span>
        )}
      </div>
    </div>
  );
}
