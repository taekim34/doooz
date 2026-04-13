import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { pushToChild } from "@/lib/push/send";
import { t, type Locale } from "@/lib/i18n";

/**
 * POST /api/chores/beg/[id]/reject
 * Parent rejects a beg request.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
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

  const { data: instance } = await supabase
    .from("chore_instances")
    .select("id, family_id, status, assignee_id, title")
    .eq("id", id)
    .single();
  if (!instance) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const chore = instance as { id: string; family_id: string; status: string; assignee_id: string; title: string };
  const parentFamilyId = (me as { family_id: string }).family_id;

  // Get family locale
  const { data: famRow } = await supabase.from("families").select("locale").eq("id", parentFamilyId).single();
  const locale = ((famRow as { locale: string } | null)?.locale || "ko") as Locale;

  if (chore.family_id !== parentFamilyId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (chore.status !== "requested") {
    return NextResponse.json({ error: "Not in requested status" }, { status: 400 });
  }

  await supabase
    .from("chore_instances")
    .update({ status: "rejected" })
    .eq("id", id);

  // Push to child
  try {
    await pushToChild(chore.assignee_id, {
      title: t("push.beg_reject_title", locale),
      body: t("push.beg_reject_body", locale).replace("{title}", chore.title),
      url: "/chores",
    });
  } catch (e) {
    console.error("[PUSH] beg reject push failed:", e);
  }

  return NextResponse.json({ ok: true });
}
