import { z } from "zod";

export const familySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(40),
  invite_code: z.string().min(4).max(20),
  timezone: z.string().min(1),
});

export const createFamilyInputSchema = z.object({
  name: z.string().min(1).max(40),
  invite_code: z.string().min(4).max(20).optional(),
  timezone: z.string().min(1).default("Asia/Seoul"),
});

export const joinFamilyInputSchema = z.object({
  invite_code: z.string().min(1).max(20),
  display_name: z.string().min(1).max(40),
});

export type Family = z.infer<typeof familySchema>;
