"use client";
import { cn } from "@/lib/utils";

type ApprovalRowProps = {
  kidName: string;
  taskTitle: string;
  points: number;
  timeAgo: string;
  onApprove: () => void;
  onReject: () => void;
  disabled?: boolean;
  className?: string;
};

export function ApprovalRow({
  kidName,
  taskTitle,
  points,
  timeAgo,
  onApprove,
  onReject,
  disabled = false,
  className,
}: ApprovalRowProps) {
  return (
    <div
      className={cn("flex items-center gap-3 rounded-[14px] p-4", className)}
      style={{
        background: "var(--card)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
          {taskTitle}
        </div>
        <div className="mt-0.5 text-xs" style={{ color: "var(--muted)" }}>
          {kidName} 요청 · {timeAgo}
        </div>
      </div>
      <span className="shrink-0 text-sm font-bold" style={{ color: "var(--accent-color)" }}>
        +{points}
      </span>
      <div className="flex shrink-0 gap-1.5">
        <button
          type="button"
          onClick={onReject}
          disabled={disabled}
          className="flex h-8 w-8 items-center justify-center rounded-full transition-spring disabled:opacity-40"
          style={{ background: "color-mix(in srgb, var(--ink) 6%, transparent)" }}
          aria-label="거절"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 3l8 8M11 3l-8 8" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        <button
          type="button"
          onClick={onApprove}
          disabled={disabled}
          className="flex h-8 w-8 items-center justify-center rounded-full transition-spring disabled:opacity-40"
          style={{ background: "var(--accent-gradient)", boxShadow: "0 4px 8px -2px color-mix(in srgb, var(--accent-color) 40%, transparent)" }}
          aria-label="승인"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 7.5L5.5 10l5.5-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
