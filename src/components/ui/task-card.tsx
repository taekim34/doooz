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
        "flex w-full items-center gap-3 rounded-lg p-3 text-left transition-spring",
        "hover:translate-y-[-1px] hover:scale-[1.005]",
        "motion-reduce:hover:translate-y-0 motion-reduce:hover:scale-100",
        "disabled:pointer-events-none",
        done ? "opacity-60" : "bg-[color:var(--card)]",
      )}
      style={!done ? { boxShadow: "0 1px 3px rgba(0,0,0,0.04)" } : undefined}
    >
      {/* Check circle */}
      <span
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm",
          done
            ? "text-white"
            : "border-2 border-dashed",
        )}
        style={
          done
            ? { background: "var(--accent-gradient)" }
            : { borderColor: "var(--muted)" }
        }
      >
        {done ? "✓" : isBeg ? "🙏" : null}
      </span>

      {/* Title */}
      <span
        className={cn(
          "flex-1 truncate text-sm font-medium",
          done && "line-through",
        )}
        style={{ color: done ? "var(--muted)" : "var(--ink)" }}
      >
        {title}
      </span>

      {/* Points */}
      <span
        className="shrink-0 text-sm font-bold"
        style={{ color: done ? "var(--muted)" : "var(--accent-color)" }}
      >
        +{points}
      </span>
    </button>
  );
}
