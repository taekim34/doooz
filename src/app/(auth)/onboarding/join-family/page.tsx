import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SectionLabel } from "@/components/atoms";
import { t } from "@/lib/i18n";
import { getAuthLocale } from "@/lib/i18n/auth-locale";

async function joinAction(formData: FormData) {
  "use server";
  const locale = await getAuthLocale();
  const familyName = String(formData.get("family_name") || "").trim();
  const displayName = String(formData.get("display_name") || "").trim();
  const inviteCode = String(formData.get("invite_code") || "").trim();
  const role = String(formData.get("role") || "child") === "parent" ? "parent" : "child";
  if (!familyName || !displayName || !inviteCode) redirect(`/onboarding/join-family?error=${encodeURIComponent(t("auth.error_input", locale))}`);

  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  // WHY: admin required — joining a family requires reading another family's invite code, which RLS blocks
  const admin = createAdminClient();
  const { data: fam } = await admin
    .from("families")
    .select("id")
    .eq("name", familyName)
    .eq("invite_code", inviteCode)
    .maybeSingle();
  if (!fam) redirect(`/onboarding/join-family?error=${encodeURIComponent(t("auth.error_invite_mismatch", locale))}`);

  const { error: uerr } = await admin.from("users").insert({
    id: authUser.id,
    family_id: fam!.id,
    role,
    display_name: displayName,
  });
  if (uerr) redirect(`/onboarding/join-family?error=${encodeURIComponent(t("auth.error_join_failed", locale))}`);

  redirect("/onboarding/pick-character");
}

const inputCls =
  "h-12 w-full rounded-[10px] bg-[color:var(--surface-raised)] border border-[color:var(--border-subtle)] px-4 text-[17px] font-medium text-[color:var(--ink)] outline-none transition-[border-color,background] duration-150";

const selectCls =
  `${inputCls} appearance-none pr-11 cursor-pointer bg-[length:12px_8px] bg-[position:right_16px_center] bg-no-repeat bg-[url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1.5 1.5l4.5 5 4.5-5' stroke='%239CA3AF' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")]`;

export default async function JoinFamilyPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;
  const locale = await getAuthLocale();

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
          {t("auth.join_family", locale)}
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
          {t("auth.join_family_sub", locale)}
        </p>
      </div>

      {/* Form */}
      <form
        action={joinAction}
        style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 14 }}
      >
        <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <SectionLabel as="span">{t("auth.family_name_label", locale)}</SectionLabel>
          <input
            type="text"
            name="family_name"
            autoComplete="organization"
            placeholder={t("auth.family_name_placeholder", locale)}
            required
            maxLength={40}
            className={inputCls}
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <SectionLabel as="span">{t("auth.invite_code_label", locale)}</SectionLabel>
          <input
            type="text"
            name="invite_code"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            placeholder={t("auth.invite_code_placeholder", locale)}
            required
            maxLength={20}
            className={`${inputCls} uppercase tracking-[0.12em]`}
            style={{ fontFeatureSettings: '"tnum" 1' }}
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
          <SectionLabel as="span">{t("auth.role_label", locale)}</SectionLabel>
          <select name="role" defaultValue="child" className={selectCls}>
            <option value="child">{t("auth.role_child", locale)}</option>
            <option value="parent">{t("auth.role_parent", locale)}</option>
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
          {t("auth.join_submit", locale)}
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
          {t("auth.first_time_create", locale)}
        </span>
        <Link
          href="/signup"
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "var(--accent)",
            textDecoration: "none",
          }}
        >
          {t("auth.email_signup", locale)}
        </Link>
      </div>
    </div>
  );
}
