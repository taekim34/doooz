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
            color: "#0A0A0A", letterSpacing: "-0.02em",
          }}>{t("auth.email_not_confirmed_title", locale)}</h2>
          <p style={{
            marginTop: 8, fontSize: 14, fontWeight: 500,
            color: "#6B7280", whiteSpace: "pre-line",
          }}>
            {t("auth.email_not_confirmed_desc", locale)}
          </p>
        </div>
        <Link href="/login" style={{
          fontSize: 14, fontWeight: 500, color: "#6366F1", textDecoration: "none",
        }}>
          {t("auth.login_button", locale)}
        </Link>
      </div>
    );
  }

  if (sp.forgot) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ textAlign: "center" }}>
          <h2 style={{
            margin: 0, fontSize: 24, fontWeight: 800,
            color: "#0A0A0A", letterSpacing: "-0.02em",
          }}>{t("auth.forgot_title", locale)}</h2>
          <p style={{
            marginTop: 8, fontSize: 14, fontWeight: 500, color: "#6B7280",
          }}>
            {t("auth.forgot_desc", locale)}
          </p>
        </div>

        {sp.sent ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <div style={{ fontSize: 48 }}>&#x1F4E7;</div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: "#22C55E" }}>
              {t("auth.forgot_sent", locale)}
            </p>
            <Link href="/login" style={{
              fontSize: 14, fontWeight: 500, color: "#6366F1", textDecoration: "none",
            }}>
              {t("auth.login_button", locale)}
            </Link>
          </div>
        ) : (
          <form action={resetPasswordAction} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{
                fontSize: 12, fontWeight: 700, textTransform: "uppercase",
                color: "#9CA3AF", letterSpacing: "0.15em",
              }}>{t("auth.email_placeholder", locale)}</span>
              <input
                type="email"
                name="email"
                placeholder="you@family.com"
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
            {sp.error && (
              <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "#EF4444" }}>
                {sp.error === "email_required" ? t("auth.email_required", locale) : sp.error}
              </p>
            )}
            <button
              type="submit"
              style={{
                marginTop: 8, height: 48, width: "100%", borderRadius: 10,
                fontSize: 15, fontWeight: 600, color: "#fff",
                background: "#0A0A0A", border: "none", cursor: "pointer",
                letterSpacing: "-0.01em",
                boxShadow: "0 1px 2px rgba(10,10,10,0.04)",
                fontFamily: "inherit",
              }}
            >
              {t("auth.forgot_submit", locale)}
            </button>
            <div style={{ textAlign: "center" }}>
              <Link href="/login" style={{
                fontSize: 14, fontWeight: 500, color: "#6366F1", textDecoration: "none",
              }}>
                {t("auth.login_button", locale)}
              </Link>
            </div>
          </form>
        )}
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
