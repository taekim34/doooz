import type { CharacterStage } from "@/lib/level";
import { t, type Locale } from "@/lib/i18n";

const STAGES: { stage: CharacterStage; emoji: string; nameKey: string; levels: string }[] = [
  { stage: 1, emoji: "🐣", nameKey: "characters.stage_chick", levels: "L1~6" },
  { stage: 2, emoji: "🧒", nameKey: "characters.stage_rookie", levels: "L7~12" },
  { stage: 3, emoji: "⚔️", nameKey: "characters.stage_warrior", levels: "L13~18" },
  { stage: 4, emoji: "🦸", nameKey: "characters.stage_hero", levels: "L19~24" },
  { stage: 5, emoji: "👑", nameKey: "characters.stage_legend", levels: "L25~30" },
];

export function StageProgress({ currentStage, locale = "ko" }: { currentStage: CharacterStage; locale?: Locale }) {
  return (
    <div className="flex items-center justify-between gap-1">
      {STAGES.map(({ stage, emoji, nameKey, levels }, i) => {
        const reached = currentStage >= stage;
        const isCurrent = currentStage === stage;
        return (
          <div key={stage} className="flex flex-1 flex-col items-center">
            {/* Connector line + circle */}
            <div className="flex w-full items-center">
              {i > 0 && (
                <div
                  className={`h-0.5 flex-1 ${
                    currentStage >= stage ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full text-lg transition-all ${
                  isCurrent
                    ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 scale-110"
                    : reached
                      ? "bg-primary/20"
                      : "bg-muted"
                }`}
              >
                {emoji}
              </div>
              {i < STAGES.length - 1 && (
                <div
                  className={`h-0.5 flex-1 ${
                    currentStage > stage ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
            <span
              className={`mt-1 text-[10px] font-medium ${
                isCurrent ? "text-primary" : reached ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {t(nameKey, locale)}
            </span>
            <span className="text-[9px] text-muted-foreground">{levels}</span>
          </div>
        );
      })}
    </div>
  );
}
