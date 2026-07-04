import { z } from "zod";

export const badgeRuleTypeSchema = z.enum([
  "total_count",
  "streak",
  "lifetime_points",
  "redemption",
  "anniversary",
  "perfect_day",
  "perfect_week",
  "time_condition",
  "hard_worker",
]);

export const badgeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  rule_type: badgeRuleTypeSchema,
  rule_value: z.number().int().nonnegative(),
});

export type BadgeRuleType = z.infer<typeof badgeRuleTypeSchema>;
export type Badge = z.infer<typeof badgeSchema>;
