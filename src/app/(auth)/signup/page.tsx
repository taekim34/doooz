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
      <div style={{ position: "relative", width: "100%" }}>
        {/* Pink radial blob — stronger blur variant to echo Email Confirmation mockup */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: -180,
            right: -120,
            width: 420,
            height: 420,
            borderRadius: 9999,
            filter: "blur(60px)",
            opacity: 0.5,
            pointerEvents: "none",
            background:
              "radial-gradient(closest-side, #FFE4E9 0%, rgba(255,228,233,0.4) 45%, transparent 75%)",
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            padding: "8px 0",
          }}
        >
          {/* Email icon */}
          <div aria-hidden style={{ fontSize: 64, lineHeight: 1, marginBottom: 14 }}>
            &#x1F4E7;
          </div>

          {/* Title */}
          <h1
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 800,
              color: "var(--ink)",
              letterSpacing: "-0.02em",
            }}
          >
            {t("auth.check_email_title", locale)}
          </h1>

          {/* Description */}
          <p
            style={{
              margin: "12px auto 0",
              fontSize: 14,
              fontWeight: 400,
              color: "var(--ink-muted)",
              letterSpacing: "-0.01em",
              lineHeight: 1.55,
              maxWidth: 300,
            }}
          >
            {t("auth.check_email_desc", locale)}
          </p>

          {/* Email chip */}
          {sp.email && (
            <div
              style={{
                marginTop: 18,
                padding: "12px 16px",
                borderRadius: 10,
                background: "var(--surface-raised)",
                border: "1px solid var(--border-subtle)",
                display: "inline-flex",
                justifyContent: "center",
                alignSelf: "center",
                fontSize: 16,
                fontWeight: 600,
                color: "var(--ink)",
                letterSpacing: "-0.01em",
                whiteSpace: "nowrap",
                maxWidth: "100%",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {sp.email}
            </div>
          )}

          {/* Resend CTA */}
          <form action={resendConfirmAction} style={{ width: "100%", marginTop: 28 }}>
            <input type="hidden" name="email" value={sp.email || ""} />
            <button
              type="submit"
              style={{
                height: 48,
                width: "100%",
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 700,
                color: "var(--on-accent)",
                background: "var(--ink)",
                border: "none",
                cursor: "pointer",
                letterSpacing: "-0.01em",
                boxShadow:
                  "0 1px 2px rgba(10,10,10,0.04), 0 12px 28px -16px rgba(10,10,10,0.4)",
              }}
            >
              {t("auth.check_email_resend", locale)}
            </button>
          </form>

          {/* Back to login */}
          <div style={{ marginTop: 16 }}>
            <Link
              href="/login"
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: "var(--accent)",
                letterSpacing: "-0.01em",
                textDecoration: "none",
                padding: "4px 0",
              }}
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
      <h1 style={{
        marginTop: 0, fontSize: 24, fontWeight: 800,
        color: "var(--ink)", letterSpacing: "-0.02em", textAlign: "center",
      }}>
        {t("auth.signup_title", locale)}
      </h1>
      <p style={{
        marginTop: 8, fontSize: 14, fontWeight: 500,
        color: "var(--ink-muted)", textAlign: "center",
      }}>
        {t("auth.signup_desc", locale)}
      </p>

      <form action={signupAction} style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 14 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={{
            fontSize: 12, fontWeight: 700, textTransform: "uppercase",
            color: "var(--ink-subtle)", letterSpacing: "0.15em",
          }}>{t("auth.email_label", locale)}</span>
          <input
            type="email"
            name="email"
            placeholder={t("auth.email_placeholder", locale)}
            required
            className="h-12 w-full rounded-[10px] bg-[color:var(--surface-raised)] border border-[color:var(--border-subtle)] px-4 text-[17px] font-medium text-[color:var(--ink)] outline-none transition-[border-color,background] duration-150"
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={{
            fontSize: 12, fontWeight: 700, textTransform: "uppercase",
            color: "var(--ink-subtle)", letterSpacing: "0.15em",
          }}>{t("auth.password", locale)}</span>
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
          <div style={{ color: "var(--error)", fontSize: 14, textAlign: "center", marginTop: 8 }}>{sp.error}</div>
        )}

        <button
          type="submit"
          style={{
            marginTop: 6, height: 48, width: "100%", borderRadius: 10,
            fontSize: 15, fontWeight: 600, color: "var(--on-accent)",
            background: "var(--ink)", border: "none", cursor: "pointer",
            letterSpacing: "-0.01em",
            boxShadow: "0 1px 2px rgba(10,10,10,0.04)",
          }}
        >
          {t("auth.signup_button", locale)}
        </button>
      </form>

      <div style={{ marginTop: 16, textAlign: "center", display: "flex", flexDirection: "column", gap: 8 }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: "var(--ink-muted)" }}>
          {t("auth.already_have_account", locale)}{" "}
          <Link href="/login" style={{ fontSize: 14, fontWeight: 500, color: "var(--accent)", textDecoration: "none" }}>
            {t("auth.login_title", locale)}
          </Link>
        </p>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: "var(--ink-muted)" }}>
          {t("auth.have_invite_code", locale)}{" "}
          <Link href="/join" style={{ fontSize: 14, fontWeight: 500, color: "var(--accent)", textDecoration: "none" }}>
            {t("auth.join_with_code", locale)}
          </Link>
        </p>
        <p style={{ margin: 0 }}>
          <Link href="/privacy" style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-muted)", textDecoration: "none" }}>
            {t("privacy.link", locale)}
          </Link>
        </p>
      </div>
    </>
  );
}
