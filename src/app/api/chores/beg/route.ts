import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { familyToday } from "@/lib/datetime/family-tz";
import { pushToParents } from "@/lib/push/send";
import { t, type Locale } from "@/lib/i18n";

/**
 * POST /api/chores/beg
 * Child requests recognition for something they did today (beg feature).
 * Creates a chore_instance with status='requested', points=0.
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: me } = await supabase
    .from("users")
    .select("id, family_id, role")
    .eq("id", authUser.id)
    .single();
  if (!me) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const user = me as { id: string; family_id: string; role: string };
  if (user.role !== "child") {
    return NextResponse.json({ error: "Only children can beg" }, { status: 403 });
  }

  const body = await req.json();
  const title = String(body.title || "").trim();
  if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });

  // Get family timezone for today's date
  const { data: fam } = await supabase
    .from("families")
    .select("timezone, locale")
    .eq("id", user.family_id)
    .single();
  const famData = fam as { timezone: string; locale: string } | null;
  const today = familyToday(famData?.timezone ?? "Asia/Seoul");
  const locale = (famData?.locale || "ko") as Locale;

  const { data, error } = await supabase
    .from("chore_instances")
    .insert({
      family_id: user.family_id,
      assignee_id: user.id,
      title,
      points: 0,
      due_date: today,
      status: "requested",
      template_id: null,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Push to parents
  const { data: child } = await supabase.from("users").select("display_name").eq("id", user.id).single();
  const name = (child as { display_name: string } | null)?.display_name ?? "";
  try {
    await pushToParents(user.family_id, {
      title: t("push.beg_request_title", locale),
      body: t("push.beg_request_body", locale).replace("{name}", name).replace("{title}", title),
      url: "/chores",
    });
  } catch (e) {
    console.error("[PUSH] beg request push failed:", e);
  }

  return NextResponse.json({ id: (data as { id: string }).id });
}
