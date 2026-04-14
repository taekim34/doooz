import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/features/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { characterEmoji } from "@/features/characters/emoji-map";
import { getStage } from "@/lib/level";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { TimezoneSelect } from "@/components/ui/timezone-select";
import { t, type Locale } from "@/lib/i18n";
import { DeleteAccount } from "./_delete-account";
import { DeleteFamily } from "./_delete-family";

async function updateNameAction(formData: FormData) {
  "use server";
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");
  const display_name = String(formData.get("display_name") || "").trim();
  if (display_name) {
    await supabase.from("users").update({ display_name }).eq("id", authUser.id);
  }
  redirect("/settings");
}

async function updateFamilyAction(formData: FormData) {
  "use server";
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");
  const { data: me } = await supabase
    .from("users")
    .select("family_id, role")
    .eq("id", authUser.id)
    .single();
  if (!me || me.role !== "parent") redirect("/settings");

  const familyName = String(formData.get("family_name") || "").trim();
  const timezone = String(formData.get("timezone") || "Asia/Seoul");
  const localeVal = String(formData.get("locale") || "ko");
  const familyId = me.family_id;

  const { error } = await supabase
    .from("families")
    .update({ name: familyName || undefined, timezone, locale: localeVal })
    .eq("id", familyId);
  if (error?.code === "23505") {
    redirect(`/settings?error=${encodeURIComponent(t("settings.error_family_exists"))}`);
  }
  redirect("/settings");
}

async function changePasswordAction(formData: FormData) {
  "use server";
  const currentPassword = String(formData.get("current_password") || "");
  const newPassword = String(formData.get("new_password") || "");
  const confirmPassword = String(formData.get("confirm_password") || "");

  const redirectWith = (msg: string) =>
    redirect(`/settings?pw_error=${encodeURIComponent(msg)}`);
  const redirectOk = (msg: string) =>
    redirect(`/settings?pw_ok=${encodeURIComponent(msg)}`);

  if (!currentPassword || !newPassword || !confirmPassword) redirectWith(t("settings.error_all_required"));
  if (newPassword.length < 6) redirectWith(t("settings.error_password_min"));
  if (newPassword !== confirmPassword) redirectWith(t("settings.error_password_mismatch"));

  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  // Verify current password by attempting sign-in
  if (!authUser.email) redirectWith(t("settings.error_account_not_found"));

  const { error: verifyErr } = await supabase.auth.signInWithPassword({
    email: authUser.email!,
    password: currentPassword,
  });
  if (verifyErr) redirectWith(t("settings.error_wrong_password"));

  // Update password
  const { error: updateErr } = await supabase.auth.updateUser({
    password: newPassword,
  });
  if (updateErr) redirectWith(updateErr.message);

  redirectOk(t("settings.password_changed"));
}

async function logoutAction() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; pw_error?: string; pw_ok?: string }>;
}) {
  const sp = await searchParams;
  const { user, family } = await requireUser();
  const locale = (family.locale || "ko") as Locale;

  // Determine if current user is the family admin (earliest parent by created_at)
  const supabaseForAdmin = await createClient();
  const { data: earliestParent } = await supabaseForAdmin
    .from("users")
    .select("id")
    .eq("family_id", family.id)
    .eq("role", "parent")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();
  const isAdmin = earliestParent?.id === user.id;

  return (
    <div className="mx-auto max-w-md space-y-4">
      <BackButton fallback="/" />
      <h1 className="text-2xl font-bold">{t("settings.title", locale)}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.change_name", locale)}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateNameAction} className="space-y-3">
            <Input name="display_name" defaultValue={user.display_name} required />
            <Button type="submit" className="w-full">{t("settings.save", locale)}</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.character", locale)}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-2xl">{characterEmoji(user.character_id, getStage(user.level))}</span>
            <Link href={"/characters/gallery" as never} className="text-sm text-primary underline">
              {t("settings.change_link", locale)}
            </Link>
          </div>
        </CardContent>
      </Card>

      {user.role === "parent" && (
        <Card>
          <CardHeader>
            <CardTitle>{t("settings.family", locale)}</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={updateFamilyAction} className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium">{t("settings.family_name", locale)}</label>
                <Input name="family_name" defaultValue={family.name} required maxLength={40} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">{t("settings.timezone", locale)}</label>
                <TimezoneSelect name="timezone" defaultValue={family.timezone} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">{t("settings.language", locale)}</label>
                <select
                  name="locale"
                  defaultValue={family.locale || "ko"}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="ko">한국어</option>
                  <option value="ja">日本語</option>
                  <option value="en">English</option>
                </select>
              </div>
              {sp.error && <p className="text-sm text-destructive">{sp.error}</p>}
              <Button type="submit" className="w-full">{t("settings.save", locale)}</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.password", locale)}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={changePasswordAction} className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium">{t("settings.current_password", locale)}</label>
              <Input type="password" name="current_password" required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{t("settings.new_password", locale)}</label>
              <Input type="password" name="new_password" minLength={6} required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{t("settings.confirm_password", locale)}</label>
              <Input type="password" name="confirm_password" minLength={6} required />
            </div>
            {sp.pw_error && <p className="text-sm text-destructive">{sp.pw_error}</p>}
            {sp.pw_ok && <p className="text-sm text-green-600">{sp.pw_ok}</p>}
            <Button type="submit" className="w-full">{t("settings.change_button", locale)}</Button>
          </form>
        </CardContent>
      </Card>

      {isAdmin ? (
        <DeleteFamily locale={locale} />
      ) : (
        <DeleteAccount locale={locale} />
      )}

      <Card>
        <CardContent className="p-4">
          <form action={logoutAction}>
            <Button type="submit" variant="destructive" className="w-full">
              {t("settings.logout", locale)}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
