/**
 * Level calculator
 * Thresholds from spec v2 §1 #2 (x5 inflation, 30 levels).
 * Keep in sync with any SQL `calculate_level` if present.
 */

export const LEVEL_THRESHOLDS: readonly number[] = [
  0,         // L1
  150,       // L2
  400,       // L3
  800,       // L4
  1_500,     // L5
  2_500,     // L6
  4_500,     // L7
  7_000,     // L8
  10_000,    // L9
  15_000,    // L10
  22_000,    // L11
  32_000,    // L12
  45_000,    // L13
  60_000,    // L14
  80_000,    // L15
  100_000,   // L16
  130_000,   // L17
  160_000,   // L18
  190_000,   // L19
  220_000,   // L20
  280_000,   // L21
  340_000,   // L22
  400_000,   // L23
  470_000,   // L24
  540_000,   // L25
  620_000,   // L26
  700_000,   // L27
  800_000,   // L28
  900_000,   // L29
  1_000_000, // L30
] as const;

/** @deprecated Use getLevelTitle(level, locale) with i18n keys instead */
export const LEVEL_TITLES: readonly string[] = [] as const;

export const MAX_LEVEL = LEVEL_THRESHOLDS.length;

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
