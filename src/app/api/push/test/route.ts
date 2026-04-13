import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendPushToUsers } from "@/lib/push/send";

/**
 * POST /api/push/test
 * Sends a test push notification to the current user.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await sendPushToUsers([authUser.id], {
    title: "테스트 푸시 🔔",
    body: "이 알림이 보이면 푸시가 정상 작동합니다!",
    url: "/",
  });

  return NextResponse.json({ ok: true, userId: authUser.id });
}
