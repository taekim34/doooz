import { cn } from "@/lib/utils";

export interface StageProgressStage {
  name: string;
  minLevel: number;
}

export interface StageProgressProps {
  /** Current stage (1-5) */
  currentStage: number;
  /** Stage definitions */
  stages: StageProgressStage[];
  className?: string;
}

/**
 * Horizontal 5-stage roadmap indicator.
 *
 * Completed stages show a filled accent circle with a checkmark.
 * The current stage pulses with a gradient highlight.
 * Future stages appear as gray outlines.
 */
export function StageProgress({
  currentStage,
  stages,
  className,
}: StageProgressProps) {
  const currentIdx = Math.max(
    0,
    stages.findIndex((_, i) => i + 1 === currentStage),
  );

  const progressPct =
    stages.length > 1 ? (currentIdx / (stages.length - 1)) * 100 : 0;

  return (
    <div className={cn("relative px-1 pt-1", className)}>
      {/* Base track */}
      <div
        className="absolute top-[21px] left-[22px] right-[22px] h-0.5 rounded-full"
        style={{ background: "var(--track-bg, #E5E5E5)" }}
      />

      {/* Progressed track */}
      <div
        className="absolute top-[21px] left-[22px] h-0.5 rounded-full"
        style={{
          width: `calc(${progressPct}% - ${(progressPct / 100) * 44}px)`,
          background: "var(--accent-color, #FF6B9D)",
        }}
      />

      {/* Steps */}
      <div
        className="relative z-[1] grid"
        style={{ gridTemplateColumns: `repeat(${stages.length}, 1fr)` }}
      >
        {stages.map((stage, i) => {
          const state: "done" | "current" | "future" =
            i < currentIdx ? "done" : i === currentIdx ? "current" : "future";

          return (
            <div
              key={stage.name}
              className="flex flex-col items-center gap-1.5"
            >
              {/* Circle */}
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full box-border",
                  state === "current" && "animate-pulse",
                )}
                style={{
                  background:
                    state === "current"
                      ? "linear-gradient(135deg, var(--accent-color, #FF6B9D) 0%, var(--accent-color-end, #FFA07A) 100%)"
                      : state === "done"
                        ? "var(--border)"
                        : "var(--surface)",
                  border:
                    state === "future" ? "2px solid var(--border)" : "none",
                  boxShadow:
                    state === "current"
                      ? "0 8px 18px -8px rgba(255,107,157,0.35)"
                      : "none",
                }}
              >
                {state === "done" ? (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden
                  >
                    <path
                      d="M3.5 8.5l3 3 6-7"
                      stroke="#FFFFFF"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <span
                    className={cn(
                      "font-extrabold leading-none tabular-nums",
                      state === "current"
                        ? "text-white text-sm"
                        : "text-gray-400 text-xs",
                    )}
                  >
                    {i + 1}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className={cn(
                  "text-[11px] tracking-tight whitespace-nowrap",
                  state === "current"
                    ? "font-extrabold text-[color:var(--ink)]"
                    : "font-semibold text-[color:var(--ink-muted)]",
                )}
              >
                {stage.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
