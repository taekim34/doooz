import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { pushToChild } from "@/lib/push/send";
import { t, type Locale } from "@/lib/i18n";
import { apiError } from "@/lib/api-error";

/**
 * POST /api/tasks/beg/[id]/reject
 * Parent rejects a beg request.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return apiError(401, "unauthorized");

  const { data: me } = await supabase
    .from("users")
    .select("id, family_id, role")
    .eq("id", authUser.id)
    .single();
  if (!me || me.role !== "parent") {
    return apiError(403, "forbidden");
  }

  const { data: instance } = await supabase
    .from("task_instances")
    .select("id, family_id, status, assignee_id, title")
    .eq("id", id)
    .single();
  if (!instance) return apiError(404, "not found");

  // Get family locale
  const { data: famRow } = await supabase.from("families").select("locale").eq("id", me.family_id).single();
  const locale = (famRow?.locale || "ko") as Locale;

  if (instance.family_id !== me.family_id) {
    return apiError(403, "forbidden");
  }
  if (instance.status !== "requested") {
    return apiError(400, "invalid request state");
  }

  await supabase
    .from("task_instances")
    .update({ status: "rejected" })
    .eq("id", id);

  // Push to child
  try {
    await pushToChild(instance.assignee_id, {
      title: t("push.beg_reject_title", locale),
      body: t("push.beg_reject_body", locale).replace("{title}", instance.title),
      url: "/tasks",
    });
  } catch (e) {
    console.error("[PUSH] beg reject push failed:", e);
  }

  return NextResponse.json({ ok: true });
}
