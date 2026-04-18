import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent } from "@/components/ui/card";
import { FamilyNameInput } from "../join/_family-name-input";
import { LoginTabs } from "./_login-tabs";
import { t } from "@/lib/i18n";
import { getAuthLocale } from "@/lib/i18n/auth-locale";
import { FadeUp } from "@/components/ui/fade-up";
import { EyebrowLabel } from "@/components/ui/eyebrow-label";
import { FormField, StyledInput } from "@/components/ui/form-field";
import { PasswordInput } from "@/components/ui/password-input";
import { OnboardingAccordion } from "./_onboarding-accordion";

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
    <div>
      {/* Brand section */}
      <FadeUp>
        <div className="flex flex-col items-center text-center">
          <EyebrowLabel style={{ color: "#6366F1" }}>{t("auth.brand_subtitle", locale)}</EyebrowLabel>
          <div className="mt-4">
            <Image src="/logo.png" alt="DOOOZ" width={280} height={280} priority className="h-[140px] w-[140px]" />
          </div>
        </div>
      </FadeUp>

      {/* Form */}
      <FadeUp delay={160}>
        <div className="mt-10">
          <LoginTabs defaultTab={sp.tab === "email" ? "email" : "family"}>
            {/* Family login (default) */}
            <form data-tab="family" action={familyLoginAction} className="flex flex-col gap-4">
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
              <button
                type="submit"
                className="mt-2 h-12 w-full rounded-[10px] text-[15px] font-semibold text-white transition-spring hover:translate-y-[-1px]"
                style={{ background: "#0A0A0A", boxShadow: "0 1px 2px rgba(10,10,10,0.04)" }}
              >
                {t("auth.login_button", locale)}
              </button>
            </form>

            {/* Email login */}
            <form data-tab="email" action={emailLoginAction} className="flex flex-col gap-4">
              <FormField label={t("auth.email_placeholder", locale)}>
                <StyledInput type="email" name="email" placeholder="you@family.com" required />
              </FormField>
              <FormField label={t("auth.password", locale)}>
                <PasswordInput name="password" placeholder="••••••••" required />
              </FormField>
              {sp.tab === "email" && sp.error && (
                <p className="text-sm text-destructive">{sp.error}</p>
              )}
              <button
                type="submit"
                className="mt-2 h-12 w-full rounded-[10px] text-[15px] font-semibold text-white transition-spring hover:translate-y-[-1px]"
                style={{ background: "#0A0A0A", boxShadow: "0 1px 2px rgba(10,10,10,0.04)" }}
              >
                {t("auth.login_button", locale)}
              </button>
            </form>
          </LoginTabs>

          <div className="mt-3 text-center">
            <Link href="/login?forgot=1" className="text-sm font-medium" style={{ color: "#6366F1" }}>
              {t("auth.forgot_password", locale)}
            </Link>
          </div>

          <OnboardingAccordion
            joinLabel={t("auth.join_family", locale)}
            joinSub={t("auth.join_family_sub", locale)}
            createLabel={t("auth.signup_create_link", locale)}
            createSub={t("auth.create_family_sub", locale)}
          />

          <div className="mt-6">
            <Link href="/privacy" className="block text-center text-xs" style={{ color: "#9CA3AF" }}>
              {t("privacy.link", locale)}
            </Link>
          </div>
        </div>
      </FadeUp>
    </div>
  );
}
