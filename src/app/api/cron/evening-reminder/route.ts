import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUsers } from "@/lib/push/send";
import { nowDate } from "@/lib/datetime/clock";
import { t, type Locale } from "@/lib/i18n";
import { apiError } from "@/lib/api-error";

/**
 * GET /api/cron/evening-reminder
 * Called daily at 21:00 KST by Vercel Cron.
 * Sends push to children who have incomplete tasks today.
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

  // Get all families and their timezones
  const { data: families } = await admin.from("families").select("id, timezone, locale");
  if (!families) return NextResponse.json({ sent: 0 });

  let totalSent = 0;

  for (const fam of families) {
    const locale = (fam.locale || "ko") as Locale;
    // Calculate today for this family's timezone
    const now = nowDate();
    const today = now.toLocaleDateString("en-CA", { timeZone: fam.timezone }); // YYYY-MM-DD

    // Find children with incomplete tasks today
    const { data: incomplete } = await admin
      .from("task_instances")
      .select("assignee_id, title")
      .eq("family_id", fam.id)
      .eq("due_date", today)
      .eq("status", "pending");

    if (!incomplete || incomplete.length === 0) continue;

    // Group by child
    const byChild = new Map<string, string[]>();
    for (const c of incomplete as Array<{ assignee_id: string; title: string }>) {
      const list = byChild.get(c.assignee_id) ?? [];
      list.push(c.title);
      byChild.set(c.assignee_id, list);
    }

    for (const [childId, titles] of byChild) {
      const titlesStr = titles.slice(0, 3).join(", ") + (titles.length > 3 ? " ..." : "");
      await sendPushToUsers([childId], {
        title: t("push.evening_title", locale),
        body: t("push.evening_body", locale).replace("{count}", String(titles.length)).replace("{titles}", titlesStr),
        url: "/tasks",
      });
      totalSent++;
    }
  }

  return NextResponse.json({ sent: totalSent });
}
