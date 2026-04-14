import { z } from "zod";

export const pointKindSchema = z.enum([
  "task_reward",
  "redemption",
  "adjustment",
  "bonus",
  "penalty",
]);

export const pointTransactionSchema = z.object({
  id: z.string().uuid(),
  family_id: z.string().uuid(),
  user_id: z.string().uuid(),
  amount: z.number().int(),
  kind: pointKindSchema,
  reason: z.string().min(1).max(200),
  related_task_id: z.string().uuid().nullable().optional(),
  actor_id: z.string().uuid().nullable(),
});

export const redeemInputSchema = z.object({
  user_id: z.string().uuid(),
  amount: z.number().int().positive().max(1_000_000),
  reason: z.string().min(1).max(200),
  reward_id: z.string().uuid().optional(),
});

export type PointKind = z.infer<typeof pointKindSchema>;
