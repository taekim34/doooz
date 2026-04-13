"use server";

/**
 * Server actions for task templates + instance pardon.
 *
 * v2 changes:
 * - Points cap raised to 10000 (#1).
 * - Recurrence is now a jsonb discriminated union (#5).
 * - Assignees must be children (#7) — validated server-side in addition to
 *   the DB trigger.
 * - pardonTask — parent-only action that calls the pardon_task RPC (#4).
 */

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { recurrenceSchema, pointsSchema } from "@/schemas/task";

// All fields optional except id. Mirrors the createable columns on
// task_templates so we never accept an unknown field via FormData.
const updateTaskTemplateSchema = z
  .object({
    id: z.string().uuid(),
    title: z.string().min(1).max(80).optional(),
    description: z.string().max(400).nullable().optional(),
    points: pointsSchema.optional(),
    recurrence: recurrenceSchema.optional(),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    end_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .nullable()
      .optional(),
    assignee_id: z.string().uuid().optional(),
    active: z.boolean().optional(),
  })
  .refine(
    (v) =>
      !v.end_date || !v.start_date || v.end_date >= v.start_date,
    { message: "end_date must be on or after start_date", path: ["end_date"] },
  );

function strOrUndef(v: FormDataEntryValue | null): string | undefined {
  if (v == null) return undefined;
  const s = String(v);
  return s === "" ? undefined : s;
}

function strOrNull(v: FormDataEntryValue | null): string | null | undefined {
  if (v == null) return undefined;
  const s = String(v);
  return s === "" ? null : s;
}

function parseRecurrenceFromFormData(
  formData: FormData,
): z.infer<typeof recurrenceSchema> | undefined {
  // Preferred: a JSON string under `recurrence`. The manage form sends this.
  const raw = strOrUndef(formData.get("recurrence"));
  if (!raw) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

export async function updateTaskTemplate(formData: FormData): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  const { data: me } = await supabase
    .from("users")
    .select("family_id, role")
    .eq("id", authUser.id)
    .single();

  if (!me || me.role !== "parent") redirect("/tasks");

  const rawPoints = formData.get("points");
  const raw = {
    id: String(formData.get("id") || ""),
    title: strOrUndef(formData.get("title")),
    points: rawPoints == null || rawPoints === "" ? undefined : Number(rawPoints),
    recurrence: parseRecurrenceFromFormData(formData),
    start_date: strOrUndef(formData.get("start_date")),
    end_date: strOrNull(formData.get("end_date")),
    assignee_id: strOrUndef(formData.get("assignee_id")),
    active:
      formData.get("active") == null ? undefined : formData.get("active") === "on",
  };

  const parsed = updateTaskTemplateSchema.safeParse(raw);
  if (!parsed.success) {
    redirect("/tasks/manage?error=validation");
  }

  const { id, assignee_id, ...patch } = parsed.data;

  // Defensive: assignee must be a child in our family.
  if (assignee_id) {
    const { data: target } = await supabase
      .from("users")
      .select("id, family_id, role")
      .eq("id", assignee_id)
      .single();
    if (!target || target.family_id !== me.family_id || target.role !== "child") {
      redirect("/tasks/manage?error=assignee_must_be_child");
    }
  }

  const updatePayload = {
    ...patch,
    ...(assignee_id ? { assignee_id } : {}),
  };
  await supabase
    .from("task_templates")
    .update(updatePayload)
    .eq("id", id)
    .eq("family_id", me.family_id);

  revalidatePath("/tasks/manage");
}

/**
 * Parent-only: pardon a task instance. Delegates to the pardon_task RPC
 * which flips the instance status and (if previously `overdue`) inserts a
 * compensating adjustment row to reverse the penalty.
 */
export async function pardonTask(instanceId: string): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  const { data: me } = await supabase
    .from("users")
    .select("role")
    .eq("id", authUser.id)
    .single();
  if (!me || me.role !== "parent") redirect("/tasks");

  await supabase.rpc("pardon_task", {
    p_instance_id: instanceId,
  });

  revalidatePath("/tasks");
  revalidatePath("/tasks/manage");
}
