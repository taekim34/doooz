import { z } from "zod";

export const rewardSchema = z.object({
  id: z.string().uuid(),
  family_id: z.string().uuid(),
  title: z.string().min(1).max(80),
  cost: z.number().int().min(1).max(500_000),
  icon: z.string().max(8).nullable().optional(),
  active: z.boolean(),
});

export const rewardInputSchema = z.object({
  title: z.string().min(1).max(80),
  cost: z.number().int().min(1).max(500_000),
});

export const rewardRequestStatusSchema = z.enum([
  "requested",
  "approved",
  "rejected",
  "cancelled",
]);

export type RewardRequestStatus = z.infer<typeof rewardRequestStatusSchema>;

export interface RewardRequestRow {
  id: string;
  family_id: string;
  reward_id: string;
  requested_by: string;
  reward_title_snapshot: string;
  cost_snapshot: number;
  status: RewardRequestStatus;
  requested_at: string;
  decided_by: string | null;
  decided_at: string | null;
  decision_note: string | null;
  related_transaction_id: string | null;
}

export type Reward = z.infer<typeof rewardSchema>;
