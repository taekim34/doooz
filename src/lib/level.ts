/**
 * Level calculator + character stage mapping.
 *
 * Levels: L1..L9 use the original threshold table (gentle early curve).
 * From L10 onwards, threshold(L) = L9 + (L - 9) * LINEAR_DELTA — linear and unbounded.
 *
 * Titles are stage-based (5 stages tied to level ranges). The previous 30-tier
 * title system has been removed; only the stage label is used.
 *
 * SQL `calculate_level()` mirrors this — change both or neither.
 */

const ANCHOR_TABLE: readonly number[] = [
  0,         // L1
  150,       // L2
  400,       // L3
  800,       // L4
  1_500,     // L5
  2_500,     // L6
  4_500,     // L7
  7_000,     // L8
  10_000,    // L9
] as const;

const ANCHOR_LEVEL = ANCHOR_TABLE.length; // 9
const ANCHOR_LIFETIME = ANCHOR_TABLE[ANCHOR_LEVEL - 1] as number; // 10000
const LINEAR_DELTA = 5_000;

export function calculateLevel(lifetime: number): number {
  if (!Number.isFinite(lifetime) || lifetime < 0) return 1;
  if (lifetime >= ANCHOR_LIFETIME) {
    return ANCHOR_LEVEL + Math.floor((lifetime - ANCHOR_LIFETIME) / LINEAR_DELTA);
  }
  let level = 1;
  for (let i = 0; i < ANCHOR_TABLE.length; i++) {
    if (lifetime >= (ANCHOR_TABLE[i] as number)) level = i + 1;
    else break;
  }
  return level;
}

/** Lifetime threshold required to reach `level` (1-indexed). */
export function levelThreshold(level: number): number {
  if (level <= 1) return 0;
  if (level <= ANCHOR_LEVEL) return ANCHOR_TABLE[level - 1] as number;
  return ANCHOR_LIFETIME + (level - ANCHOR_LEVEL) * LINEAR_DELTA;
}

/** Lifetime threshold for the next level. Always defined (levels are unbounded). */
export function nextLevelAt(level: number): number {
  return levelThreshold(level + 1);
}

export type CharacterStage = 1 | 2 | 3 | 4 | 5;

/**
 * Character stage by level — also drives the displayed title:
 *   1 (초보)   L1–6
 *   2 (루키)   L7–12
 *   3 (용사)   L13–24
 *   4 (영웅)   L25–49
 *   5 (전설)   L50+
 */
export function getStage(level: number): CharacterStage {
  if (level <= 6) return 1;
  if (level <= 12) return 2;
  if (level <= 24) return 3;
  if (level <= 49) return 4;
  return 5;
}

/** Static metadata for each stage — used by stage tables and labels. */
export const STAGE_INFO: ReadonlyArray<{
  stage: CharacterStage;
  minLevel: number;
  maxLevel: number | null;
  i18nKey: string;
  icon: string;
}> = [
  { stage: 1, minLevel: 1,  maxLevel: 6,  i18nKey: "characters.stage_chick",  icon: "🐣" },
  { stage: 2, minLevel: 7,  maxLevel: 12, i18nKey: "characters.stage_rookie", icon: "⭐" },
  { stage: 3, minLevel: 13, maxLevel: 24, i18nKey: "characters.stage_warrior", icon: "⚔️" },
  { stage: 4, minLevel: 25, maxLevel: 49, i18nKey: "characters.stage_hero",   icon: "🏆" },
  { stage: 5, minLevel: 50, maxLevel: null, i18nKey: "characters.stage_legend", icon: "👑" },
];

/** Translate stage to its display title (e.g. "초보", "루키"...). */
export function getStageTitle(
  stage: CharacterStage,
  tFn?: (key: string) => string,
): string {
  const info = STAGE_INFO[stage - 1]!;
  return tFn ? tFn(info.i18nKey) : `Stage ${stage}`;
}

/**
 * Returns progress towards next level as a fraction in [0, 1].
 * Levels are unbounded so `nextThreshold` is always a number.
 */
export function progressToNextLevel(lifetime: number): {
  level: number;
  currentThreshold: number;
  nextThreshold: number;
  fraction: number;
} {
  const level = calculateLevel(lifetime);
  const currentThreshold = levelThreshold(level);
  const next = nextLevelAt(level);
  const span = next - currentThreshold;
  const fraction = span <= 0 ? 1 : Math.min(1, Math.max(0, (lifetime - currentThreshold) / span));
  return { level, currentThreshold, nextThreshold: next, fraction };
}
