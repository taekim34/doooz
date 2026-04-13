import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { t } from "@/lib/i18n";
import { getAuthLocale } from "@/lib/i18n/auth-locale";

async function joinAction(formData: FormData) {
  "use server";
  const locale = await getAuthLocale();
  const familyName = String(formData.get("family_name") || "").trim();
  const displayName = String(formData.get("display_name") || "").trim();
  const inviteCode = String(formData.get("invite_code") || "").trim();
  const role = String(formData.get("role") || "child") === "parent" ? "parent" : "child";
  if (!familyName || !displayName || !inviteCode) redirect(`/onboarding/join-family?error=${encodeURIComponent(t("auth.error_input", locale))}`);

  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  const admin = createAdminClient();
  const { data: fam } = await admin
    .from("families")
    .select("id")
    .eq("name", familyName)
    .eq("invite_code", inviteCode)
    .maybeSingle();
  if (!fam) redirect(`/onboarding/join-family?error=${encodeURIComponent(t("auth.error_invite_mismatch", locale))}`);

  const { error: uerr } = await admin.from("users").insert({
    id: authUser.id,
    family_id: fam!.id,
    role,
    display_name: displayName,
  });
  if (uerr) redirect(`/onboarding/join-family?error=${encodeURIComponent(t("auth.error_join_failed", locale))}`);

  redirect("/onboarding/pick-character");
}

export default async function JoinFamilyPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;
  const locale = await getAuthLocale();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("auth.join_family_title", locale)}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={joinAction} className="space-y-4">
          <Input name="family_name" placeholder={t("auth.family_name_label", locale)} maxLength={40} required />
          <Input name="invite_code" placeholder={t("auth.invite_code_label", locale)} maxLength={20} required />
          <Input name="display_name" placeholder={t("auth.my_name_label", locale)} required />
          <select name="role" className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="child">{t("auth.role_child", locale)}</option>
            <option value="parent">{t("auth.role_parent", locale)}</option>
          </select>
          {sp.error && <p className="text-sm text-destructive">{sp.error}</p>}
          <Button type="submit" className="w-full">
            {t("auth.join_submit", locale)}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
