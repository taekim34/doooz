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

const hintCls = "text-[11px] font-medium text-[color:var(--ink-placeholder)] tracking-[0.02em]";

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
    <div className="flex flex-col w-full">
      {/* Heading */}
      <div className="flex flex-col items-center text-center">
        <h1 className="m-0 text-2xl font-extrabold tracking-[-0.02em] text-[color:var(--ink)]">
          {t("auth.create_family", locale)}
        </h1>
        <p className="mt-2 mb-0 text-sm font-medium text-[color:var(--ink-muted)] tracking-[-0.01em] leading-[1.5]">
          {t("auth.create_family_sub", locale)}
        </p>
      </div>

      {/* Form */}
      <form
        action={createFamilyAction}
        className="mt-7 flex flex-col gap-[14px]"
      >
        <label className="flex flex-col gap-2">
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

        <label className="flex flex-col gap-2">
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

        <label className="flex flex-col gap-2">
          <span className="flex items-baseline gap-2">
            <SectionLabel as="span">{t("auth.invite_code_label", locale)}</SectionLabel>
            <span className={hintCls}>{t("auth.invite_code_optional", locale)}</span>
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

        <label className="flex flex-col gap-2">
          <SectionLabel as="span">{t("auth.timezone_label", locale)}</SectionLabel>
          <select name="timezone" defaultValue="Asia/Seoul" className={selectCls}>
            {TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz[tzKey]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <SectionLabel as="span">{t("settings.language", locale)}</SectionLabel>
          <select name="locale" defaultValue={locale} className={selectCls}>
            <option value="ko">한국어</option>
            <option value="en">English</option>
            <option value="ja">日本語</option>
          </select>
        </label>

        {sp.error && (
          <div className="text-[color:var(--error)] text-sm text-center mt-1">
            {sp.error}
          </div>
        )}

        <button
          type="submit"
          className="mt-[10px] h-12 w-full rounded-[10px] text-[15px] font-bold text-[color:var(--on-accent)] bg-[color:var(--ink)] border-none cursor-pointer tracking-[-0.01em]"
          style={{ boxShadow: "0 1px 2px rgba(10,10,10,0.04), 0 12px 28px -16px rgba(10,10,10,0.4)" }}
        >
          {t("auth.create_family", locale)}
        </button>
      </form>

      <div className="mt-6 flex items-center justify-center gap-[6px]">
        <span className="text-[13px] font-medium text-[color:var(--ink-subtle)]">
          {t("auth.already_have_account", locale)}
        </span>
        <Link
          href="/login"
          className="text-[13px] font-bold text-[color:var(--accent)] no-underline"
        >
          {t("auth.login_title", locale)}
        </Link>
      </div>
    </div>
  );
}
