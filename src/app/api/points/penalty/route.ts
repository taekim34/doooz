import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiError } from "@/lib/api-error";
import { pushToChild } from "@/lib/push/send";
import { t, type Locale } from "@/lib/i18n";

/**
 * POST /api/points/penalty
 * Parent gives penalty (negative points) to a child.
 * Symmetric counterpart to the "beg" flow.
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
  if (!me || me.role !== "parent") {
    return apiError(403, "forbidden");
  }

  const body = await req.json();
  const childId = String(body.child_id || "").trim();
  const reason = String(body.reason || "").trim();
  const amount = Number(body.amount);

  if (!childId) return apiError(400, "child_id required");
  if (!reason) return apiError(400, "reason required");
  if (!Number.isFinite(amount) || amount < 1 || amount > 10000) {
    return apiError(400, "amount must be 1-10000");
  }

  const { data: child } = await supabase
    .from("users")
    .select("id, family_id, role, display_name")
    .eq("id", childId)
    .single();
  if (!child || child.family_id !== me.family_id || child.role !== "child") {
    return apiError(404, "child not found");
  }

  const { data: famRow } = await supabase
    .from("families")
    .select("locale")
    .eq("id", me.family_id)
    .single();
  const locale = (famRow?.locale || "ko") as Locale;

  const { error: ptErr } = await supabase.from("point_transactions").insert({
    family_id: me.family_id,
    user_id: childId,
    amount: -amount,
    kind: "penalty",
    reason,
    related_task_id: null,
    actor_id: me.id,
  });
  if (ptErr) return apiError(500, "operation failed");

  try {
    await pushToChild(childId, {
      title: t("push.penalty_title", locale),
      body: t("push.penalty_body", locale)
        .replace("{reason}", reason)
        .replace("{points}", String(amount)),
      url: "/points",
    });
  } catch (e) {
    console.error("[PUSH] penalty push failed:", e);
  }

  return NextResponse.json({ ok: true });
}
