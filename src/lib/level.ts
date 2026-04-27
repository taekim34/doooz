/**
 * Level + title calculator.
 *
 * Levels: L1..L9 use the original threshold table (gentle early curve).
 * From L10 onwards, threshold(L) = L9 + (L - 9) * LINEAR_DELTA — linear and unbounded.
 *
 * Titles: 30 named tiers anchored to lifetime points only (decoupled from level).
 *   Past 1,000,000pt the level keeps climbing while the title stays at title_30.
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

/**
 * 30 title milestones tied to lifetime points (NOT level).
 * Once lifetime ≥ TITLE_THRESHOLDS[i], user has earned title_(i+1).
 * Past the last threshold the user keeps title_30.
 */
export const TITLE_THRESHOLDS: readonly number[] = [
  0,         // title_1
  150,       // title_2
  400,       // title_3
  800,       // title_4
  1_500,     // title_5
  2_500,     // title_6
  4_500,     // title_7
  7_000,     // title_8
  10_000,    // title_9
  15_000,    // title_10
  22_000,    // title_11
  32_000,    // title_12
  45_000,    // title_13
  60_000,    // title_14
  80_000,    // title_15
  100_000,   // title_16
  130_000,   // title_17
  160_000,   // title_18
  190_000,   // title_19
  220_000,   // title_20
  280_000,   // title_21
  340_000,   // title_22
  400_000,   // title_23
  470_000,   // title_24
  540_000,   // title_25
  620_000,   // title_26
  700_000,   // title_27
  800_000,   // title_28
  900_000,   // title_29
  1_000_000, // title_30
] as const;

export const TITLE_COUNT = TITLE_THRESHOLDS.length;

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
 * Stage mapping kept for character art switching (5 bands of 6 levels).
 * Past L30 we cap at stage 5.
 */
export function getStage(level: number): CharacterStage {
  if (level <= 6) return 1;
  if (level <= 12) return 2;
  if (level <= 18) return 3;
  if (level <= 24) return 4;
  return 5;
}

/**
 * Title tier (1-indexed) earned for a given lifetime. Caps at TITLE_COUNT.
 */
export function getTitleTier(lifetime: number): number {
  if (!Number.isFinite(lifetime) || lifetime < 0) return 1;
  let tier = 1;
  for (let i = 0; i < TITLE_THRESHOLDS.length; i++) {
    if (lifetime >= (TITLE_THRESHOLDS[i] as number)) tier = i + 1;
    else break;
  }
  return tier;
}

/**
 * i18n title key resolver.
 * Reads "level.title_1" .. "level.title_30" (clamped). Decoupled from level
 * — titles are tier-based on lifetime, not level number.
 */
export function getLevelTitle(
  levelOrTier: number,
  tFn?: (key: string) => string,
): string {
  const clamped = Math.max(1, Math.min(TITLE_COUNT, levelOrTier));
  if (tFn) return tFn(`level.title_${clamped}`);
  return `L${clamped}`;
}

/**
 * Direct lifetime → translated title (preferred over getLevelTitle for kid stats).
 */
export function getTitleByLifetime(
  lifetime: number,
  tFn?: (key: string) => string,
): string {
  return getLevelTitle(getTitleTier(lifetime), tFn);
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

/* ---------- back-compat exports (deprecated) ---------- */

/** @deprecated Levels are unbounded. Reference TITLE_COUNT for the title cap instead. */
export const MAX_LEVEL = TITLE_COUNT;

/**
 * @deprecated Use levelThreshold(level) for arbitrary levels.
 * Materialised first-30 lookup retained for the legacy character/levels table UI.
 */
export const LEVEL_THRESHOLDS: readonly number[] = Array.from(
  { length: TITLE_COUNT },
  (_, i) => levelThreshold(i + 1),
);

/** @deprecated Titles moved to i18n keys. */
export const LEVEL_TITLES: readonly string[] = [] as const;
