import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { pushToParents } from "@/lib/push/send";
import { t, type Locale } from "@/lib/i18n";
import { apiError } from "@/lib/api-error";

/**
 * POST /api/tasks/beg/[id]/cancel
 * Child cancels their own pending beg request.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return apiError(401, "unauthorized");

  const { data: instance } = await supabase
    .from("task_instances")
    .select("id, assignee_id, status, title, family_id")
    .eq("id", id)
    .single();
  if (!instance) return apiError(404, "not found");

  if (instance.assignee_id !== authUser.id) {
    return apiError(403, "forbidden");
  }
  if (instance.status !== "requested") {
    return apiError(400, "invalid request state");
  }

  // Get child name and family locale before deleting
  const { data: child } = await supabase.from("users").select("display_name").eq("id", authUser.id).single();
  const name = child?.display_name ?? "";
  const { data: famRow } = await supabase.from("families").select("locale").eq("id", instance.family_id).single();
  const locale = (famRow?.locale || "ko") as Locale;

  await supabase.from("task_instances").delete().eq("id", id);

  // Notify parents
  try {
    await pushToParents(instance.family_id, {
      title: t("push.beg_cancel_title", locale),
      body: t("push.beg_cancel_body", locale).replace("{name}", name).replace("{title}", instance.title),
      url: "/tasks",
    });
  } catch (e) {
    console.error("[PUSH] beg cancel push failed:", e);
  }

  return NextResponse.json({ ok: true });
}
