import { afterEach, describe, expect, it } from "vitest";
import { computeStreak } from "./streak";
import { resetClock, setClock } from "./datetime/clock";

// Fix "now" at 2026-04-11 15:00 UTC. In Asia/Seoul that's 2026-04-12 00:00+09.
// Use UTC-based anchoring so tests are tz-explicit.
function freeze(isoUtc: string): void {
  // eslint-disable-next-line no-restricted-syntax
  const t = new Date(isoUtc).getTime();
  setClock({ now: () => t });
}

// Helpers to build UTC instants
function utc(y: number, m: number, d: number, h = 12): Date {
  // eslint-disable-next-line no-restricted-syntax
  return new Date(Date.UTC(y, m - 1, d, h));
}

describe("computeStreak", () => {
  afterEach(() => resetClock());

  it("returns 0 for empty history", () => {
    freeze("2026-04-11T03:00:00Z");
    expect(computeStreak([], "UTC")).toBe(0);
  });

  it("returns 1 for a single completion today", () => {
    freeze("2026-04-11T03:00:00Z");
    expect(computeStreak([utc(2026, 4, 11, 2)], "UTC")).toBe(1);
  });

  it("returns 3 for three consecutive days ending today", () => {
    freeze("2026-04-11T03:00:00Z");
    const days = [utc(2026, 4, 9), utc(2026, 4, 10), utc(2026, 4, 11)];
    expect(computeStreak(days, "UTC")).toBe(3);
  });

  it("breaks on a skipped day", () => {
    freeze("2026-04-11T03:00:00Z");
    const days = [utc(2026, 4, 8), utc(2026, 4, 10), utc(2026, 4, 11)];
    expect(computeStreak(days, "UTC")).toBe(2);
  });

  it("collapses duplicate completions on same day", () => {
    freeze("2026-04-11T03:00:00Z");
    const days = [utc(2026, 4, 11, 9), utc(2026, 4, 11, 20)];
    expect(computeStreak(days, "UTC")).toBe(1);
  });

  it("allows today-empty with yesterday counted (in-progress day)", () => {
    freeze("2026-04-11T03:00:00Z");
    const days = [utc(2026, 4, 9), utc(2026, 4, 10)];
    expect(computeStreak(days, "UTC")).toBe(2);
  });

  it("returns 0 if neither today nor yesterday have completions", () => {
    freeze("2026-04-11T03:00:00Z");
    const days = [utc(2026, 4, 8), utc(2026, 4, 7)];
    expect(computeStreak(days, "UTC")).toBe(0);
  });

  it("respects Asia/Seoul timezone boundary", () => {
    // 2026-04-11T15:00Z == 2026-04-12T00:00 Seoul. "Today" in Seoul is Apr 12.
    freeze("2026-04-11T15:00:00Z");
    const days = [
      // Apr 10 Seoul: 2026-04-10T02:00Z (= 11:00 KST)
      // eslint-disable-next-line no-restricted-syntax
      new Date("2026-04-10T02:00:00Z"),
      // Apr 11 Seoul: 2026-04-11T02:00Z
      // eslint-disable-next-line no-restricted-syntax
      new Date("2026-04-11T02:00:00Z"),
    ];
    // Neither has Apr 12 Seoul, but yesterday (Apr 11) does, so streak=2.
    expect(computeStreak(days, "Asia/Seoul")).toBe(2);
  });

  it("counts a 7-day streak", () => {
    freeze("2026-04-11T03:00:00Z");
    const days = [5, 6, 7, 8, 9, 10, 11].map((d) => utc(2026, 4, d));
    expect(computeStreak(days, "UTC")).toBe(7);
  });

  it("only counts the most recent run", () => {
    freeze("2026-04-11T03:00:00Z");
    const days = [
      utc(2026, 4, 1),
      utc(2026, 4, 2), // old run of 2
      utc(2026, 4, 10),
      utc(2026, 4, 11), // current run of 2
    ];
    expect(computeStreak(days, "UTC")).toBe(2);
  });

  it("handles year boundary (2026-01-01 from 2025-12-31)", () => {
    freeze("2026-01-01T12:00:00Z");
    const days = [utc(2025, 12, 30), utc(2025, 12, 31), utc(2026, 1, 1)];
    expect(computeStreak(days, "UTC")).toBe(3);
  });
});
