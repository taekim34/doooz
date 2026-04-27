"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

export type CreateFamilyState = {
  errorCode?: "required_missing" | "invite_code_min" | "family_create_failed";
  values?: {
    name?: string;
    display_name?: string;
    invite_code?: string;
    timezone?: string;
    locale?: string;
  };
} | null;

export async function createFamilyAction(
  _prev: CreateFamilyState,
  formData: FormData,
): Promise<CreateFamilyState> {
  const name = String(formData.get("name") || "").trim();
  const timezone = String(formData.get("timezone") || "Asia/Seoul");
  const familyLocale = String(formData.get("locale") || "ko");
  const displayName = String(formData.get("display_name") || "").trim();
  const customCode = String(formData.get("invite_code") || "").trim().toUpperCase();

  const values = {
    name,
    display_name: displayName,
    invite_code: customCode,
    timezone,
    locale: familyLocale,
  };

  if (!name || !displayName) return { errorCode: "required_missing", values };
  if (customCode && customCode.length < 4) return { errorCode: "invite_code_min", values };

  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  // Idempotency: if this auth user already has a users row, short-circuit.
  const { data: existing } = await supabase
    .from("users")
    .select("id, character_id")
    .eq("id", authUser.id)
    .maybeSingle();
  if (existing) {
    if (existing.character_id) redirect("/");
    redirect("/onboarding/pick-character");
  }

  // Atomic family + owner creation via RPC (avoids RLS chicken-and-egg on SELECT)
  let familyId: string | null = null;
  for (let attempt = 0; attempt < 5 && !familyId; attempt++) {
    const invite = customCode || generateInviteCode();
    const { data, error } = await supabase.rpc("create_family_with_owner", {
      p_name: name,
      p_timezone: timezone,
      p_locale: familyLocale,
      p_invite_code: invite,
      p_display_name: displayName,
    });
    if (!error) familyId = data;
    else {
      console.error("[create-family] attempt", attempt, error.message, error.code);
      if (error.code === "23505") continue; // unique violation — retry with new code
      return { errorCode: "family_create_failed", values };
    }
  }
  if (!familyId) return { errorCode: "family_create_failed", values };

  redirect("/onboarding/pick-character");
}
