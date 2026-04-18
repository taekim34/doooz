import Image from "next/image";
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
    redirect("/signup?confirm=1");
  }
  // If email confirmation is disabled (local dev), a session will be active; go to onboarding.
  redirect(mode === "join" ? "/onboarding/join-family" : "/onboarding/create-family");
}

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; confirm?: string }>;
}) {
  const sp = await searchParams;
  const locale = await getAuthLocale();

  if (sp.confirm) {
    return (
      <>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <div style={{
            fontSize: 12, fontWeight: 700, textTransform: "uppercase",
            color: "#6366F1", letterSpacing: "0.15em",
          }}>DOOOZ &middot; {t("auth.brand_subtitle", locale)}</div>
          <Image
            src="/login-logo.png"
            alt="DOOOZ"
            width={400}
            height={400}
            priority
            style={{ marginTop: 12, width: 200, height: 200, display: "block", objectFit: "contain" }}
          />
        </div>

        <h1 style={{
          marginTop: 20, fontSize: 24, fontWeight: 800,
          color: "#0A0A0A", letterSpacing: "-0.02em", textAlign: "center",
        }}>
          {t("auth.check_email_title", locale)}
        </h1>
        <p style={{
          marginTop: 8, fontSize: 14, fontWeight: 500,
          color: "#6B7280", textAlign: "center",
        }}>
          {t("auth.check_email_desc", locale)}
        </p>
        <div style={{ marginTop: 16, textAlign: "center" }}>
          <Link href="/login" style={{
            fontSize: 14, fontWeight: 500, color: "#6366F1", textDecoration: "none",
          }}>
            {t("auth.login_title", locale)}
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <div style={{
          fontSize: 12, fontWeight: 700, textTransform: "uppercase",
          color: "#6366F1", letterSpacing: "0.15em",
        }}>DOOOZ &middot; {t("auth.brand_subtitle", locale)}</div>
        <Image
          src="/login-logo.png"
          alt="DOOOZ"
          width={400}
          height={400}
          priority
          style={{ marginTop: 12, width: 200, height: 200, display: "block", objectFit: "contain" }}
        />
      </div>

      <h1 style={{
        marginTop: 20, fontSize: 24, fontWeight: 800,
        color: "#0A0A0A", letterSpacing: "-0.02em", textAlign: "center",
      }}>
        {t("auth.signup_title", locale)}
      </h1>
      <p style={{
        marginTop: 8, fontSize: 14, fontWeight: 500,
        color: "#6B7280", textAlign: "center",
      }}>
        {t("auth.signup_desc", locale)}
      </p>

      <form action={signupAction} style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 14 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={{
            fontSize: 12, fontWeight: 700, textTransform: "uppercase",
            color: "#9CA3AF", letterSpacing: "0.15em",
          }}>{t("auth.email_label", locale)}</span>
          <input
            type="email"
            name="email"
            placeholder={t("auth.email_placeholder", locale)}
            required
            style={{
              height: 48, width: "100%", borderRadius: 10,
              padding: "0 16px", outline: "none",
              background: "#FAFAFA", border: "1px solid #F0F0F0",
              fontSize: 17, fontWeight: 500, color: "#0A0A0A",
              fontFamily: "inherit",
              transition: "border-color 150ms, background 150ms",
              boxSizing: "border-box" as const,
            }}
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={{
            fontSize: 12, fontWeight: 700, textTransform: "uppercase",
            color: "#9CA3AF", letterSpacing: "0.15em",
          }}>{t("auth.password", locale)}</span>
          <input
            type="password"
            name="password"
            placeholder={t("auth.password_min", locale)}
            minLength={6}
            required
            style={{
              height: 48, width: "100%", borderRadius: 10,
              padding: "0 16px", outline: "none",
              background: "#FAFAFA", border: "1px solid #F0F0F0",
              fontSize: 17, fontWeight: 500, color: "#0A0A0A",
              fontFamily: "inherit",
              transition: "border-color 150ms, background 150ms",
              boxSizing: "border-box" as const,
            }}
          />
        </label>

        <input type="hidden" name="mode" value="create" />

        {sp.error && (
          <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "#EF4444" }}>{sp.error}</p>
        )}

        <button
          type="submit"
          style={{
            marginTop: 6, height: 48, width: "100%", borderRadius: 10,
            fontSize: 15, fontWeight: 600, color: "#fff",
            background: "#0A0A0A", border: "none", cursor: "pointer",
            letterSpacing: "-0.01em",
            boxShadow: "0 1px 2px rgba(10,10,10,0.04)",
            fontFamily: "inherit",
          }}
        >
          {t("auth.signup_button", locale)}
        </button>
      </form>

      <div style={{ marginTop: 16, textAlign: "center", display: "flex", flexDirection: "column", gap: 8 }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: "#6B7280" }}>
          {t("auth.already_have_account", locale)}{" "}
          <Link href="/login" style={{ fontSize: 14, fontWeight: 500, color: "#6366F1", textDecoration: "none" }}>
            {t("auth.login_title", locale)}
          </Link>
        </p>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: "#6B7280" }}>
          {t("auth.have_invite_code", locale)}{" "}
          <Link href="/join" style={{ fontSize: 14, fontWeight: 500, color: "#6366F1", textDecoration: "none" }}>
            {t("auth.join_with_code", locale)}
          </Link>
        </p>
        <p style={{ margin: 0 }}>
          <Link href="/privacy" style={{ fontSize: 13, fontWeight: 500, color: "#6B7280", textDecoration: "none" }}>
            {t("privacy.link", locale)}
          </Link>
        </p>
      </div>
    </>
  );
}
