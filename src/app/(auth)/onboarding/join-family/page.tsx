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
    <div className="flex flex-col w-full">
      {/* Heading */}
      <div className="flex flex-col items-center text-center">
        <h1 className="m-0 text-2xl font-extrabold tracking-[-0.02em] text-[color:var(--ink)]">
          {t("auth.join_family", locale)}
        </h1>
        <p className="mt-2 mb-0 text-sm font-medium text-[color:var(--ink-muted)] tracking-[-0.01em] leading-[1.5]">
          {t("auth.join_family_sub", locale)}
        </p>
      </div>

      {/* Form */}
      <form
        action={joinAction}
        className="mt-7 flex flex-col gap-[14px]"
      >
        <label className="flex flex-col gap-2">
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

        <label className="flex flex-col gap-2">
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
          <SectionLabel as="span">{t("auth.role_label", locale)}</SectionLabel>
          <select name="role" defaultValue="child" className={selectCls}>
            <option value="child">{t("auth.role_child", locale)}</option>
            <option value="parent">{t("auth.role_parent", locale)}</option>
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
          {t("auth.join_submit", locale)}
        </button>
      </form>

      <div className="mt-6 flex items-center justify-center gap-[6px]">
        <span className="text-[13px] font-medium text-[color:var(--ink-subtle)]">
          {t("auth.first_time_create", locale)}
        </span>
        <Link
          href="/signup"
          className="text-[13px] font-bold text-[color:var(--accent)] no-underline"
        >
          {t("auth.email_signup", locale)}
        </Link>
      </div>
    </div>
  );
}
