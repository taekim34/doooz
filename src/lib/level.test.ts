import { describe, expect, it } from "vitest";
import {
  LEVEL_THRESHOLDS,
  LEVEL_TITLES,
  MAX_LEVEL,
  calculateLevel,
  getLevelTitle,
  getStage,
  nextLevelAt,
  progressToNextLevel,
} from "./level";

describe("calculateLevel (30 levels)", () => {
  it("returns 1 for 0 lifetime", () => {
    expect(calculateLevel(0)).toBe(1);
  });

  it("returns 1 for negative or NaN", () => {
    expect(calculateLevel(-1)).toBe(1);
    expect(calculateLevel(Number.NaN)).toBe(1);
  });

  it("L2 at 150", () => {
    expect(calculateLevel(149)).toBe(1);
    expect(calculateLevel(150)).toBe(2);
  });

  it("L5 at 1500", () => {
    expect(calculateLevel(1_499)).toBe(4);
    expect(calculateLevel(1_500)).toBe(5);
  });

  it("L30 at 1000000", () => {
    expect(calculateLevel(1_000_000)).toBe(30);
  });

  it("above max stays at 30", () => {
    expect(calculateLevel(10_000_000)).toBe(30);
  });

  it("MAX_LEVEL matches thresholds length", () => {
    expect(MAX_LEVEL).toBe(30);
    expect(LEVEL_THRESHOLDS.length).toBe(30);
    expect(LEVEL_TITLES.length).toBe(0); // deprecated, titles moved to i18n
  });
});

describe("getStage", () => {
  it("stage 1 for L1-L6", () => {
    expect(getStage(1)).toBe(1);
    expect(getStage(6)).toBe(1);
  });
  it("stage 2 at L7-L12", () => {
    expect(getStage(7)).toBe(2);
    expect(getStage(12)).toBe(2);
  });
  it("stage 5 at L25-L30", () => {
    expect(getStage(25)).toBe(5);
    expect(getStage(30)).toBe(5);
  });
});

describe("getLevelTitle", () => {
  it("returns fallback without tFn", () => {
    expect(getLevelTitle(1)).toBe("L1");
    expect(getLevelTitle(30)).toBe("L30");
  });
});

describe("nextLevelAt / progressToNextLevel", () => {
  it("nextLevelAt(1) = 150", () => {
    expect(nextLevelAt(1)).toBe(150);
  });
  it("nextLevelAt(30) = null", () => {
    expect(nextLevelAt(30)).toBeNull();
  });
  it("progressToNextLevel at 0", () => {
    const p = progressToNextLevel(0);
    expect(p.level).toBe(1);
    expect(p.fraction).toBe(0);
    expect(p.nextThreshold).toBe(150);
  });
  it("progressToNextLevel at max level returns 1", () => {
    const p = progressToNextLevel(1_100_000);
    expect(p.level).toBe(30);
    expect(p.fraction).toBe(1);
  });
});
