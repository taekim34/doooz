import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { pushToChild } from "@/lib/push/send";
import { t, type Locale } from "@/lib/i18n";
import { apiError } from "@/lib/api-error";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return apiError(401, "unauthorized");

  // Get family locale
  const { data: meRow } = await supabase.from("users").select("family_id").eq("id", authUser.id).single();
  const familyId = meRow?.family_id;
  let locale: Locale = "ko";
  if (familyId) {
    const { data: famRow } = await supabase.from("families").select("locale").eq("id", familyId).single();
    locale = (famRow?.locale || "ko") as Locale;
  }

  // Fetch request info for push
  const { data: reqInfo } = await supabase
    .from("reward_requests")
    .select("requested_by, rewards(title)")
    .eq("id", id)
    .single();

  const body = (await req.json().catch(() => ({}))) as { note?: string };

  const { error } = await supabase.rpc("reject_reward_request", {
    p_request_id: id,
    p_note: body.note ?? "",
  });

  if (error) {
    const msg = error.message || "";
    const status = msg.includes("FORBIDDEN") ? 403 : msg.includes("NOT_FOUND") ? 404 : msg.includes("INVALID_STATE") ? 422 : 400;
    return apiError(status, "operation failed");
  }

  // Push to child
  if (reqInfo) {
    try {
      await pushToChild(reqInfo.requested_by, {
        title: t("push.reward_reject_title", locale),
        body: t("push.reward_reject_body", locale).replace("{title}", (reqInfo.rewards as { title: string } | null)?.title ?? ""),
        url: "/rewards",
      });
    } catch (e) {
      console.error("[PUSH] reward reject push failed:", e);
    }
  }

  return NextResponse.json({ ok: true });
}
