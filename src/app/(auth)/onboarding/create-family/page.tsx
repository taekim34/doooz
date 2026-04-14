import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TimezoneSelect } from "@/components/ui/timezone-select";
import { t } from "@/lib/i18n";
import { getAuthLocale } from "@/lib/i18n/auth-locale";

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

async function createFamilyAction(formData: FormData) {
  "use server";
  const locale = await getAuthLocale();
  const name = String(formData.get("name") || "").trim();
  const timezone = String(formData.get("timezone") || "Asia/Seoul");
  const familyLocale = String(formData.get("locale") || locale);
  const displayName = String(formData.get("display_name") || "").trim();
  const customCode = String(formData.get("invite_code") || "").trim().toUpperCase();
  if (!name || !displayName) redirect(`/onboarding/create-family?error=${encodeURIComponent(t("auth.error_required_missing", locale))}`);
  if (customCode && customCode.length < 4) redirect(`/onboarding/create-family?error=${encodeURIComponent(t("auth.error_invite_code_min", locale))}`);

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

  // Use custom code or auto-generate; retry on collision
  let family: { id: string } | null = null;
  for (let attempt = 0; attempt < 5 && !family; attempt++) {
    const invite = customCode || generateInviteCode();
    const { data, error } = await supabase
      .from("families")
      .insert({ name, timezone, locale: familyLocale, invite_code: invite })
      .select("id")
      .single();
    if (!error) family = data;
    else {
      console.error("[create-family] attempt", attempt, error.message, error.code);
      if (error.code === "23505") continue; // unique violation — retry with new code
      redirect(`/onboarding/create-family?error=${encodeURIComponent(t("auth.error_family_create_failed", locale))}`);
    }
  }
  if (!family) redirect(`/onboarding/create-family?error=${encodeURIComponent(t("auth.error_family_create_failed", locale))}`);

  const { error: uerr } = await supabase.from("users").insert({
    id: authUser.id,
    family_id: family.id,
    role: "parent",
    display_name: displayName,
  });
  if (uerr) {
    redirect(`/onboarding/create-family?error=${encodeURIComponent(t("auth.error_family_create_failed", locale))}`);
  }

  redirect("/onboarding/pick-character");
}

export default async function CreateFamilyPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;
  const locale = await getAuthLocale();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("auth.create_family", locale)}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={createFamilyAction} className="space-y-4">
          <Input name="name" placeholder={t("auth.family_name_example", locale)} required />
          <Input name="display_name" placeholder={t("auth.my_name_label", locale)} required />
          <div className="space-y-1">
            <label htmlFor="invite_code" className="text-sm text-muted-foreground">
              {t("auth.invite_code_optional", locale)}
            </label>
            <Input
              id="invite_code"
              name="invite_code"
              placeholder={t("auth.invite_code_example", locale)}
              maxLength={20}
              className="uppercase tracking-widest"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="timezone" className="text-sm text-muted-foreground">
              {t("auth.timezone_label", locale)}
            </label>
            <TimezoneSelect name="timezone" />
          </div>
          <div className="space-y-1">
            <label htmlFor="locale" className="text-sm text-muted-foreground">
              {t("settings.language", locale)}
            </label>
            <select
              id="locale"
              name="locale"
              defaultValue={locale}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="ko">한국어</option>
              <option value="ja">日本語</option>
              <option value="en">English</option>
            </select>
          </div>
          {sp.error && <p className="text-sm text-destructive">{sp.error}</p>}
          <Button type="submit" className="w-full">
            {t("auth.create_family", locale)}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
