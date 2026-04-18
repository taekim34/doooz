import { NextResponse } from "next/server";
import { requireUser } from "@/features/auth/current-user";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const { user, family } = await requireUser();
  if (user.role !== "parent") {
    return NextResponse.json({ error: "Parents only" }, { status: 403 });
  }

  const { userId, newPassword } = await req.json();
  if (!userId || !newPassword || newPassword.length < 4) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  // WHY: admin required — parent resets another family member's password via auth.admin API
  const admin = createAdminClient();
  const { data: target } = await admin
    .from("users")
    .select("id, family_id")
    .eq("id", userId)
    .maybeSingle();

  if (!target || target.family_id !== family.id) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { error } = await admin.auth.admin.updateUserById(userId, {
    password: newPassword,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
