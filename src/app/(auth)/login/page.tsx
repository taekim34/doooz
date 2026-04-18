import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FamilyNameInput } from "../join/_family-name-input";
import { LoginTabs } from "./_login-tabs";
import { t } from "@/lib/i18n";
import { getAuthLocale } from "@/lib/i18n/auth-locale";
import { FadeUp } from "@/components/ui/fade-up";
import { EyebrowLabel } from "@/components/ui/eyebrow-label";
import { CharacterAvatar } from "@/components/ui/character-avatar";
import { FormField, StyledInput } from "@/components/ui/form-field";
import { PasswordInput } from "@/components/ui/password-input";

async function emailLoginAction(formData: FormData) {
  "use server";
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (error.message.includes("Email not confirmed")) {
      redirect("/login?need_confirm=1");
    }
    redirect(`/login?tab=email&error=${encodeURIComponent("Invalid credentials")}`);
  }
  redirect("/");
}

async function familyLoginAction(formData: FormData) {
  "use server";
  const locale = await getAuthLocale();
  const familyName = String(formData.get("family_name") || "").trim();
  const displayName = String(formData.get("display_name") || "").trim();
  const password = String(formData.get("password") || "");

  const redirectWith = (msg: string) =>
    redirect(`/login?tab=family&error=${encodeURIComponent(msg)}`);

  if (!familyName || !displayName || !password) redirectWith(t("auth.error_all_required", locale));

  // WHY: admin required — pre-auth state has no RLS session; need family+user lookup and auth.admin.getUserById
  const admin = createAdminClient();

  // 1. Find family by name
  const { data: fam } = await admin
    .from("families")
    .select("id")
    .eq("name", familyName)
    .maybeSingle();
  if (!fam) redirectWith(t("auth.error_family_not_found", locale));

  // 2. Find user by display_name within the family
  const { data: usr } = await admin
    .from("users")
    .select("id")
    .eq("family_id", fam!.id)
    .eq("display_name", displayName)
    .maybeSingle();
  if (!usr) redirectWith(t("auth.error_name_not_found", locale));

  // 3. Get the auth user's email
  const { data: authData } = await admin.auth.admin.getUserById(usr!.id);
  if (!authData?.user?.email) redirectWith(t("auth.error_account_not_found", locale));

  // 4. Sign in with the looked-up email
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: authData!.user!.email!,
    password,
  });
  if (error) redirectWith(t("auth.error_wrong_password", locale));

  redirect("/");
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; tab?: string; need_confirm?: string }>;
}) {
  const sp = await searchParams;
  const locale = await getAuthLocale();

  if (sp.need_confirm) {
    return (
      <Card>
        <CardContent className="space-y-6 p-8 text-center">
          <div className="text-5xl">📧</div>
          <div>
            <h2 className="text-xl font-bold">{t("auth.email_not_confirmed_title", locale)}</h2>
            <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{t("auth.email_not_confirmed_desc", locale)}</p>
          </div>
          <Link href="/login" className="inline-block text-sm text-primary underline">
            {t("auth.login_button", locale)}
          </Link>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader>
        <FadeUp>
          <EyebrowLabel className="text-center">{t("auth.brand_subtitle", locale)}</EyebrowLabel>
          <CardTitle className="mt-1 text-center text-2xl">{t("auth.brand_heading", locale)}</CardTitle>
        </FadeUp>
        <FadeUp delay={80}>
          <div className="mt-3 flex justify-center gap-2">
            <CharacterAvatar characterId="fox" stage={1} size="sm" />
            <CharacterAvatar characterId="cat" stage={1} size="sm" />
            <CharacterAvatar characterId="bear" stage={1} size="sm" />
          </div>
        </FadeUp>
      </CardHeader>
      <CardContent>
        <LoginTabs defaultTab={sp.tab === "email" ? "email" : "family"}>
          {/* Family login (default) */}
          <form data-tab="family" action={familyLoginAction} className="space-y-4">
            <FormField label={t("auth.family_name_label", locale)}>
              <FamilyNameInput />
            </FormField>
            <FormField label={t("auth.my_name_label", locale)}>
              <StyledInput name="display_name" placeholder={t("auth.my_name_placeholder", locale)} required />
            </FormField>
            <FormField label={t("auth.password", locale)}>
              <PasswordInput name="password" placeholder={t("auth.password", locale)} required />
            </FormField>
            {sp.tab !== "email" && sp.error && (
              <p className="text-sm text-destructive">{sp.error}</p>
            )}
            <Button type="submit" className="w-full">{t("auth.login_button", locale)}</Button>
          </form>

          {/* Email login */}
          <form data-tab="email" action={emailLoginAction} className="space-y-4">
            <FormField label={t("auth.email_placeholder", locale)}>
              <StyledInput type="email" name="email" placeholder={t("auth.email_placeholder", locale)} required />
            </FormField>
            <FormField label={t("auth.password", locale)}>
              <PasswordInput name="password" placeholder={t("auth.password", locale)} required />
            </FormField>
            {sp.tab === "email" && sp.error && (
              <p className="text-sm text-destructive">{sp.error}</p>
            )}
            <Button type="submit" className="w-full">{t("auth.login_button", locale)}</Button>
          </form>
        </LoginTabs>

        <div className="mt-4 space-y-2 text-center text-sm" style={{ color: "var(--muted)" }}>
          <p>
            {t("auth.first_time", locale)}{" "}
            <Link href="/join" className="underline" style={{ color: "var(--accent-color)" }}>
              {t("auth.join_family", locale)}
            </Link>
            {" · "}
            <Link href="/signup" className="underline" style={{ color: "var(--accent-color)" }}>
              {t("auth.signup_create_link", locale)}
            </Link>
          </p>
          <p>
            <Link href="/privacy" className="text-xs underline" style={{ color: "var(--muted)" }}>
              {t("privacy.link", locale)}
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
