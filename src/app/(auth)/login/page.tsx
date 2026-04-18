import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { FamilyNameInput } from "../join/_family-name-input";
import { LoginTabs } from "./_login-tabs";
import { t } from "@/lib/i18n";
import { getAuthLocale } from "@/lib/i18n/auth-locale";
import { FormField, StyledInput } from "@/components/ui/form-field";
import { PasswordInput } from "@/components/ui/password-input";
import { StartSheet } from "./_start-sheet";
import { LocalePill } from "./_locale-pill";
import type { Locale } from "@/lib/i18n";

async function resetPasswordAction(formData: FormData) {
  "use server";
  const email = String(formData.get("email") || "").trim();
  if (!email) redirect("/login?forgot=1&error=email_required");
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/login`,
  });
  if (error) redirect(`/login?forgot=1&error=${encodeURIComponent(error.message)}`);
  redirect("/login?forgot=1&sent=1");
}

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
  searchParams: Promise<{ error?: string; tab?: string; need_confirm?: string; forgot?: string; sent?: string }>;
}) {
  const sp = await searchParams;
  const locale = await getAuthLocale();
  const cookieStore = await cookies();
  const currentLocale = (cookieStore.get("doooz_locale")?.value || "ko") as Locale;

  if (sp.need_confirm) {
    return (
      <div className="space-y-6 text-center">
        <div className="text-5xl">📧</div>
        <div>
          <h2 className="text-xl font-bold">{t("auth.email_not_confirmed_title", locale)}</h2>
          <p className="mt-2 whitespace-pre-line text-sm" style={{ color: "#9CA3AF" }}>
            {t("auth.email_not_confirmed_desc", locale)}
          </p>
        </div>
        <Link href="/login" className="inline-block text-sm underline" style={{ color: "#6366F1" }}>
          {t("auth.login_button", locale)}
        </Link>
      </div>
    );
  }

  if (sp.forgot) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-bold">{t("auth.forgot_title", locale)}</h2>
          <p className="mt-2 text-sm" style={{ color: "#9CA3AF" }}>
            {t("auth.forgot_desc", locale)}
          </p>
        </div>

        {sp.sent ? (
          <div className="space-y-4 text-center">
            <div className="text-5xl">📧</div>
            <p className="text-sm font-medium" style={{ color: "#22C55E" }}>
              {t("auth.forgot_sent", locale)}
            </p>
            <Link href="/login" className="inline-block text-sm underline" style={{ color: "#6366F1" }}>
              {t("auth.login_button", locale)}
            </Link>
          </div>
        ) : (
          <form action={resetPasswordAction} className="flex flex-col" style={{ gap: 16 }}>
            <FormField label={t("auth.email_placeholder", locale)}>
              <StyledInput type="email" name="email" placeholder="you@family.com" required />
            </FormField>
            {sp.error && (
              <p className="text-sm text-destructive">
                {sp.error === "email_required" ? t("auth.email_required", locale) : sp.error}
              </p>
            )}
            <button
              type="submit"
              className="w-full text-white transition-transform hover:translate-y-[-1px]"
              style={{
                marginTop: 8,
                height: 48,
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 600,
                background: "#0A0A0A",
                border: "none",
                letterSpacing: "-0.01em",
                boxShadow: "0 1px 2px rgba(10,10,10,0.04)",
              }}
            >
              {t("auth.forgot_submit", locale)}
            </button>
            <div className="text-center">
              <Link href="/login" className="text-sm underline" style={{ color: "#6366F1" }}>
                {t("auth.login_button", locale)}
              </Link>
            </div>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="relative flex flex-col">
      {/* Top-right locale switcher */}
      <LocalePill current={currentLocale} />

      {/* Brand section */}
      <div className="flex flex-col items-center text-center">
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            textTransform: "uppercase",
            color: "#6366F1",
            letterSpacing: "0.15em",
          }}
        >
          {t("auth.brand_subtitle", locale)}
        </div>
        <Image
          src="/home-logo.png"
          alt="DOOOZ"
          width={280}
          height={280}
          priority
          className="mt-4 block object-contain"
          style={{ width: 140, height: 140 }}
        />
      </div>

      {/* Form */}
      <div style={{ marginTop: 24 }}>
        <LoginTabs defaultTab={sp.tab === "email" ? "email" : "family"}>
          {/* Family login (default) */}
          <form data-tab="family" action={familyLoginAction} className="flex flex-col" style={{ gap: 16 }}>
            <FormField label={t("auth.family_name_label", locale)}>
              <FamilyNameInput placeholder={t("auth.family_name_placeholder", locale)} />
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
              className="w-full text-white transition-transform hover:translate-y-[-1px]"
              style={{
                marginTop: 8,
                height: 48,
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 600,
                background: "#0A0A0A",
                border: "none",
                letterSpacing: "-0.01em",
                boxShadow: "0 1px 2px rgba(10,10,10,0.04)",
              }}
            >
              {t("auth.login_button", locale)}
            </button>
          </form>

          {/* Email login */}
          <form data-tab="email" action={emailLoginAction} className="flex flex-col" style={{ gap: 16 }}>
            <FormField label={t("auth.email_label", locale)}>
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
              className="w-full text-white transition-transform hover:translate-y-[-1px]"
              style={{
                marginTop: 8,
                height: 48,
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 600,
                background: "#0A0A0A",
                border: "none",
                letterSpacing: "-0.01em",
                boxShadow: "0 1px 2px rgba(10,10,10,0.04)",
              }}
            >
              {t("auth.login_button", locale)}
            </button>
          </form>
        </LoginTabs>

        <div className="flex items-center justify-center" style={{ marginTop: 16 }}>
          <Link
            href="/login?forgot=1"
            className="whitespace-nowrap"
            style={{ fontSize: 14, fontWeight: 500, color: "#6366F1" }}
          >
            {t("auth.forgot_password", locale)}
          </Link>
        </div>

        <StartSheet
          joinLabel={t("auth.join_family", locale)}
          joinSub={t("auth.join_family_sub", locale)}
          createLabel={t("auth.signup_create_link", locale)}
          createSub={t("auth.create_family_sub", locale)}
        />

      </div>
    </div>
  );
}
