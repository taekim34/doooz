import { describe, expect, it } from "vitest";
import {
  calculateLevel,
  getStage,
  getStageTitle,
  levelThreshold,
  nextLevelAt,
  progressToNextLevel,
} from "./level";

describe("calculateLevel — table region (L1-L9)", () => {
  it("returns 1 for 0 / negative / NaN lifetime", () => {
    expect(calculateLevel(0)).toBe(1);
    expect(calculateLevel(-1)).toBe(1);
    expect(calculateLevel(Number.NaN)).toBe(1);
  });
  it("L2 boundary at 150", () => {
    expect(calculateLevel(149)).toBe(1);
    expect(calculateLevel(150)).toBe(2);
  });
  it("L9 boundary at 10000", () => {
    expect(calculateLevel(9_999)).toBe(8);
    expect(calculateLevel(10_000)).toBe(9);
  });
});

describe("calculateLevel — linear region (L10+, delta 5000)", () => {
  it("L10 at 15000", () => {
    expect(calculateLevel(14_999)).toBe(9);
    expect(calculateLevel(15_000)).toBe(10);
  });
  it("L11 at 20000", () => {
    expect(calculateLevel(20_000)).toBe(11);
  });
  it("L30 at 115000", () => {
    expect(calculateLevel(114_999)).toBe(29);
    expect(calculateLevel(115_000)).toBe(30);
  });
  it("unbounded — L207 at 1_000_000", () => {
    expect(calculateLevel(1_000_000)).toBe(207);
  });
  it("L1000 at 4_960_000", () => {
    expect(calculateLevel(10_000 + 991 * 5_000)).toBe(1000);
  });
});

describe("levelThreshold + nextLevelAt", () => {
  it("levelThreshold matches expected values", () => {
    expect(levelThreshold(1)).toBe(0);
    expect(levelThreshold(9)).toBe(10_000);
    expect(levelThreshold(10)).toBe(15_000);
    expect(levelThreshold(11)).toBe(20_000);
    expect(levelThreshold(30)).toBe(115_000);
  });
  it("nextLevelAt is always defined (unbounded)", () => {
    expect(nextLevelAt(1)).toBe(150);
    expect(nextLevelAt(9)).toBe(15_000);
    expect(nextLevelAt(207)).toBe(1_005_000);
  });
});

describe("getStage — new boundaries (1:1-6, 2:7-12, 3:13-24, 4:25-49, 5:50+)", () => {
  it("stage 1 for L1-L6", () => {
    expect(getStage(1)).toBe(1);
    expect(getStage(6)).toBe(1);
  });
  it("stage 2 for L7-L12", () => {
    expect(getStage(7)).toBe(2);
    expect(getStage(12)).toBe(2);
  });
  it("stage 3 for L13-L24", () => {
    expect(getStage(13)).toBe(3);
    expect(getStage(24)).toBe(3);
  });
  it("stage 4 for L25-L49", () => {
    expect(getStage(25)).toBe(4);
    expect(getStage(49)).toBe(4);
  });
  it("stage 5 from L50 onwards (unbounded)", () => {
    expect(getStage(50)).toBe(5);
    expect(getStage(1000)).toBe(5);
  });
});

describe("getStageTitle", () => {
  it("returns fallback without tFn", () => {
    expect(getStageTitle(1)).toBe("Stage 1");
    expect(getStageTitle(5)).toBe("Stage 5");
  });
  it("uses tFn when supplied", () => {
    const t = (k: string) => `T(${k})`;
    expect(getStageTitle(2, t)).toBe("T(characters.stage_rookie)");
  });
});

describe("progressToNextLevel", () => {
  it("at lifetime 0", () => {
    const p = progressToNextLevel(0);
    expect(p.level).toBe(1);
    expect(p.fraction).toBe(0);
    expect(p.nextThreshold).toBe(150);
  });
  it("midpoint between L10 and L11", () => {
    const p = progressToNextLevel(17_500);
    expect(p.level).toBe(10);
    expect(p.currentThreshold).toBe(15_000);
    expect(p.nextThreshold).toBe(20_000);
    expect(p.fraction).toBeCloseTo(0.5, 5);
  });
  it("just past linear anchor", () => {
    const p = progressToNextLevel(10_000);
    expect(p.level).toBe(9);
    expect(p.nextThreshold).toBe(15_000);
    expect(p.fraction).toBe(0);
  });
});
