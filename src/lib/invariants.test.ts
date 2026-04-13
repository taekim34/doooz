import { describe, expect, it } from "vitest";
import { INVARIANTS, assertBalanceMatchesLedger } from "./invariants";

describe("INVARIANTS constant", () => {
  it("contains I1 through I10", () => {
    const keys = Object.keys(INVARIANTS);
    expect(keys).toHaveLength(10);
    for (let i = 1; i <= 10; i++) {
      expect(keys).toContain(`I${i}`);
    }
  });

  it("each invariant has a non-empty description", () => {
    for (const [k, v] of Object.entries(INVARIANTS)) {
      expect(v, k).toBeTruthy();
      expect(v.length, k).toBeGreaterThan(10);
    }
  });
});

describe("assertBalanceMatchesLedger", () => {
  it("passes on empty ledger + zero cache", () => {
    expect(() => assertBalanceMatchesLedger({ current_balance: 0, lifetime_earned: 0 }, [])).not.toThrow();
  });

  it("passes on a single task_reward credit", () => {
    expect(() =>
      assertBalanceMatchesLedger(
        { current_balance: 10, lifetime_earned: 10 },
        [{ amount: 10, kind: "task_reward" }],
      ),
    ).not.toThrow();
  });

  it("passes when redemption reduces balance but not lifetime", () => {
    expect(() =>
      assertBalanceMatchesLedger(
        { current_balance: 50, lifetime_earned: 100 },
        [
          { amount: 100, kind: "task_reward" },
          { amount: -50, kind: "redemption" },
        ],
      ),
    ).not.toThrow();
  });

  it("passes on mixed 100-tx sequence", () => {
    const txs: { amount: number; kind: "task_reward" | "redemption" | "bonus" | "penalty" | "adjustment" }[] = [];
    let balance = 0;
    let lifetime = 0;
    for (let i = 0; i < 100; i++) {
      if (i % 5 === 0 && balance >= 30) {
        txs.push({ amount: -30, kind: "redemption" });
        balance -= 30;
      } else if (i % 7 === 0) {
        txs.push({ amount: 50, kind: "bonus" });
        balance += 50;
        lifetime += 50;
      } else {
        txs.push({ amount: 10, kind: "task_reward" });
        balance += 10;
        lifetime += 10;
      }
    }
    expect(() =>
      assertBalanceMatchesLedger({ current_balance: balance, lifetime_earned: lifetime }, txs),
    ).not.toThrow();
  });

  it("throws I1 when current_balance out of sync", () => {
    expect(() =>
      assertBalanceMatchesLedger(
        { current_balance: 99, lifetime_earned: 10 },
        [{ amount: 10, kind: "task_reward" }],
      ),
    ).toThrow(/I1/);
  });

  it("throws I2 when redemption wrongly counted toward lifetime", () => {
    expect(() =>
      assertBalanceMatchesLedger(
        { current_balance: 50, lifetime_earned: 150 },
        [
          { amount: 100, kind: "task_reward" },
          { amount: -50, kind: "redemption" },
        ],
      ),
    ).toThrow(/I2/);
  });

  it("throws I2 when adjustment credit wrongly included in lifetime", () => {
    // adjustment credits do NOT count toward lifetime_earned per spec
    expect(() =>
      assertBalanceMatchesLedger(
        { current_balance: 10, lifetime_earned: 10 },
        [{ amount: 10, kind: "adjustment" }],
      ),
    ).toThrow(/I2/);
  });

  it("allows negative balance (I3 relaxed for penalties)", () => {
    expect(() =>
      assertBalanceMatchesLedger(
        { current_balance: -50, lifetime_earned: 0 },
        [{ amount: -50, kind: "penalty" }],
      ),
    ).not.toThrow();
  });
});
