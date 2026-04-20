import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { t } from "@/lib/i18n";
import { getAuthLocale } from "@/lib/i18n/auth-locale";

async function signupAction(formData: FormData) {
  "use server";
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const mode = String(formData.get("mode") || "create"); // 'create' | 'join'
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }
  // If email confirmation is required, session won't exist yet
  if (data?.user && !data.session) {
    redirect(`/signup?confirm=1&email=${encodeURIComponent(email)}`);
  }
  // If email confirmation is disabled (local dev), a session will be active; go to onboarding.
  redirect(mode === "join" ? "/onboarding/join-family" : "/onboarding/create-family");
}

async function resendConfirmAction(formData: FormData) {
  "use server";
  const email = String(formData.get("email") || "").trim();
  if (!email) redirect("/signup?confirm=1");
  const supabase = await createClient();
  await supabase.auth.resend({ type: "signup", email });
  redirect(`/signup?confirm=1&email=${encodeURIComponent(email)}&resent=1`);
}

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; confirm?: string; email?: string; resent?: string }>;
}) {
  const sp = await searchParams;
  const locale = await getAuthLocale();

  if (sp.confirm) {
    return (
      <div className="relative w-full">
        {/* Pink radial blob — stronger blur variant to echo Email Confirmation mockup */}
        <div
          aria-hidden
          className="absolute -top-[180px] -right-[120px] w-[420px] h-[420px] rounded-full pointer-events-none opacity-50"
          style={{
            filter: "blur(60px)",
            background:
              "radial-gradient(closest-side, #FFE4E9 0%, rgba(255,228,233,0.4) 45%, transparent 75%)",
          }}
        />

        <div className="relative z-[1] flex flex-col items-center text-center py-2">
          {/* Email icon */}
          <div aria-hidden className="text-[64px] leading-none mb-[14px]">
            &#x1F4E7;
          </div>

          {/* Title */}
          <h1 className="m-0 text-2xl font-extrabold text-[color:var(--ink)] tracking-[-0.02em]">
            {t("auth.check_email_title", locale)}
          </h1>

          {/* Description */}
          <p className="mx-auto mt-3 mb-0 text-sm font-normal text-[color:var(--ink-muted)] tracking-[-0.01em] leading-[1.55] max-w-[300px]">
            {t("auth.check_email_desc", locale)}
          </p>

          {/* Email chip */}
          {sp.email && (
            <div className="mt-[18px] py-3 px-4 rounded-[10px] bg-[color:var(--surface-raised)] border border-[color:var(--border-subtle)] inline-flex justify-center self-center text-base font-semibold text-[color:var(--ink)] tracking-[-0.01em] whitespace-nowrap max-w-full overflow-hidden text-ellipsis">
              {sp.email}
            </div>
          )}

          {/* Resend CTA */}
          <form action={resendConfirmAction} className="w-full mt-7">
            <input type="hidden" name="email" value={sp.email || ""} />
            <button
              type="submit"
              className="h-12 w-full rounded-[10px] text-[15px] font-bold text-[color:var(--on-accent)] bg-[color:var(--ink)] border-none cursor-pointer tracking-[-0.01em]"
              style={{ boxShadow: "0 1px 2px rgba(10,10,10,0.04), 0 12px 28px -16px rgba(10,10,10,0.4)" }}
            >
              {t("auth.check_email_resend", locale)}
            </button>
          </form>

          {/* Back to login */}
          <div className="mt-4">
            <Link
              href="/login"
              className="text-sm font-medium text-[color:var(--accent)] tracking-[-0.01em] no-underline py-1"
            >
              {t("auth.forgot_return_login", locale)}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <h1 className="mt-0 text-2xl font-extrabold text-[color:var(--ink)] tracking-[-0.02em] text-center">
        {t("auth.signup_title", locale)}
      </h1>
      <p className="mt-2 text-sm font-medium text-[color:var(--ink-muted)] text-center">
        {t("auth.signup_desc", locale)}
      </p>

      <form action={signupAction} className="mt-5 flex flex-col gap-[14px]">
        <label className="flex flex-col gap-2">
          <span className="text-xs font-bold uppercase text-[color:var(--ink-subtle)] tracking-[0.15em]">{t("auth.email_label", locale)}</span>
          <input
            type="email"
            name="email"
            placeholder={t("auth.email_placeholder", locale)}
            required
            className="h-12 w-full rounded-[10px] bg-[color:var(--surface-raised)] border border-[color:var(--border-subtle)] px-4 text-[17px] font-medium text-[color:var(--ink)] outline-none transition-[border-color,background] duration-150"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-xs font-bold uppercase text-[color:var(--ink-subtle)] tracking-[0.15em]">{t("auth.password", locale)}</span>
          <input
            type="password"
            name="password"
            placeholder={t("auth.password_min", locale)}
            minLength={6}
            required
            className="h-12 w-full rounded-[10px] bg-[color:var(--surface-raised)] border border-[color:var(--border-subtle)] px-4 text-[17px] font-medium text-[color:var(--ink)] outline-none transition-[border-color,background] duration-150"
          />
        </label>

        <input type="hidden" name="mode" value="create" />

        {sp.error && (
          <div className="text-[color:var(--error)] text-sm text-center mt-2">{sp.error}</div>
        )}

        <button
          type="submit"
          className="mt-[6px] h-12 w-full rounded-[10px] text-[15px] font-semibold text-[color:var(--on-accent)] bg-[color:var(--ink)] border-none cursor-pointer tracking-[-0.01em]"
          style={{ boxShadow: "var(--shadow-card-parent)" }}
        >
          {t("auth.signup_button", locale)}
        </button>
      </form>

      <div className="mt-4 text-center flex flex-col gap-2">
        <p className="m-0 text-sm font-medium text-[color:var(--ink-muted)]">
          {t("auth.already_have_account", locale)}{" "}
          <Link href="/login" className="text-sm font-medium text-[color:var(--accent)] no-underline">
            {t("auth.login_title", locale)}
          </Link>
        </p>
        <p className="m-0 text-sm font-medium text-[color:var(--ink-muted)]">
          {t("auth.have_invite_code", locale)}{" "}
          <Link href="/join" className="text-sm font-medium text-[color:var(--accent)] no-underline">
            {t("auth.join_with_code", locale)}
          </Link>
        </p>
        <p className="m-0">
          <Link href="/privacy" className="text-[13px] font-medium text-[color:var(--ink-muted)] no-underline">
            {t("privacy.link", locale)}
          </Link>
        </p>
      </div>
    </>
  );
}
