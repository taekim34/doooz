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
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <div style={{ fontSize: 48 }}>&#x1F4E7;</div>
        <div style={{ textAlign: "center" }}>
          <h2 style={{
            margin: 0, fontSize: 24, fontWeight: 800,
            color: "var(--ink)", letterSpacing: "-0.02em",
          }}>{t("auth.email_not_confirmed_title", locale)}</h2>
          <p style={{
            marginTop: 8, fontSize: 14, fontWeight: 500,
            color: "var(--ink-muted)", whiteSpace: "pre-line",
          }}>
            {t("auth.email_not_confirmed_desc", locale)}
          </p>
        </div>
        <Link href="/login" style={{
          fontSize: 14, fontWeight: 500, color: "var(--accent)", textDecoration: "none",
        }}>
          {t("auth.login_button", locale)}
        </Link>
      </div>
    );
  }

  if (sp.forgot) {
    if (sp.sent) {
      /* Forgot password success screen with dzRise stagger animation */
      return (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          gap: 24, textAlign: "center",
        }}>
          {/* Green check icon */}
          <div style={{
            fontSize: 64, lineHeight: 1, color: "var(--success)",
            opacity: 0, animation: "dzRise 640ms cubic-bezier(0.16,1,0.3,1) 40ms both",
          }}>&#x2705;</div>

          {/* Title */}
          <h2 style={{
            margin: 0, fontSize: 24, fontWeight: 800,
            color: "var(--ink)", letterSpacing: "-0.02em",
            opacity: 0, animation: "dzRise 640ms cubic-bezier(0.16,1,0.3,1) 80ms both",
          }}>{t("auth.forgot_sent_title", locale)}</h2>

          {/* Description */}
          <p style={{
            margin: 0, fontSize: 14, fontWeight: 400,
            color: "var(--ink-muted)", lineHeight: 1.6,
            opacity: 0, animation: "dzRise 640ms cubic-bezier(0.16,1,0.3,1) 120ms both",
          }}>
            {t("auth.forgot_sent_desc", locale)}
          </p>

          {/* CTA - back to login */}
          <Link href="/login" style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            height: 48, width: "100%", borderRadius: 10,
            fontSize: 15, fontWeight: 600, color: "var(--on-accent)",
            background: "var(--ink)", textDecoration: "none",
            letterSpacing: "-0.01em",
            boxShadow: "0 1px 2px rgba(10,10,10,0.04)",
            opacity: 0, animation: "dzRise 640ms cubic-bezier(0.16,1,0.3,1) 160ms both",
          }}>
            {t("auth.forgot_return_login", locale)}
          </Link>

          {/* Resend link */}
          <Link href="/login?forgot=1" style={{
            fontSize: 14, fontWeight: 500, color: "var(--accent)",
            textDecoration: "none",
            opacity: 0, animation: "dzRise 640ms cubic-bezier(0.16,1,0.3,1) 200ms both",
          }}>
            {t("auth.forgot_resend", locale)}
          </Link>
        </div>
      );
    }

    /* Forgot password form */
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Back link */}
        <Link href="/login" style={{
          fontSize: 14, fontWeight: 500, color: "var(--accent)",
          textDecoration: "none", alignSelf: "flex-start",
        }}>
          {t("common.back", locale)}
        </Link>

        {/* Eyebrow */}
        <div style={{
          fontSize: 12, fontWeight: 700, textTransform: "uppercase",
          color: "var(--accent)", letterSpacing: "0.15em", textAlign: "center",
        }}>
          {t("auth.brand_subtitle", locale)}
        </div>

        {/* Icon + Title + Description */}
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          textAlign: "center", gap: 12,
        }}>
          <div style={{ fontSize: 64, lineHeight: 1 }}>&#x1F510;</div>
          <h2 style={{
            margin: 0, fontSize: 24, fontWeight: 800,
            color: "var(--ink)", letterSpacing: "-0.02em",
          }}>{t("auth.forgot_title", locale)}</h2>
          <p style={{
            margin: 0, fontSize: 14, fontWeight: 400, color: "var(--ink-muted)",
            lineHeight: 1.6,
          }}>
            {t("auth.forgot_desc", locale)}
          </p>
        </div>

        {/* Form */}
        <form action={resetPasswordAction} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <input
            type="email"
            name="email"
            placeholder="you@family.com"
            required
            style={{
              height: 48, width: "100%", borderRadius: 10,
              padding: "0 16px", outline: "none",
              background: "var(--surface-raised)", border: "1px solid var(--border-subtle)",
              fontSize: 17, fontWeight: 500, color: "var(--ink)",
              transition: "border-color 150ms, background 150ms",
              boxSizing: "border-box" as const,
            }}
          />
          {sp.error && (
            <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "var(--error)" }}>
              {sp.error === "email_required" ? t("auth.email_required", locale) : sp.error}
            </p>
          )}
          <button
            type="submit"
            style={{
              height: 48, width: "100%", borderRadius: 10,
              fontSize: 15, fontWeight: 600, color: "var(--on-accent)",
              background: "var(--ink)", border: "none", cursor: "pointer",
              letterSpacing: "-0.01em",
              boxShadow: "0 1px 2px rgba(10,10,10,0.04)",
            }}
          >
            {t("auth.forgot_submit", locale)}
          </button>
          <div style={{ textAlign: "center" }}>
            <Link href="/login" style={{
              fontSize: 14, fontWeight: 500, color: "var(--accent)", textDecoration: "none",
            }}>
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
