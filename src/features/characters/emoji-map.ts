/**
 * Emoji placeholders for 22 characters × 5 evolution stages.
 * Used as fallback only when no PNG is available (stage 1 / unknown id).
 * 병아리 (L1-6) → 루키 (L7-12) → 용사 (L13-18) → 영웅 (L19-24) → 전설 (L25+)
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
  // Cute monsters (unlock L8)
  mono:    ["👾", "👾", "👾", "👾", "👾"],
  jellu:   ["🪼", "🪼", "🪼", "🪼", "🪼"],
  pinku:   ["💗", "💗", "💗", "💗", "💗"],
  honey:   ["🍯", "🍯", "🍯", "🍯", "🍯"],
  leaf:    ["🍃", "🍃", "🍃", "🍃", "🍃"],
  frost:   ["❄️", "❄️", "❄️", "❄️", "❄️"],
  // Mythical creatures (unlock L16) — alongside dragon/unicorn
  gumiho:  ["🌙", "🌙", "🌙", "🌙", "🌙"],
  griffin: ["🦅", "🦅", "🦅", "🦅", "🦅"],
  pegasus: ["🐴", "🐴", "🐴", "🐴", "🐴"],
  phoenix: ["🔥", "🔥", "🔥", "🔥", "🔥"],
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
