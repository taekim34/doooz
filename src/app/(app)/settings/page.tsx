import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/features/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { characterEmoji } from "@/features/characters/emoji-map";
import { getStage } from "@/lib/level";
import { TimezoneSelect } from "@/components/ui/timezone-select";
import { BackButton, SectionLabel } from "@/components/atoms";
import { t, type Locale } from "@/lib/i18n";
import { DeleteAccount } from "./_delete-account";
import { DeleteFamily } from "./_delete-family";

const ACCENT = "var(--accent)";
const INK = "var(--ink)";

async function updateNameAction(formData: FormData) {
  "use server";
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");
  const display_name = String(formData.get("display_name") || "").trim();
  if (display_name) {
    await supabase
      .from("users")
      .update({ display_name })
      .eq("id", authUser.id);
  }
  redirect("/settings");
}

async function updateFamilyAction(formData: FormData) {
  "use server";
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");
  const { data: me } = await supabase
    .from("users")
    .select("family_id, role")
    .eq("id", authUser.id)
    .single();
  if (!me || me.role !== "parent") redirect("/settings");

  const familyName = String(formData.get("family_name") || "").trim();
  const timezone = String(formData.get("timezone") || "Asia/Seoul");
  const localeVal = String(formData.get("locale") || "ko");
  const familyId = me.family_id;

  const { error } = await supabase
    .from("families")
    .update({ name: familyName || undefined, timezone, locale: localeVal })
    .eq("id", familyId);
  if (error?.code === "23505") {
    redirect(
      `/settings?error=${encodeURIComponent(t("settings.error_family_exists"))}`,
    );
  }
  redirect("/settings");
}

async function changePasswordAction(formData: FormData) {
  "use server";
  const currentPassword = String(formData.get("current_password") || "");
  const newPassword = String(formData.get("new_password") || "");
  const confirmPassword = String(formData.get("confirm_password") || "");

  const redirectWith = (msg: string) =>
    redirect(`/settings?pw_error=${encodeURIComponent(msg)}`);
  const redirectOk = (msg: string) =>
    redirect(`/settings?pw_ok=${encodeURIComponent(msg)}`);

  if (!currentPassword || !newPassword || !confirmPassword)
    redirectWith(t("settings.error_all_required"));
  if (newPassword.length < 6)
    redirectWith(t("settings.error_password_min"));
  if (newPassword !== confirmPassword)
    redirectWith(t("settings.error_password_mismatch"));

  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  if (!authUser.email) redirectWith(t("settings.error_account_not_found"));

  const { error: verifyErr } = await supabase.auth.signInWithPassword({
    email: authUser.email!,
    password: currentPassword,
  });
  if (verifyErr) redirectWith(t("settings.error_wrong_password"));

  const { error: updateErr } = await supabase.auth.updateUser({
    password: newPassword,
  });
  if (updateErr) redirectWith(updateErr.message);

  redirectOk(t("settings.password_changed"));
}

async function updateToneAction(formData: FormData) {
  "use server";
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");
  const tone = formData.get("tone") === "cool" ? "cool" : "warm";
  await supabase.from("users").update({ tone }).eq("id", authUser.id);
  redirect("/settings");
}

async function logoutAction() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

const inputStyle: React.CSSProperties = {
  height: 48,
  padding: "0 14px",
  borderRadius: 10,
  background: "var(--surface-raised)",
  border: "1px solid var(--border)",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
  fontSize: 17,
  fontWeight: 500,
  color: INK,
  letterSpacing: "-0.01em",
};


const dividerStyle = "h-px bg-[var(--border)] my-6";

const savePillStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  height: 32,
  padding: "0 14px",
  borderRadius: 9999,
  background: ACCENT,
  color: "var(--on-accent)",
  border: "none",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: "-0.01em",
  whiteSpace: "nowrap",
  flexShrink: 0,
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    pw_error?: string;
    pw_ok?: string;
  }>;
}) {
  const sp = await searchParams;
  const { user, family } = await requireUser();
  const locale = (family.locale || "ko") as Locale;

  // Determine if current user is the family admin
  const supabaseForAdmin = await createClient();
  const { data: earliestParent } = await supabaseForAdmin
    .from("users")
    .select("id")
    .eq("family_id", family.id)
    .eq("role", "parent")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();
  const isAdmin = earliestParent?.id === user.id;

  return (
    <div
      className="relative min-h-screen"
      style={{
        background: "var(--surface)",
        color: INK,
      }}
    >
      {/* Back */}
      <div
        style={{
          padding: "12px 20px 8px",
          display: "flex",
          alignItems: "center",
        }}
      >
        <BackButton href="/" />
      </div>

      <div className="mx-auto max-w-md" style={{ padding: "4px 20px 28px" }}>
        <h1
          style={{
            margin: "0 0 22px",
            fontSize: 24,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: INK,
          }}
        >
          {t("settings.title", locale)}
        </h1>

        {/* My info */}
        <div>
          <div style={{ marginBottom: 10 }}>
            <SectionLabel as="span">{t("settings.change_name", locale)}</SectionLabel>
          </div>
          <form
            action={updateNameAction}
            style={{ display: "flex", gap: 8, alignItems: "center" }}
          >
            <input
              name="display_name"
              defaultValue={user.display_name}
              required
              style={{ ...inputStyle, flex: 1, minWidth: 0 }}
            />
            <button type="submit" style={savePillStyle}>
              {t("settings.save", locale)}
            </button>
          </form>
        </div>

        <div className={dividerStyle} />

        {/* Character */}
        <div>
          <div style={{ marginBottom: 10 }}>
            <SectionLabel as="span">{t("settings.character", locale)}</SectionLabel>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 2px",
            }}
          >
            <span
              aria-hidden
              style={{ fontSize: 32, lineHeight: 1, flexShrink: 0 }}
            >
              {characterEmoji(user.character_id, getStage(user.level))}
            </span>
            <div
              style={{
                flex: 1,
                minWidth: 0,
                fontSize: 14,
                fontWeight: 500,
                color: INK,
                letterSpacing: "-0.01em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {user.display_name}
            </div>
            {user.role === "child" && (
              <Link
                href={"/characters/gallery" as never}
                style={{

                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--accent)",
                  letterSpacing: "-0.01em",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  padding: "4px 0",
                  textDecoration: "none",
                }}
              >
                {t("settings.change_link", locale)} →
              </Link>
            )}
          </div>
        </div>

        {/* Tone toggle (kid only) */}
        {user.role === "child" && (
          <>
            <div className={dividerStyle} />
            <div>
              <div style={{ marginBottom: 10 }}>
                <SectionLabel as="span">배경 톤</SectionLabel>
              </div>
              <form action={updateToneAction}>
                <div
                  style={{
                    display: "inline-flex",
                    background: "var(--border)",
                    borderRadius: 9999,
                    padding: 3,
                    gap: 2,
                  }}
                >
                  {(["warm", "cool"] as const).map((v) => {
                    const on = user.tone === v;
                    return (
                      <button
                        key={v}
                        type="submit"
                        name="tone"
                        value={v}
                        style={{
                          padding: "8px 20px",
                          borderRadius: 9999,
                          border: "none",
                          cursor: "pointer",
        
                          fontSize: 13,
                          fontWeight: on ? 700 : 500,
                          letterSpacing: "-0.01em",
                          background: on ? "var(--surface)" : "transparent",
                          color: on ? INK : "var(--ink-subtle)",
                          boxShadow: on ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                          transition: "all 200ms",
                        }}
                      >
                        {v === "warm" ? "🌅 Warm" : "🌊 Cool"}
                      </button>
                    );
                  })}
                </div>
              </form>
            </div>
          </>
        )}

        {/* Family settings (parent only) */}
        {user.role === "parent" && (
          <>
            <div className={dividerStyle} />
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 8,
                  marginBottom: 10,
                }}
              >
                <SectionLabel as="span">{t("settings.family", locale)}</SectionLabel>
                {isAdmin && (
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      color: "var(--ink-subtle)",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      whiteSpace: "nowrap",
                    }}
                  >
                    ·{" "}
                    {locale === "ko"
                      ? "관리자"
                      : locale === "ja"
                        ? "管理者"
                        : "Admin"}
                  </span>
                )}
              </div>
              <form
                action={updateFamilyAction}
                style={{ display: "flex", flexDirection: "column", gap: 8 }}
              >
                <input
                  name="family_name"
                  defaultValue={family.name}
                  required
                  maxLength={40}
                  placeholder={t("settings.family_name", locale)}
                  style={inputStyle}
                />
                <TimezoneSelect
                  name="timezone"
                  defaultValue={family.timezone}
                />
                <select
                  name="locale"
                  defaultValue={family.locale || "ko"}
                  style={{
                    ...inputStyle,
                    appearance: "none",
                    paddingRight: 40,
                    cursor: "pointer",
                    backgroundImage:
                      'url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 6l5 5 5-5" stroke="%236B7280" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>\')',
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 14px center",
                  }}
                >
                  <option value="ko">한국어</option>
                  <option value="ja">日本語</option>
                  <option value="en">English</option>
                </select>
                {sp.error && (
                  <p
                    style={{
                      fontSize: 13,
                      color: "var(--error)",
                      margin: 0,
                    }}
                  >
                    {sp.error}
                  </p>
                )}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginTop: 2,
                  }}
                >
                  <button type="submit" style={savePillStyle}>
                    {t("settings.save", locale)}
                  </button>
                </div>
              </form>
            </div>
          </>
        )}

        <div className={dividerStyle} />

        {/* Password */}
        <div>
          <div style={{ marginBottom: 10 }}>
            <SectionLabel as="span">{t("settings.password", locale)}</SectionLabel>
          </div>
          <form
            action={changePasswordAction}
            style={{ display: "flex", flexDirection: "column", gap: 8 }}
          >
            <input
              type="password"
              name="current_password"
              placeholder={t("settings.current_password", locale)}
              required
              style={inputStyle}
            />
            <input
              type="password"
              name="new_password"
              placeholder={t("settings.new_password", locale)}
              minLength={6}
              required
              style={inputStyle}
            />
            <input
              type="password"
              name="confirm_password"
              placeholder={t("settings.confirm_password", locale)}
              minLength={6}
              required
              style={inputStyle}
            />
            {sp.pw_error && (
              <p style={{ fontSize: 13, color: "var(--error)", margin: 0 }}>
                {sp.pw_error}
              </p>
            )}
            {sp.pw_ok && (
              <p style={{ fontSize: 13, color: "var(--success)", margin: 0 }}>
                {sp.pw_ok}
              </p>
            )}
            <button
              type="submit"
              style={{
                alignSelf: "flex-end",
                height: 40,
                padding: "0 18px",
                borderRadius: 10,
                border: "none",
                background: INK,
                color: "var(--on-accent)",

                fontSize: 14,
                fontWeight: 700,
                letterSpacing: "-0.01em",
                cursor: "pointer",
                marginTop: 2,
              }}
            >
              {t("settings.change_button", locale)}
            </button>
          </form>
        </div>

        <div className={dividerStyle} />

        {/* Account */}
        <div>
          <div style={{ marginBottom: 10 }}>
            <SectionLabel as="span">
              {locale === "ko" ? "계정" : locale === "ja" ? "アカウント" : "Account"}
            </SectionLabel>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",

                fontSize: 14,
                fontWeight: 600,
                color: INK,
                letterSpacing: "-0.01em",
                padding: "10px 0",
                textAlign: "left",
                display: "block",
                width: "100%",
              }}
            >
              {t("settings.logout", locale)}
            </button>
          </form>
          {isAdmin ? (
            <DeleteFamily locale={locale} />
          ) : (
            <DeleteAccount locale={locale} />
          )}
        </div>
      </div>
    </div>
  );
}
