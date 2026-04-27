import Link from "next/link";
import { redirect } from "next/navigation";
import type { Route } from "next";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { LoginForm } from "./_login-form";
import { SubmitButton } from "@/components/ui/submit-button";
import { t } from "@/lib/i18n";
import { getAuthLocale } from "@/lib/i18n/auth-locale";

async function resetPasswordAction(formData: FormData) {
  "use server";
  const email = String(formData.get("email") || "").trim();
  if (!email) redirect("/login?forgot=1&error_code=email_required");
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback?next=/auth/reset-password`,
  });
  if (error) redirect(`/login?forgot=1&error=${encodeURIComponent(error.message)}&email=${encodeURIComponent(email)}` as Route);
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
    redirect(`/login?tab=email&error=${encodeURIComponent("Invalid credentials")}&email=${encodeURIComponent(email)}`);
  }
  redirect("/");
}

async function familyLoginAction(formData: FormData) {
  "use server";
  const familyName = String(formData.get("family_name") || "").trim();
  const displayName = String(formData.get("display_name") || "").trim();
  const password = String(formData.get("password") || "");

  const preserve = new URLSearchParams({ tab: "family", family_name: familyName, display_name: displayName });
  const redirectWith = (code: string) =>
    redirect(`/login?error_code=${code}&${preserve.toString()}` as Route);

  if (!familyName || !displayName || !password) redirectWith("all_required");

  // WHY: admin required — pre-auth state has no RLS session; need family+user lookup and auth.admin.getUserById
  const admin = createAdminClient();

  const { data: fam } = await admin
    .from("families")
    .select("id")
    .eq("name", familyName)
    .maybeSingle();
  if (!fam) redirectWith("family_not_found");

  const { data: usr } = await admin
    .from("users")
    .select("id")
    .eq("family_id", fam!.id)
    .eq("display_name", displayName)
    .maybeSingle();
  if (!usr) redirectWith("name_not_found");

  const { data: authData } = await admin.auth.admin.getUserById(usr!.id);
  if (!authData?.user?.email) redirectWith("account_not_found");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: authData!.user!.email!,
    password,
  });
  if (error) redirectWith("wrong_password");

  redirect("/");
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    error_code?: string;
    tab?: string;
    need_confirm?: string;
    forgot?: string;
    sent?: string;
    email?: string;
    family_name?: string;
    display_name?: string;
  }>;
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

          {/* Spam folder hint */}
          <p className="m-0 inline-flex items-center gap-1.5 text-[12px] font-medium text-[color:var(--ink-subtle)] leading-[1.4]"
            style={{ opacity: 0, animation: "dzRise 640ms var(--ease-spring) 140ms both" }}>
            <span aria-hidden>&#x1F4EC;</span>
            {t("auth.check_spam_hint", locale)}
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
            defaultValue={sp.email || ""}
            required
            className="h-12 w-full rounded-[10px] px-4 outline-none bg-[color:var(--surface-raised)] border border-[color:var(--border-subtle)] text-[17px] font-medium text-[color:var(--ink)] transition-[border-color,background] duration-150 box-border"
          />
          {sp.error_code === "email_required" && (
            <p className="m-0 text-[12px] font-medium text-[color:var(--error)]">
              {t("auth.email_required", locale)}
            </p>
          )}
          {sp.error && sp.error_code !== "email_required" && (
            <p className="m-0 text-[13px] font-medium text-[color:var(--error)]">
              {sp.error}
            </p>
          )}
          <SubmitButton
            className="h-12 w-full rounded-[10px] text-[15px] font-semibold text-[color:var(--on-accent)] bg-[color:var(--ink)] border-none cursor-pointer tracking-[-0.01em] disabled:opacity-70"
            style={{ boxShadow: "var(--shadow-card-parent)" }}
          >
            {t("auth.forgot_submit", locale)}
          </SubmitButton>
          <div className="text-center">
            <Link href="/login" className="text-sm font-medium text-[color:var(--accent)] no-underline">
              {t("auth.forgot_return_login", locale)}
            </Link>
          </div>
        </form>
      </div>
    );
  }

  const familyErrorMap: Record<string, { msg: string; field: "family_name" | "display_name" | "password" | "form" }> = {
    all_required: { msg: t("auth.error_all_required", locale), field: "form" },
    family_not_found: { msg: t("auth.error_family_not_found", locale), field: "family_name" },
    name_not_found: { msg: t("auth.error_name_not_found", locale), field: "display_name" },
    account_not_found: { msg: t("auth.error_account_not_found", locale), field: "form" },
    wrong_password: { msg: t("auth.error_wrong_password", locale), field: "password" },
  };
  const familyErr = sp.error_code ? familyErrorMap[sp.error_code] : undefined;

  return (
    <LoginForm
      defaultTab={sp.tab === "email" ? "email" : "family"}
      error={sp.error}
      familyFieldErrors={{
        family_name: familyErr?.field === "family_name" ? familyErr.msg : undefined,
        display_name: familyErr?.field === "display_name" ? familyErr.msg : undefined,
        password: familyErr?.field === "password" ? familyErr.msg : undefined,
        form: familyErr?.field === "form" ? familyErr.msg : undefined,
      }}
      defaultEmail={sp.email || ""}
      defaultFamilyName={sp.family_name || ""}
      defaultDisplayName={sp.display_name || ""}
      familyLoginAction={familyLoginAction}
      emailLoginAction={emailLoginAction}
    />
  );
}
