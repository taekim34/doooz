import { describe, expect, it } from "vitest";
import { createFamilyInputSchema, joinFamilyInputSchema, familySchema } from "./family";
import { createUserInputSchema, userSchema, userRoleSchema } from "./user";
import {
  choreTemplateInputSchema,
  choreInstanceSchema,
  recurrenceSchema,
  choreStatusSchema,
} from "./chore";
import { redeemInputSchema, pointTransactionSchema, pointKindSchema } from "./point";
import { rewardInputSchema, rewardSchema } from "./reward";
import { badgeSchema, badgeRuleTypeSchema } from "./badge";

const UUID = "00000000-0000-4000-8000-000000000001";
const UUID2 = "00000000-0000-4000-8000-000000000002";

describe("family schemas", () => {
  it("accepts a valid createFamilyInput", () => {
    const res = createFamilyInputSchema.parse({ name: "Kim", timezone: "Asia/Seoul" });
    expect(res.timezone).toBe("Asia/Seoul");
  });

  it("applies default timezone", () => {
    const res = createFamilyInputSchema.parse({ name: "Kim" });
    expect(res.timezone).toBe("Asia/Seoul");
  });

  it("rejects empty family name", () => {
    expect(createFamilyInputSchema.safeParse({ name: "" }).success).toBe(false);
  });

  it("rejects over-length family name", () => {
    expect(createFamilyInputSchema.safeParse({ name: "x".repeat(41) }).success).toBe(false);
  });

  it("joinFamilyInput requires invite_code (1-20 chars)", () => {
    expect(joinFamilyInputSchema.safeParse({ invite_code: "", display_name: "A" }).success).toBe(false);
    expect(joinFamilyInputSchema.safeParse({ invite_code: "ABCD", display_name: "A" }).success).toBe(true);
    expect(joinFamilyInputSchema.safeParse({ invite_code: "우리가족", display_name: "A" }).success).toBe(true);
  });

  it("familySchema accepts a valid row", () => {
    expect(
      familySchema.safeParse({
        id: UUID,
        name: "Kim",
        invite_code: "ABCD1234",
        timezone: "Asia/Seoul",
      }).success,
    ).toBe(true);
  });
});

describe("user schemas", () => {
  it("userRoleSchema accepts parent/child only", () => {
    expect(userRoleSchema.safeParse("parent").success).toBe(true);
    expect(userRoleSchema.safeParse("child").success).toBe(true);
    expect(userRoleSchema.safeParse("admin").success).toBe(false);
  });

  it("createUserInputSchema valid", () => {
    const ok = createUserInputSchema.parse({ role: "child", display_name: "Sam" });
    expect(ok.display_name).toBe("Sam");
  });

  it("createUserInputSchema rejects empty display_name", () => {
    expect(createUserInputSchema.safeParse({ role: "child", display_name: "" }).success).toBe(false);
  });

  it("userSchema rejects negative lifetime_earned", () => {
    expect(
      userSchema.safeParse({
        id: UUID,
        family_id: UUID2,
        role: "child",
        display_name: "Sam",
        current_balance: 0,
        lifetime_earned: -1,
        level: 1,
      }).success,
    ).toBe(false);
  });

  it("userSchema rejects level > 30", () => {
    expect(
      userSchema.safeParse({
        id: UUID,
        family_id: UUID2,
        role: "child",
        display_name: "Sam",
        current_balance: 0,
        lifetime_earned: 0,
        level: 31,
      }).success,
    ).toBe(false);
  });
});

describe("chore schemas (v2)", () => {
  const base = {
    assignee_id: UUID,
    title: "Dishes",
    points: 100,
    recurrence: { kind: "weekly" as const, days: [1, 3, 5] },
    start_date: "2026-04-11",
  };

  it("accepts a valid weekly template input", () => {
    expect(choreTemplateInputSchema.safeParse(base).success).toBe(true);
  });

  it("accepts a valid once template input", () => {
    expect(
      choreTemplateInputSchema.safeParse({
        ...base,
        recurrence: { kind: "once", due_date: "2026-04-20" },
      }).success,
    ).toBe(true);
  });

  it("rejects points < 1", () => {
    expect(choreTemplateInputSchema.safeParse({ ...base, points: 0 }).success).toBe(false);
  });

  it("accepts points up to 10000", () => {
    expect(choreTemplateInputSchema.safeParse({ ...base, points: 10000 }).success).toBe(true);
  });

  it("rejects points > 10000", () => {
    expect(choreTemplateInputSchema.safeParse({ ...base, points: 10001 }).success).toBe(false);
  });

  it("rejects empty title", () => {
    expect(choreTemplateInputSchema.safeParse({ ...base, title: "" }).success).toBe(false);
  });

  it("rejects over-length title", () => {
    expect(choreTemplateInputSchema.safeParse({ ...base, title: "x".repeat(81) }).success).toBe(false);
  });

  it("rejects end_date before start_date", () => {
    const r = choreTemplateInputSchema.safeParse({
      ...base,
      start_date: "2026-04-11",
      end_date: "2026-04-10",
    });
    expect(r.success).toBe(false);
  });

  it("accepts end_date == start_date", () => {
    const r = choreTemplateInputSchema.safeParse({
      ...base,
      end_date: "2026-04-11",
    });
    expect(r.success).toBe(true);
  });

  it("recurrence weekly requires at least one day", () => {
    expect(
      choreTemplateInputSchema.safeParse({
        ...base,
        recurrence: { kind: "weekly", days: [] },
      }).success,
    ).toBe(false);
  });

  it("recurrence discriminated union accepts once and weekly shapes", () => {
    expect(
      recurrenceSchema.safeParse({ kind: "weekly", days: [0, 6] }).success,
    ).toBe(true);
    expect(
      recurrenceSchema.safeParse({ kind: "once", due_date: "2026-04-11" }).success,
    ).toBe(true);
  });

  it("recurrence rejects invalid day", () => {
    expect(
      recurrenceSchema.safeParse({ kind: "weekly", days: [7] }).success,
    ).toBe(false);
  });

  it("recurrence rejects bad due_date format", () => {
    expect(
      recurrenceSchema.safeParse({ kind: "once", due_date: "2026/04/11" }).success,
    ).toBe(false);
  });

  it("choreStatus includes pardoned + overdue", () => {
    expect(choreStatusSchema.safeParse("pending").success).toBe(true);
    expect(choreStatusSchema.safeParse("pardoned").success).toBe(true);
    expect(choreStatusSchema.safeParse("overdue").success).toBe(true);
    expect(choreStatusSchema.safeParse("done").success).toBe(false);
  });

  it("choreInstanceSchema validates full row", () => {
    expect(
      choreInstanceSchema.safeParse({
        id: UUID,
        family_id: UUID2,
        template_id: null,
        assignee_id: UUID,
        title: "x",
        points: 100,
        due_date: "2026-04-11",
        status: "pending",
      }).success,
    ).toBe(true);
  });
});

