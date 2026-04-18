"use client";
import { cn } from "@/lib/utils";

type TaskCardProps = {
  title: string;
  points: number;
  done: boolean;
  isBeg?: boolean;
  onToggle?: () => void;
  disabled?: boolean;
};

export function TaskCard({
  title,
  points,
  done,
  isBeg = false,
  onToggle,
  disabled = false,
}: TaskCardProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled || !onToggle}
      className={cn(
        "relative flex w-full items-center gap-4 rounded-[22px] p-4 text-left transition-spring",
        "hover:translate-y-[-1px] hover:scale-[1.005]",
        "motion-reduce:hover:translate-y-0 motion-reduce:hover:scale-100",
        "disabled:pointer-events-none",
      )}
      style={{
        background: "var(--card)",
        boxShadow: done
          ? "0 12px 28px -18px rgba(45,27,61,0.12), inset 0 1px 0 rgba(255,255,255,0.6)"
          : "0 20px 40px -16px color-mix(in srgb, var(--accent-color) 22%, transparent), inset 0 1px 0 rgba(255,255,255,0.8), 0 0 0 1.5px color-mix(in srgb, var(--accent-color) 35%, transparent)",
      }}
    >
      {/* Check circle */}
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
        style={
          done
            ? { background: "var(--accent-gradient)", boxShadow: "0 8px 16px -6px color-mix(in srgb, var(--accent-color) 50%, transparent), inset 0 1px 0 rgba(255,255,255,0.45)" }
            : { border: "1.5px dashed color-mix(in srgb, var(--accent-color) 55%, transparent)", background: "color-mix(in srgb, var(--accent-color) 5%, transparent)" }
        }
      >
        {done ? (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M4 9.5L7.5 13l7-8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : isBeg ? (
          <span className="text-base">🙏</span>
        ) : null}
      </span>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div
          className={cn("text-[17px] font-semibold", done && "line-through")}
          style={{ color: done ? "color-mix(in srgb, var(--ink) 40%, transparent)" : "var(--ink)", textDecorationThickness: "1.5px" }}
        >
          {title}
        </div>
        <div className="mt-0.5 text-[13px] font-bold" style={{ color: "var(--accent-color)" }}>
          {done ? `+${points} pt 획득!` : `+${points} pt`}
        </div>
      </div>

      {/* Chevron for undone */}
      {!done && (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ background: "color-mix(in srgb, var(--ink) 4%, transparent)" }}>
          <svg width="10" height="14" viewBox="0 0 10 14" fill="none">
            <path d="M2 2l5 5-5 5" stroke="var(--ink)" strokeOpacity="0.35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      )}
    </button>
  );
}
