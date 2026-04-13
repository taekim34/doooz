/**
 * Streak computation: consecutive family-local days (ending today)
 * on which the user completed at least one task.
 */
import { toFamilyDate, familyToday } from "./datetime/family-tz";

/**
 * @param completionInstants Dates at which tasks were completed (UTC instants ok).
 * @param timezone IANA timezone of the family.
 * @returns consecutive-day streak count ending today (or today-1 if today has no completions yet).
 *   Spec choice: a streak is NOT broken by a dayless today — we count the most recent
 *   uninterrupted run of days ending at `today` OR `today - 1`.
 */
export function computeStreak(
  completionInstants: ReadonlyArray<Date | number>,
  timezone: string,
): number {
  if (completionInstants.length === 0) return 0;

  const days = new Set<string>();
  for (const inst of completionInstants) {
    days.add(toFamilyDate(inst, timezone));
  }

  const today = familyToday(timezone);
  let cursor = today;
  // If today has no completion, allow starting from yesterday so an in-progress day
  // does not immediately zero the streak.
  if (!days.has(cursor)) {
    cursor = addDays(cursor, -1);
    if (!days.has(cursor)) return 0;
  }

  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/**
 * Add days to a YYYY-MM-DD string without touching timezones.
 * Operates in UTC (date arithmetic only) — safe because inputs are calendar dates.
 */
function addDays(ymd: string, delta: number): string {
  const [y, m, d] = ymd.split("-").map(Number) as [number, number, number];
  // eslint-disable-next-line no-restricted-syntax
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + delta);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}
