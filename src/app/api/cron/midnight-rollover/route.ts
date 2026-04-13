import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiError } from "@/lib/api-error";

/**
 * GET /api/cron/midnight-rollover
 * Called daily at 01:00 KST by Vercel Cron.
 * Marks yesterday's incomplete tasks as overdue with -50pt penalty.
 */
export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return apiError(500, "not configured");
  }
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return apiError(401, "unauthorized");
  }

  const admin = createAdminClient();

  // 1. Rollover: mark yesterday's incomplete tasks as overdue + penalty
  const { data, error } = await admin.rpc("dooooz_midnight_rollover");
  if (error) {
    console.error("[CRON] midnight rollover failed:", error.message);
    return apiError(500, "operation failed");
  }

  // 2. Generate today's task instances for all families (single SQL call)
  const { data: generated, error: genErr } = await admin.rpc("ensure_all_today_instances");
  if (genErr) {
    console.error("[CRON] ensure_all_today_instances failed:", genErr.message);
  }

  return NextResponse.json({ processed: data, generated: generated ?? 0 });
}
