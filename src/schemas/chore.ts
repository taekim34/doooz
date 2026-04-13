import { z } from "zod";

/**
 * Chore recurrence (v2 #5): stored as jsonb in chore_templates.recurrence.
 * Shape A — one-off deadline task:
 *   { kind: 'once', due_date: 'YYYY-MM-DD' }
 * Shape B — repeating weekly:
 *   { kind: 'weekly', days: number[] }  // 0=Sun..6=Sat
 */
export const weeklyRecurrenceSchema = z.object({
  kind: z.literal("weekly"),
  days: z.array(z.number().int().min(0).max(6)),
});

export const onceRecurrenceSchema = z.object({
  kind: z.literal("once"),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const recurrenceSchema = z.discriminatedUnion("kind", [
  weeklyRecurrenceSchema,
  onceRecurrenceSchema,
]);

export type WeeklyRecurrence = z.infer<typeof weeklyRecurrenceSchema>;
export type OnceRecurrence = z.infer<typeof onceRecurrenceSchema>;
export type Recurrence = z.infer<typeof recurrenceSchema>;

/**
 * Point caps raised to 10000 (v2 #1).
 */
export const pointsSchema = z.number().int().min(1).max(10000);

export const choreTemplateInputSchema = z
  .object({
    assignee_id: z.string().uuid(),
    title: z.string().min(1).max(80),
    description: z.string().max(400).optional(),
    points: pointsSchema,
    recurrence: recurrenceSchema,
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    end_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .nullable()
      .optional(),
  })
  .refine(
    (v) => !v.end_date || v.end_date >= v.start_date,
    { message: "end_date must be on or after start_date", path: ["end_date"] },
  )
  .refine(
    (v) => v.recurrence.kind !== "weekly" || v.recurrence.days.length > 0,
    { message: "반복할 요일을 최소 하나 선택해 주세요", path: ["recurrence"] },
  );

export const choreStatusSchema = z.enum([
  "pending",
  "completed",
  "skipped",
  "pardoned",
  "overdue",
  "requested",
  "rejected",
]);

export const choreInstanceSchema = z.object({
  id: z.string().uuid(),
  family_id: z.string().uuid(),
  template_id: z.string().uuid().nullable(),
  assignee_id: z.string().uuid(),
  title: z.string(),
  points: z.number().int().min(0).max(10000),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: choreStatusSchema,
});

export type ChoreStatus = z.infer<typeof choreStatusSchema>;
