import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { pushToChild } from "@/lib/push/send";
import { t, type Locale } from "@/lib/i18n";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Get family locale
  const { data: meRow } = await supabase.from("users").select("family_id").eq("id", authUser.id).single();
  const familyId = (meRow as { family_id: string } | null)?.family_id;
  let locale: Locale = "ko";
  if (familyId) {
    const { data: famRow } = await supabase.from("families").select("locale").eq("id", familyId).single();
    locale = ((famRow as { locale: string } | null)?.locale || "ko") as Locale;
  }

  // Fetch request info before approve (for push)
  const { data: reqInfo } = await supabase
    .from("reward_requests")
    .select("user_id, rewards(title, cost)")
    .eq("id", id)
    .single();

  const { data, error } = await supabase.rpc("approve_reward_request", { p_request_id: id });

  if (error) {
    const msg = error.message || "";
    const status = msg.includes("INSUFFICIENT_BALANCE") ? 409 : msg.includes("FORBIDDEN") ? 403 : msg.includes("NOT_FOUND") ? 404 : msg.includes("INVALID_STATE") ? 422 : 400;
    return NextResponse.json({ error: msg }, { status });
  }

  // Push to child
  if (reqInfo) {
    try {
      const info = reqInfo as { user_id: string; rewards: { title: string; cost: number } | null };
      await pushToChild(info.user_id, {
        title: t("push.reward_approve_title", locale),
        body: t("push.reward_approve_body", locale).replace("{title}", info.rewards?.title ?? ""),
        url: "/rewards",
      });
    } catch (e) {
      console.error("[PUSH] reward approve push failed:", e);
    }
  }

  return NextResponse.json({ transaction_id: data });
}
