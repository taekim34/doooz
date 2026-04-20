import type { CharacterStage } from "@/lib/level";
import { t, type Locale } from "@/lib/i18n";

const ACCENT = "#FF6B9D";
const ACCENT_GRAD = "linear-gradient(135deg, #FF6B9D 0%, #FFA07A 100%)";
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
    <div style={{ position: "relative", padding: "4px 4px 0" }}>
      {/* Base track */}
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 22,
          right: 22,
          height: 2,
          background: "var(--border)",
          borderRadius: 9999,
          zIndex: 0,
        }}
      />
      {/* Progressed line */}
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 22,
          width: `calc(${(currentIdx / (STAGES.length - 1)) * 100}% * (1 - 44px / 100%))`,
          height: 2,
          background: ACCENT,
          borderRadius: 9999,
          zIndex: 0,
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "grid",
          gridTemplateColumns: `repeat(${STAGES.length}, 1fr)`,
          gap: 0,
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
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 9999,
                  background: circleBg,
                  border: circleBorder,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow:
                    state === "current"
                      ? `0 8px 18px -8px ${ACCENT_SHADOW}`
                      : "none",
                  position: "relative",
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
                    style={{
                      fontSize: state === "current" ? 18 : 16,
                      opacity: iconOpacity,
                      lineHeight: 1,
                    }}
                  >
                    {s.icon}
                  </span>
                )}
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: state === "current" ? 800 : 600,
                  color: labelColor,
                  letterSpacing: "-0.01em",
                  whiteSpace: "nowrap",
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
