/**
 * Emoji placeholders for the 10 characters × 5 evolution stages.
 * Baby (L1-5) → Child (L6-10) → Teen (L11-15) → Hero (L16-20) → Legend (L21-30)
 * Replace with SVG illustrations later (schema unchanged).
 */
import type { CharacterStage } from "@/lib/level";

type StageIndex = 0 | 1 | 2 | 3 | 4;

const MAP: Record<string, [string, string, string, string, string]> = {
  fox:     ["🦊", "🦊", "🦊", "🦊", "🦊"],
  bear:    ["🐻", "🐻", "🐻", "🐻", "🐻"],
  cat:     ["🐱", "🐱", "🐱", "🐱", "🐱"],
  rabbit:  ["🐰", "🐰", "🐰", "🐰", "🐰"],
  penguin: ["🐧", "🐧", "🐧", "🐧", "🐧"],
  panda:   ["🐼", "🐼", "🐼", "🐼", "🐼"],
  lion:    ["🦁", "🦁", "🦁", "🦁", "🦁"],
  owl:     ["🦉", "🦉", "🦉", "🦉", "🦉"],
  dragon:  ["🐉", "🐉", "🐉", "🐉", "🐉"],
  unicorn: ["🦄", "🦄", "🦄", "🦄", "🦄"],
  tiger:   ["🐯", "🐯", "🐯", "🐯", "🐯"],
  hamster: ["🐹", "🐹", "🐹", "🐹", "🐹"],
};

// Stage decorations appended by stage number so visual evolution is clear.
const STAGE_SUFFIX: Record<StageIndex, string> = {
  0: "🐣", // baby
  1: "",   // child
  2: "✨", // teen
  3: "⚔️", // hero
  4: "👑", // legend
};

export function characterEmoji(characterId: string | null | undefined, stage: CharacterStage): string {
  if (!characterId || !MAP[characterId]) return "🐣";
  const base = MAP[characterId][(stage - 1) as StageIndex];
  const suffix = STAGE_SUFFIX[(stage - 1) as StageIndex];
  return suffix ? `${base}${suffix}` : base;
}

export const ALL_CHARACTER_IDS = Object.keys(MAP);
