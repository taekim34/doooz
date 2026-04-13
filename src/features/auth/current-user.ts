import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface CurrentUser {
  id: string;
  email: string | null;
  family_id: string;
  role: "parent" | "child";
  display_name: string;
  character_id: string | null;
  current_balance: number;
  lifetime_earned: number;
  level: number;
}

export interface CurrentFamily {
  id: string;
  name: string;
  invite_code: string;
  timezone: string;
  locale: string;
}

/**
 * Loads the authed user + family row. Redirects through onboarding if
 * any prerequisite is missing. Use in (app) layout + protected pages.
 */
export async function requireUser(): Promise<{
  user: CurrentUser;
  family: CurrentFamily;
}> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  // NOTE: requires users_select_self policy (migration 20260411000005)
  // so that the user can read their own row via RLS.
  const { data: row } = await supabase
    .from("users")
    .select("id, family_id, role, display_name, character_id, current_balance, lifetime_earned, level")
    .eq("id", authUser.id)
    .maybeSingle();

  if (!row) redirect("/onboarding/create-family");

  const r = row as Omit<CurrentUser, "email">;

  // Everyone must pick a character.
  if (!r.character_id) redirect("/onboarding/pick-character");

  const { data: fam } = await supabase
    .from("families")
    .select("id, name, invite_code, timezone, locale")
    .eq("id", r.family_id)
    .maybeSingle();
  if (!fam) redirect("/onboarding/create-family");

  return {
    user: { ...r, email: authUser.email ?? null },
    family: fam as CurrentFamily,
  };
}

/**
 * Lighter variant: returns null if unauth / no row. For auth pages.
 */
export async function getCurrentAuth(): Promise<{
  authUserId: string;
  hasUserRow: boolean;
  hasCharacter: boolean;
  role: "parent" | "child" | null;
} | null> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return null;

  const { data: row } = await supabase
    .from("users")
    .select("id, character_id, role")
    .eq("id", authUser.id)
    .maybeSingle();

  const r = row as { character_id: string | null; role: "parent" | "child" } | null;
  return {
    authUserId: authUser.id,
    hasUserRow: !!r,
    hasCharacter: !!(r && r.character_id),
    role: r?.role ?? null,
  };
}
