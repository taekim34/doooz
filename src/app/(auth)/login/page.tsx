import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { LoginForm } from "./_login-form";
import { t } from "@/lib/i18n";
import { getAuthLocale } from "@/lib/i18n/auth-locale";

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

  if (sp.need_confirm) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="text-[48px]">&#x1F4E7;</div>
        <div className="text-center">
          <h2 className="m-0 text-2xl font-extrabold text-[color:var(--ink)] tracking-[-0.02em]">{t("auth.email_not_confirmed_title", locale)}</h2>
          <p className="mt-2 text-sm font-medium text-[color:var(--ink-muted)] whitespace-pre-line">
            {t("auth.email_not_confirmed_desc", locale)}
          </p>
        </div>
        <Link href="/login" className="text-sm font-medium text-[color:var(--accent)] no-underline">
          {t("auth.login_button", locale)}
        </Link>
      </div>
    );
  }

  if (sp.forgot) {
    if (sp.sent) {
      /* Forgot password success screen with dzRise stagger animation */
      return (
        <div className="flex flex-col items-center gap-6 text-center">
          {/* Green check icon */}
          <div className="text-[64px] leading-none text-[color:var(--success)]"
            style={{ opacity: 0, animation: "dzRise 640ms var(--ease-spring) 40ms both" }}>&#x2705;</div>

          {/* Title */}
          <h2 className="m-0 text-2xl font-extrabold text-[color:var(--ink)] tracking-[-0.02em]"
            style={{ opacity: 0, animation: "dzRise 640ms var(--ease-spring) 80ms both" }}>{t("auth.forgot_sent_title", locale)}</h2>

          {/* Description */}
          <p className="m-0 text-sm font-normal text-[color:var(--ink-muted)] leading-[1.6]"
            style={{ opacity: 0, animation: "dzRise 640ms var(--ease-spring) 120ms both" }}>
            {t("auth.forgot_sent_desc", locale)}
          </p>

          {/* CTA - back to login */}
          <Link href="/login" className="flex items-center justify-center h-12 w-full rounded-[10px] text-[15px] font-semibold text-[color:var(--on-accent)] bg-[color:var(--ink)] no-underline tracking-[-0.01em]"
            style={{
              boxShadow: "var(--shadow-card-parent)",
              opacity: 0, animation: "dzRise 640ms var(--ease-spring) 160ms both",
            }}>
            {t("auth.forgot_return_login", locale)}
          </Link>

          {/* Resend link */}
          <Link href="/login?forgot=1" className="text-sm font-medium text-[color:var(--accent)] no-underline"
            style={{ opacity: 0, animation: "dzRise 640ms var(--ease-spring) 200ms both" }}>
            {t("auth.forgot_resend", locale)}
          </Link>
        </div>
      );
    }

    /* Forgot password form */
    return (
      <div className="flex flex-col gap-6">
        {/* Back link */}
        <Link href="/login" className="text-sm font-medium text-[color:var(--accent)] no-underline self-start">
          {t("common.back", locale)}
        </Link>

        {/* Eyebrow */}
        <div className="text-xs font-bold uppercase text-[color:var(--accent)] tracking-[0.15em] text-center">
          {t("auth.brand_subtitle", locale)}
        </div>

        {/* Icon + Title + Description */}
        <div className="flex flex-col items-center text-center gap-3">
          <div className="text-[64px] leading-none">&#x1F510;</div>
          <h2 className="m-0 text-2xl font-extrabold text-[color:var(--ink)] tracking-[-0.02em]">{t("auth.forgot_title", locale)}</h2>
          <p className="m-0 text-sm font-normal text-[color:var(--ink-muted)] leading-[1.6]">
            {t("auth.forgot_desc", locale)}
          </p>
        </div>

        {/* Form */}
        <form action={resetPasswordAction} className="flex flex-col gap-4">
          <input
            type="email"
            name="email"
            placeholder="you@family.com"
            required
            className="h-12 w-full rounded-[10px] px-4 outline-none bg-[color:var(--surface-raised)] border border-[color:var(--border-subtle)] text-[17px] font-medium text-[color:var(--ink)] transition-[border-color,background] duration-150 box-border"
          />
          {sp.error && (
            <p className="m-0 text-[13px] font-medium text-[color:var(--error)]">
              {sp.error === "email_required" ? t("auth.email_required", locale) : sp.error}
            </p>
          )}
          <button
            type="submit"
            className="h-12 w-full rounded-[10px] text-[15px] font-semibold text-[color:var(--on-accent)] bg-[color:var(--ink)] border-none cursor-pointer tracking-[-0.01em]"
            style={{ boxShadow: "var(--shadow-card-parent)" }}
          >
            {t("auth.forgot_submit", locale)}
          </button>
          <div className="text-center">
            <Link href="/login" className="text-sm font-medium text-[color:var(--accent)] no-underline">
              {t("auth.forgot_return_login", locale)}
            </Link>
          </div>
        </form>
      </div>
    );
  }

  return (
    <LoginForm
      defaultTab={sp.tab === "email" ? "email" : "family"}
      error={sp.error}
      familyLoginAction={familyLoginAction}
      emailLoginAction={emailLoginAction}
    />
  );
}
