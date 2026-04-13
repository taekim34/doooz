import { z } from "zod";

export const userRoleSchema = z.enum(["parent", "child"]);

export const userSchema = z.object({
  id: z.string().uuid(),
  family_id: z.string().uuid(),
  role: userRoleSchema,
  display_name: z.string().min(1).max(40),
  birth_date: z.string().date().nullable().optional(),
  character_id: z.string().nullable().optional(),
  current_balance: z.number().int(),
  lifetime_earned: z.number().int().nonnegative(),
  level: z.number().int().min(1).max(30),
});

export const createUserInputSchema = z.object({
  role: userRoleSchema,
  display_name: z.string().min(1).max(40),
  birth_date: z.string().date().optional(),
  character_id: z.string().optional(),
});

export type UserRole = z.infer<typeof userRoleSchema>;
export type User = z.infer<typeof userSchema>;
