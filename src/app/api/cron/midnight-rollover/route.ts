import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/cron/midnight-rollover
 * Called daily at 01:00 KST by Vercel Cron.
 * Marks yesterday's incomplete chores as overdue with -50pt penalty.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("dooooz_midnight_rollover");

  if (error) {
    console.error("[CRON] midnight rollover failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log("[CRON] midnight rollover processed:", data);
  return NextResponse.json({ processed: data });
}
