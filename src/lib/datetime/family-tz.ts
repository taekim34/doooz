/**
 * Family-timezone utilities.
 * Every date comparison in dooooz MUST route through these (Invariant I10).
 */
import { formatInTimeZone, toZonedTime } from "date-fns-tz";
import { now as clockNow } from "./clock";

/**
 * Current wall-clock Date in the given IANA timezone.
 * The returned Date is a "zoned" Date whose getFullYear/getMonth/getDate
 * reflect the family's local day.
 */
export function familyNow(timezone: string): Date {
  return toZonedTime(new Date(clockNow()), timezone);
}

/**
 * YYYY-MM-DD string representing the family-local date for an instant.
 * Safe for DB `date` columns and idempotency keys.
 */
export function toFamilyDate(instant: Date | number, timezone: string): string {
  // eslint-disable-next-line no-restricted-syntax
  const d = typeof instant === "number" ? new Date(instant) : instant;
  return formatInTimeZone(d, timezone, "yyyy-MM-dd");
}

/**
 * Today's family-local date as YYYY-MM-DD.
 */
export function familyToday(timezone: string): string {
  return toFamilyDate(clockNow(), timezone);
}

/**
 * Start-of-day Date in the family's timezone (zoned Date at 00:00 local).
 */
export function startOfFamilyDay(instant: Date | number, timezone: string): Date {
  const ymd = toFamilyDate(instant, timezone);
  // Construct a zoned midnight via round-trip through ISO format.
  // eslint-disable-next-line no-restricted-syntax
  return toZonedTime(new Date(`${ymd}T00:00:00Z`), timezone);
}

/**
 * Hour (0-23) of an instant in the family's timezone.
 */
export function familyHour(instant: Date | number, timezone: string): number {
  // eslint-disable-next-line no-restricted-syntax
  const d = typeof instant === "number" ? new Date(instant) : instant;
  return Number(formatInTimeZone(d, timezone, "H"));
}

/**
 * Format a date/instant in the family's timezone using a date-fns pattern.
 * Use this everywhere the UI renders a date/time tied to family-local wall
 * clock (spec v2 #6: local time, not UTC).
 */
export function formatDateInFamilyTz(
  instant: Date | number | string,
  timezone: string,
  pattern: string = "yyyy-MM-dd",
): string {
  // eslint-disable-next-line no-restricted-syntax
  const d =
    typeof instant === "string"
      ? new Date(instant)
      : typeof instant === "number"
        ? new Date(instant)
        : instant;
  return formatInTimeZone(d, timezone, pattern);
}
