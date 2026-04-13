import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { pushToParents } from "@/lib/push/send";
import { t, type Locale } from "@/lib/i18n";

/**
 * POST /api/chores/beg/[id]/cancel
 * Child cancels their own pending beg request.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: instance } = await supabase
    .from("chore_instances")
    .select("id, assignee_id, status, title, family_id")
    .eq("id", id)
    .single();
  if (!instance) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const chore = instance as { id: string; assignee_id: string; status: string; title: string; family_id: string };
  if (chore.assignee_id !== authUser.id) {
    return NextResponse.json({ error: "only requester can cancel" }, { status: 403 });
  }
  if (chore.status !== "requested") {
    return NextResponse.json({ error: "only pending requests can be cancelled" }, { status: 400 });
  }

  // Get child name and family locale before deleting
  const { data: child } = await supabase.from("users").select("display_name").eq("id", authUser.id).single();
  const name = (child as { display_name: string } | null)?.display_name ?? "";
  const { data: famRow } = await supabase.from("families").select("locale").eq("id", chore.family_id).single();
  const locale = ((famRow as { locale: string } | null)?.locale || "ko") as Locale;

  await supabase.from("chore_instances").delete().eq("id", id);

  // Notify parents
  try {
    await pushToParents(chore.family_id, {
      title: t("push.beg_cancel_title", locale),
      body: t("push.beg_cancel_body", locale).replace("{name}", name).replace("{title}", chore.title),
      url: "/chores",
    });
  } catch (e) {
    console.error("[PUSH] beg cancel push failed:", e);
  }

  return NextResponse.json({ ok: true });
}
