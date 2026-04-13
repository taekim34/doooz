import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { nowDate } from "@/lib/datetime/clock";
import { pushToChild } from "@/lib/push/send";
import { t, type Locale } from "@/lib/i18n";

/**
 * POST /api/chores/beg/[id]/approve
 * Parent approves a beg request, sets points, auto-completes.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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
  if (!me || (me as { role: string }).role !== "parent") {
    return NextResponse.json({ error: "Parents only" }, { status: 403 });
  }
  const parent = me as { id: string; family_id: string };

  // Get family locale
  const { data: famRow } = await supabase.from("families").select("locale").eq("id", parent.family_id).single();
  const locale = ((famRow as { locale: string } | null)?.locale || "ko") as Locale;

  const body = await req.json();
  const points = Number(body.points);
  if (!Number.isFinite(points) || points < 1 || points > 10000) {
    return NextResponse.json({ error: "Points must be 1-10000" }, { status: 400 });
  }

  // Fetch the requested chore
  const { data: instance } = await supabase
    .from("chore_instances")
    .select("id, family_id, assignee_id, title, status")
    .eq("id", id)
    .single();
  if (!instance) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const chore = instance as { id: string; family_id: string; assignee_id: string; title: string; status: string };
  if (chore.family_id !== parent.family_id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (chore.status !== "requested") {
    return NextResponse.json({ error: "Not in requested status" }, { status: 400 });
  }

  // Update to completed with points
  const { error: updateErr } = await supabase
    .from("chore_instances")
    .update({ status: "completed", points, completed_at: nowDate().toISOString() })
    .eq("id", id);
  if (updateErr) {
    return NextResponse.json({ error: "status update failed: " + updateErr.message }, { status: 500 });
  }

  // Award points — trg_update_user_point_cache auto-updates balance/lifetime/level
  const { error: ptErr } = await supabase.from("point_transactions").insert({
    family_id: parent.family_id,
    user_id: chore.assignee_id,
    amount: points,
    kind: "chore_reward",
    reason: "beg approved: " + chore.title,
    related_chore_id: id,
    actor_id: parent.id,
  });
  if (ptErr) {
    return NextResponse.json({ error: "point award failed: " + ptErr.message }, { status: 500 });
  }

  // Evaluate badges for the child
  await supabase.rpc("evaluate_badges", { p_user_id: chore.assignee_id });

  // Push to child
  try {
    await pushToChild(chore.assignee_id, {
      title: t("push.beg_approve_title", locale),
      body: t("push.beg_approve_body", locale).replace("{title}", chore.title).replace("{points}", String(points)),
      url: "/chores",
    });
  } catch (e) {
    console.error("[PUSH] beg approve push failed:", e);
  }

  return NextResponse.json({ ok: true });
}
