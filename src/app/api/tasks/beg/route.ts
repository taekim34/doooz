import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiError } from "@/lib/api-error";
import { familyToday } from "@/lib/datetime/family-tz";
import { pushToParents } from "@/lib/push/send";
import { t, type Locale } from "@/lib/i18n";

/**
 * POST /api/tasks/beg
 * Child requests recognition for something they did today (beg feature).
 * Creates a task_instance with status='requested', points=0.
 */
export async function POST(req: Request) {
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
  if (!me) return apiError(404, "not found");

  if (me.role !== "child") {
    return apiError(403, "forbidden");
  }

  const body = await req.json();
  const title = String(body.title || "").trim();
  if (!title) return apiError(400, "title required");

  // Get family timezone for today's date
  const { data: fam } = await supabase
    .from("families")
    .select("timezone, locale")
    .eq("id", me.family_id)
    .single();
  const today = familyToday(fam?.timezone ?? "Asia/Seoul");
  const locale = (fam?.locale || "ko") as Locale;

  const { data, error } = await supabase
    .from("task_instances")
    .insert({
      family_id: me.family_id,
      assignee_id: me.id,
      title,
      points: 0,
      due_date: today,
      status: "requested",
      template_id: null,
    })
    .select("id")
    .single();

  if (error) return apiError(500, "operation failed");

  // Push to parents
  const { data: child } = await supabase.from("users").select("display_name").eq("id", me.id).single();
  const name = child?.display_name ?? "";
  try {
    await pushToParents(me.family_id, {
      title: t("push.beg_request_title", locale),
      body: t("push.beg_request_body", locale).replace("{name}", name).replace("{title}", title),
      url: "/tasks",
    });
  } catch (e) {
    console.error("[PUSH] beg request push failed:", e);
  }

  return NextResponse.json({ id: data!.id });
}
