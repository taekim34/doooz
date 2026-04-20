import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SectionLabel } from "@/components/atoms";
import { TIMEZONES } from "@/lib/timezones";
import { t } from "@/lib/i18n";
import { getAuthLocale } from "@/lib/i18n/auth-locale";

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

async function createFamilyAction(formData: FormData) {
  "use server";
  const locale = await getAuthLocale();
  const name = String(formData.get("name") || "").trim();
  const timezone = String(formData.get("timezone") || "Asia/Seoul");
  const familyLocale = String(formData.get("locale") || locale);
  const displayName = String(formData.get("display_name") || "").trim();
  const customCode = String(formData.get("invite_code") || "").trim().toUpperCase();
  if (!name || !displayName) redirect(`/onboarding/create-family?error=${encodeURIComponent(t("auth.error_required_missing", locale))}`);
  if (customCode && customCode.length < 4) redirect(`/onboarding/create-family?error=${encodeURIComponent(t("auth.error_invite_code_min", locale))}`);

  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  // Idempotency: if this auth user already has a users row, short-circuit.
  const { data: existing } = await supabase
    .from("users")
    .select("id, character_id")
    .eq("id", authUser.id)
    .maybeSingle();
  if (existing) {
    if (existing.character_id) redirect("/");
    redirect("/onboarding/pick-character");
  }

  // Atomic family + owner creation via RPC (avoids RLS chicken-and-egg on SELECT)
  let familyId: string | null = null;
  for (let attempt = 0; attempt < 5 && !familyId; attempt++) {
    const invite = customCode || generateInviteCode();
    const { data, error } = await supabase.rpc("create_family_with_owner", {
      p_name: name,
      p_timezone: timezone,
      p_locale: familyLocale,
      p_invite_code: invite,
      p_display_name: displayName,
    });
    if (!error) familyId = data;
    else {
      console.error("[create-family] attempt", attempt, error.message, error.code);
      if (error.code === "23505") continue; // unique violation — retry with new code
      redirect(`/onboarding/create-family?error=${encodeURIComponent(t("auth.error_family_create_failed", locale))}`);
    }
  }
  if (!familyId) redirect(`/onboarding/create-family?error=${encodeURIComponent(t("auth.error_family_create_failed", locale))}`);

  redirect("/onboarding/pick-character");
}

const inputCls =
  "h-12 w-full rounded-[10px] bg-[color:var(--surface-raised)] border border-[color:var(--border-subtle)] px-4 text-[17px] font-medium text-[color:var(--ink)] outline-none transition-[border-color,background] duration-150";

const hintStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  color: "var(--ink-placeholder)",
  letterSpacing: "0.02em",
};

const selectCls =
  `${inputCls} appearance-none pr-11 cursor-pointer bg-[length:12px_8px] bg-[position:right_16px_center] bg-no-repeat bg-[url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1.5 1.5l4.5 5 4.5-5' stroke='%239CA3AF' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")]`;

const tzLabelKey: Record<string, "label" | "labelJa" | "labelEn"> = {
  ko: "label",
  ja: "labelJa",
  en: "labelEn",
};

export default async function CreateFamilyPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;
  const locale = await getAuthLocale();
  const tzKey = tzLabelKey[locale] ?? "label";

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
      {/* Heading */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <h1
          style={{
            margin: 0,
            fontSize: 24,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: "var(--ink)",
          }}
        >
          {t("auth.create_family", locale)}
        </h1>
        <p
          style={{
            margin: "8px 0 0",
            fontSize: 14,
            fontWeight: 500,
            color: "var(--ink-muted)",
            letterSpacing: "-0.01em",
            lineHeight: 1.5,
          }}
        >
          {t("auth.create_family_sub", locale)}
        </p>
      </div>

      {/* Form */}
      <form
        action={createFamilyAction}
        style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 14 }}
      >
        <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <SectionLabel as="span">{t("auth.family_name_label", locale)}</SectionLabel>
          <input
            type="text"
            name="name"
            autoComplete="organization"
            placeholder={t("auth.family_name_placeholder", locale)}
            required
            maxLength={40}
            className={inputCls}
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <SectionLabel as="span">{t("auth.my_name_label", locale)}</SectionLabel>
          <input
            type="text"
            name="display_name"
            autoComplete="name"
            placeholder={t("auth.my_name_placeholder", locale)}
            required
            maxLength={20}
            className={inputCls}
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <SectionLabel as="span">{t("auth.invite_code_label", locale)}</SectionLabel>
            <span style={hintStyle}>{t("auth.invite_code_optional", locale)}</span>
          </span>
          <input
            type="text"
            name="invite_code"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            placeholder={t("auth.invite_code_example", locale)}
            maxLength={20}
            className={`${inputCls} uppercase tracking-[0.12em]`}
            style={{ fontFeatureSettings: '"tnum" 1' }}
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <SectionLabel as="span">{t("auth.timezone_label", locale)}</SectionLabel>
          <select name="timezone" defaultValue="Asia/Seoul" className={selectCls}>
            {TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz[tzKey]}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <SectionLabel as="span">{t("settings.language", locale)}</SectionLabel>
          <select name="locale" defaultValue={locale} className={selectCls}>
            <option value="ko">한국어</option>
            <option value="en">English</option>
            <option value="ja">日本語</option>
          </select>
        </label>

        {sp.error && (
          <div style={{ color: "var(--error)", fontSize: 14, textAlign: "center", marginTop: 4 }}>
            {sp.error}
          </div>
        )}

        <button
          type="submit"
          style={{
            marginTop: 10,
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
          {t("auth.create_family", locale)}
        </button>
      </form>

      <div
        style={{
          marginTop: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-subtle)" }}>
          {t("auth.already_have_account", locale)}
        </span>
        <Link
          href="/login"
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "var(--accent)",
            textDecoration: "none",
          }}
        >
          {t("auth.login_title", locale)}
        </Link>
      </div>
    </div>
  );
}