describe("point schemas", () => {
  it("pointKind accepts 5 enums", () => {
    expect(pointKindSchema.safeParse("chore_reward").success).toBe(true);
    expect(pointKindSchema.safeParse("redemption").success).toBe(true);
    expect(pointKindSchema.safeParse("adjustment").success).toBe(true);
    expect(pointKindSchema.safeParse("bonus").success).toBe(true);
    expect(pointKindSchema.safeParse("penalty").success).toBe(true);
    expect(pointKindSchema.safeParse("refund").success).toBe(false);
  });

  it("redeemInput rejects negative amount", () => {
    expect(
      redeemInputSchema.safeParse({ user_id: UUID, amount: -1, reason: "x" }).success,
    ).toBe(false);
  });

  it("redeemInput rejects zero amount", () => {
    expect(
      redeemInputSchema.safeParse({ user_id: UUID, amount: 0, reason: "x" }).success,
    ).toBe(false);
  });

  it("redeemInput rejects amount above cap", () => {
    expect(
      redeemInputSchema.safeParse({ user_id: UUID, amount: 1_000_001, reason: "x" }).success,
    ).toBe(false);
  });

  it("redeemInput rejects empty reason", () => {
    expect(
      redeemInputSchema.safeParse({ user_id: UUID, amount: 10, reason: "" }).success,
    ).toBe(false);
  });

  it("redeemInput accepts valid input", () => {
    expect(
      redeemInputSchema.safeParse({ user_id: UUID, amount: 100, reason: "ice cream" }).success,
    ).toBe(true);
  });

  it("pointTransactionSchema accepts negative amount (redemption)", () => {
    expect(
      pointTransactionSchema.safeParse({
        id: UUID,
        family_id: UUID2,
        user_id: UUID,
        amount: -50,
        kind: "redemption",
        reason: "toy",
        actor_id: UUID2,
      }).success,
    ).toBe(true);
  });
});

describe("reward schemas", () => {
  it("accepts valid input", () => {
    expect(rewardInputSchema.safeParse({ title: "Ice cream", cost: 50 }).success).toBe(true);
  });

  it("rejects cost < 1", () => {
    expect(rewardInputSchema.safeParse({ title: "x", cost: 0 }).success).toBe(false);
  });

  it("rejects cost > 500k", () => {
    expect(rewardInputSchema.safeParse({ title: "x", cost: 500_001 }).success).toBe(false);
  });

  it("rejects empty title", () => {
    expect(rewardInputSchema.safeParse({ title: "", cost: 10 }).success).toBe(false);
  });

  it("rewardSchema accepts full row", () => {
    expect(
      rewardSchema.safeParse({
        id: UUID,
        family_id: UUID2,
        title: "toy",
        cost: 100,
        icon: "🎁",
        active: true,
      }).success,
    ).toBe(true);
  });
});

describe("badge schemas", () => {
  it("badgeRuleType enforces enum", () => {
    expect(badgeRuleTypeSchema.safeParse("streak").success).toBe(true);
    expect(badgeRuleTypeSchema.safeParse("bogus").success).toBe(false);
  });

  it("badgeSchema rejects negative rule_value", () => {
    expect(
      badgeSchema.safeParse({
        id: "x",
        name: "x",
        rule_type: "streak",
        rule_value: -1,
      }).success,
    ).toBe(false);
  });

  it("badgeSchema accepts minimal row", () => {
    expect(
      badgeSchema.safeParse({
        id: "first_step",
        name: "First Step",
        rule_type: "total_count",
        rule_value: 1,
      }).success,
    ).toBe(true);
  });
});
