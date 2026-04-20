import type { CharacterStage } from "@/lib/level";
import { t, type Locale } from "@/lib/i18n";

const ACCENT = "#FF6B9D";
const ACCENT_GRAD = "var(--accent-gradient)";
const ACCENT_SHADOW = "rgba(255,107,157,0.35)";

const STAGES: {
  stage: CharacterStage;
  icon: string;
  nameKey: string;
}[] = [
  { stage: 1, icon: "🐣", nameKey: "characters.stage_chick" },
  { stage: 2, icon: "⭐", nameKey: "characters.stage_rookie" },
  { stage: 3, icon: "⚔️", nameKey: "characters.stage_warrior" },
  { stage: 4, icon: "🏆", nameKey: "characters.stage_hero" },
  { stage: 5, icon: "👑", nameKey: "characters.stage_legend" },
];

export function StageProgress({
  currentStage,
  locale = "ko" as Locale,
}: {
  currentStage: CharacterStage;
  locale?: Locale;
}) {
  const currentIdx = STAGES.findIndex((s) => s.stage === currentStage);

  return (
    <div className="relative px-1 pt-1">
      {/* Base track */}
      <div
        className="absolute left-[22px] right-[22px] top-5 z-0 h-0.5 rounded-full bg-[color:var(--border)]"
      />
      {/* Progressed line */}
      <div
        className="absolute left-[22px] top-5 z-0 h-0.5 rounded-full"
        style={{
          width: `calc(${(currentIdx / (STAGES.length - 1)) * 100}% * (1 - 44px / 100%))`,
          background: ACCENT,
        }}
      />

      <div
        className="relative z-[1]"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${STAGES.length}, 1fr)`,
        }}
      >
        {STAGES.map((s, i) => {
          const state =
            i < currentIdx ? "done" : i === currentIdx ? "current" : "future";
          const circleBg =
            state === "current"
              ? ACCENT_GRAD
              : state === "done"
                ? "var(--border)"
                : "var(--surface)";
          const circleBorder = state === "future" ? "2px solid var(--border)" : "none";
          const iconOpacity = state === "future" ? 0.35 : 1;
          const labelColor = state === "current" ? "var(--ink)" : "var(--ink-muted)";
          return (
            <div
              key={s.stage}
              className="flex flex-col items-center gap-1.5"
            >
              <div
                className="relative flex h-10 w-10 items-center justify-center rounded-full"
                style={{
                  background: circleBg,
                  border: circleBorder,
                  boxShadow:
                    state === "current"
                      ? `0 8px 18px -8px ${ACCENT_SHADOW}`
                      : "none",
                  boxSizing: "border-box",
                }}
              >
                {state === "done" ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
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
                    aria-hidden
                    className="leading-none"
                    style={{
                      fontSize: state === "current" ? 18 : 16,
                      opacity: iconOpacity,
                    }}
                  >
                    {s.icon}
                  </span>
                )}
              </div>
              <div
                className="whitespace-nowrap text-[11px] tracking-[-0.01em]"
                style={{
                  fontWeight: state === "current" ? 800 : 600,
                  color: labelColor,
                }}
              >
                {t(s.nameKey, locale)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
