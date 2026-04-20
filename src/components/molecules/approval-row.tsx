"use client";

import { cn } from "@/lib/utils";

export type ApprovalRowProps = {
  childName: string;
  taskTitle: string;
  points: number;
  onApprove?: () => void;
  onReject?: () => void;
  status?: "pending" | "approved" | "rejected";
  className?: string;
};

export function ApprovalRow({
  childName,
  taskTitle,
  points,
  onApprove,
  onReject,
  status = "pending",
  className,
}: ApprovalRowProps) {
  const isPending = status === "pending";

  return (
    <div
      className={cn("flex items-center gap-3 rounded-[14px] bg-[var(--surface-raised)] p-4", className)}
      style={{
        boxShadow: "var(--shadow-card, 0 1px 3px rgba(0,0,0,0.04))",
      }}
    >
      {/* Child info */}
      <div className="min-w-0 flex-1">
        <div className="text-[16px] font-semibold text-[color:var(--ink)]">
          {taskTitle}
        </div>
        <div className="mt-0.5 text-[13px] text-[color:var(--ink-subtle)]">
          {childName}
        </div>
      </div>

      {/* Points */}
      <span className="shrink-0 text-[14px] font-bold text-[color:var(--accent)]">
        +{points}
      </span>

      {/* Action buttons or status badge */}
      {isPending ? (
        <div className="flex shrink-0 gap-1.5">
          {/* Reject */}
          <button
            type="button"
            onClick={onReject}
            disabled={!onReject}
            aria-label="Reject"
            className="flex h-8 w-8 items-center justify-center rounded-full transition-all disabled:opacity-40"
            style={{
              background:
                "color-mix(in srgb, var(--ink) 6%, transparent)",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M3 3l8 8M11 3l-8 8"
                stroke="var(--error)"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>

          {/* Approve */}
          <button
            type="button"
            onClick={onApprove}
            disabled={!onApprove}
            aria-label="Approve"
            className="flex h-8 w-8 items-center justify-center rounded-full transition-all disabled:opacity-40"
            style={{
              background: "var(--accent-gradient, #22C55E)",
              boxShadow:
                "0 4px 8px -2px color-mix(in srgb, var(--accent) 40%, transparent)",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M3 7.5L5.5 10l5.5-6"
                stroke="#fff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      ) : (
        <span
          className="shrink-0 rounded-full px-3 py-1 text-[12px] font-semibold"
          style={
            status === "approved"
              ? {
                  background:
                    "color-mix(in srgb, #22C55E 12%, transparent)",
                  color: "var(--success)",
                }
              : {
                  background:
                    "color-mix(in srgb, #EF4444 12%, transparent)",
                  color: "var(--error)",
                }
          }
        >
          {status === "approved" ? "Approved" : "Rejected"}
        </span>
      )}
    </div>
  );
}
