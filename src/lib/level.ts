/**
 * Level calculator — the level curve is defined in ONE place: the constants
 * below. L1-L9 use a fixed anchor table; from L10 the curve is linear
 * (+5,000 per level). These mirror the DB `calculate_level()` function, which
 * is the authoritative store for `users.level`. This module only derives
 * display values (progress bar, level table) from the same formula, so code
 * and DB cannot drift. `LEVEL_THRESHOLDS` is generated, never hand-typed.
 * Keep ANCHOR_THRESHOLDS / LINEAR_DELTA in sync with the SQL function.
 */

const ANCHOR_THRESHOLDS: readonly number[] = [
  0, 150, 400, 800, 1_500, 2_500, 4_500, 7_000, 10_000, // L1..L9
] as const;
const ANCHOR_LEVEL = ANCHOR_THRESHOLDS.length; // 9
const ANCHOR_LIFETIME = ANCHOR_THRESHOLDS[ANCHOR_LEVEL - 1] as number; // 10_000
const LINEAR_DELTA = 5_000;

/** Display cap for the level table; the DB curve itself is unbounded. */
export const MAX_LEVEL = 30;

/** Lifetime required to reach a level (1-indexed). The single source of the curve. */
export function thresholdForLevel(level: number): number {
  if (level <= ANCHOR_LEVEL) return ANCHOR_THRESHOLDS[level - 1] as number;
  return ANCHOR_LIFETIME + (level - ANCHOR_LEVEL) * LINEAR_DELTA;
}

/** Derived from thresholdForLevel — never hand-maintained. */
export const LEVEL_THRESHOLDS: readonly number[] = Array.from(
  { length: MAX_LEVEL },
  (_, i) => thresholdForLevel(i + 1),
);

/** @deprecated Use getLevelTitle(level, locale) with i18n keys instead */
export const LEVEL_TITLES: readonly string[] = [] as const;

export function calculateLevel(lifetime: number): number {
  if (!Number.isFinite(lifetime) || lifetime < 0) return 1;
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (lifetime >= (LEVEL_THRESHOLDS[i] as number)) {
      level = i + 1;
    } else {
      break;
    }
  }
  return level;
}

export type CharacterStage = 1 | 2 | 3 | 4 | 5;

/**
 * Stage mapping: 5 equal bands across the 30-level table.
 * 새싹 L1-6, 성장 L7-12, 도약 L13-18, 영웅 L19-24, 전설 L25-30.
 */
export function getStage(level: number): CharacterStage {
  if (level <= 6) return 1;
  if (level <= 12) return 2;
  if (level <= 18) return 3;
  if (level <= 24) return 4;
  return 5;
}

/**
 * Human-readable title for a level (1-indexed).
 * Reads from i18n keys: "level.title_1" ... "level.title_30"
 */
export function getLevelTitle(level: number, tFn?: (key: string) => string): string {
  const clamped = Math.max(1, Math.min(MAX_LEVEL, level));
  if (tFn) return tFn(`level.title_${clamped}`);
  return `L${clamped}`;
}

/**
 * Lifetime threshold for the next level, or null at max.
 */
export function nextLevelAt(level: number): number | null {
  if (level >= MAX_LEVEL) return null;
  return LEVEL_THRESHOLDS[level] ?? null;
}

/**
 * Returns progress towards next level as a fraction in [0, 1].
 * At max level, always returns 1.
 */
export function progressToNextLevel(lifetime: number): {
  level: number;
  currentThreshold: number;
  nextThreshold: number | null;
  fraction: number;
} {
  const level = calculateLevel(lifetime);
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] as number;
  const next = nextLevelAt(level);
  if (next === null) {
    return { level, currentThreshold, nextThreshold: null, fraction: 1 };
  }
  const span = next - currentThreshold;
  const fraction = span <= 0 ? 1 : Math.min(1, Math.max(0, (lifetime - currentThreshold) / span));
  return { level, currentThreshold, nextThreshold: next, fraction };
}
