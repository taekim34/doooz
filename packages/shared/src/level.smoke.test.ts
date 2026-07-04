import { describe, it, expect } from "vitest";
import * as level from "@dooooz/shared/level";

describe("@dooooz/shared/level is consumable", () => {
  it("exports something", () => {
    expect(Object.keys(level).length).toBeGreaterThan(0);
  });
});
