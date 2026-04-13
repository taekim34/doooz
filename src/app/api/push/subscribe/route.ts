import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiError } from "@/lib/api-error";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return apiError(401, "unauthorized");

  const body = await req.json();
  const { endpoint, keys } = body;
  try {
    const url = new URL(endpoint);
    if (url.protocol !== "https:") throw new Error("not https");
  } catch {
    return apiError(400, "invalid endpoint");
  }
  if (!keys?.p256dh || !keys?.auth) {
    return apiError(400, "invalid subscription");
  }

  // Delete existing then insert (simpler than upsert with composite key)
  await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", authUser.id)
    .eq("endpoint", endpoint);

  const { error } = await supabase.from("push_subscriptions").insert({
    user_id: authUser.id,
    endpoint,
    keys_p256dh: keys.p256dh,
    keys_auth: keys.auth,
  });

  if (error) return apiError(500, "operation failed");
  return NextResponse.json({ ok: true });
}
