import { randomUUID } from "node:crypto";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Route } from "next";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SectionLabel } from "@/components/atoms";
import { FamilyNameInput } from "./_family-name-input";
import { SubmitButton } from "@/components/ui/submit-button";
import { t } from "@/lib/i18n";
import { getAuthLocale } from "@/lib/i18n/auth-locale";

// Children often don't have an email address. This route creates a Supabase
// auth user with a synthetic email under a reserved domain so we still get a
// real session + RLS while the child only sees nickname + PIN. email_confirm
// is forced true via the admin API so no verification email is ever sent.

function syntheticEmail(familyId: string): string {
  const shortId = randomUUID().replace(/-/g, "").slice(0, 10);
  const domain = process.env.NEXT_PUBLIC_SYNTHETIC_EMAIL_DOMAIN || "dooooz.invalid";
  return `kid-${shortId}@${familyId}.${domain}`;
}

async function joinAction(formData: FormData) {
  "use server";
  const locale = await getAuthLocale();

  const displayName = String(formData.get("display_name") || "").trim();
  const pin = String(formData.get("pin") || "");
  const familyName = String(formData.get("family_name") || "").trim();
  const inviteCode = String(formData.get("invite_code") || "").trim();
  const role =
    String(formData.get("role") || "child") === "parent" ? "parent" : "child";

  const preserve = new URLSearchParams({
    family_name: familyName,
    invite_code: inviteCode,
    display_name: displayName,
    role,
  });
  const redirectWith = (code: string) =>
    redirect(`/join?error_code=${code}&${preserve.toString()}` as Route);
  const redirectWithText = (msg: string) =>
    redirect(`/join?error=${encodeURIComponent(msg)}&${preserve.toString()}` as Route);

  if (!familyName) redirectWith("family_name_required");
  if (!inviteCode) redirectWith("invite_code_required");
  if (!displayName) redirectWith("name_required");
  if (pin.length < 6) redirectWith("password_min");

  // WHY: admin required — invite link join needs cross-family lookup before user has a family_id
  const admin = createAdminClient();

  // 1. Look up the family by name + invite code (both must match).
  const { data: fam } = await admin
    .from("families")
    .select("id")
    .eq("name", familyName)
    .eq("invite_code", inviteCode)
    .maybeSingle();
  if (!fam) redirectWith("invite_mismatch");

  // 2. Create the auth user with a synthetic email, pre-confirmed.
  const familyId = fam!.id;
  const email = syntheticEmail(familyId);
  const { data: created, error: createErr } = await admin.auth.admin.createUser(
    {
      email,
      password: pin,
      email_confirm: true,
      user_metadata: { display_name: displayName, role, family_name: familyName },
    },
  );
  if (createErr || !created?.user) {
    redirectWithText(createErr?.message ?? t("auth.signup_failed", locale));
  }

  const newUserId = created!.user!.id;

  // 3. Insert the public.users row with family scope and role.
  const { error: insertErr } = await admin.from("users").insert({
    id: newUserId,
    family_id: familyId,
    role,
    display_name: displayName,
  });
  if (insertErr) {
    // Roll back the auth user so the next attempt doesn't collide.
    await admin.auth.admin.deleteUser(newUserId);
    redirectWithText(insertErr.message);
  }

  // 4. Establish a browser session by signing in with the same synthetic
  //    email + PIN. The server client persists cookies via @supabase/ssr.
  const supabase = await createClient();
  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email,
    password: pin,
  });
  if (signInErr) {
    redirectWithText(signInErr.message);
  }

  redirect("/onboarding/pick-character");
}

const inputCls =
  "h-12 w-full rounded-[10px] bg-[color:var(--surface-raised)] border border-[color:var(--border-subtle)] px-4 text-[17px] font-medium text-[color:var(--ink)] outline-none transition-[border-color,background] duration-150";

const selectCls =
  `${inputCls} appearance-none pr-11 cursor-pointer bg-[length:12px_8px] bg-[position:right_16px_center] bg-no-repeat bg-[url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1.5 1.5l4.5 5 4.5-5' stroke='%239CA3AF' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")]`;

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    error_code?: string;
    family_name?: string;
    invite_code?: string;
    display_name?: string;
    role?: string;
  }>;
}) {
  const sp = await searchParams;
  const locale = await getAuthLocale();

  const fieldError = (codes: string[]) =>
    sp.error_code && codes.includes(sp.error_code) ? errMsg(sp.error_code) : null;
  function errMsg(code: string): string {
    switch (code) {
      case "family_name_required": return t("auth.error_family_name_required", locale);
      case "invite_code_required": return t("auth.error_invite_code_required", locale);
      case "name_required": return t("auth.error_name_required", locale);
      case "password_min": return t("auth.error_password_min", locale);
      case "invite_mismatch": return t("auth.error_invite_mismatch", locale);
      default: return "";
    }
  }
  const inlineFamily = fieldError(["family_name_required"]);
  const inlineInvite = fieldError(["invite_code_required", "invite_mismatch"]);
  const inlineName = fieldError(["name_required"]);
  const inlinePin = fieldError(["password_min"]);

  return (
    <div className="flex flex-col w-full">
      <div className="flex flex-col items-center text-center">
        <h1 className="m-0 text-2xl font-extrabold text-[color:var(--ink)] tracking-[-0.02em]">
          {t("auth.join_family", locale)}
        </h1>
        <p className="mt-2 mb-0 text-sm font-medium text-[color:var(--ink-muted)] tracking-[-0.01em] leading-[1.5]">
          {t("auth.join_family_sub", locale)}
        </p>
      </div>

      <form
        action={joinAction}
        className="mt-7 flex flex-col gap-[14px]"
      >
        <label className="flex flex-col gap-2">
          <SectionLabel as="span">{t("auth.family_name_label", locale)}</SectionLabel>
          <FamilyNameInput defaultValue={sp.family_name} placeholder={t("auth.family_name_placeholder", locale)} />
          {inlineFamily && (
            <p className="m-0 text-[12px] font-medium text-[color:var(--error)]">{inlineFamily}</p>
          )}
        </label>

        <label className="flex flex-col gap-2">
          <SectionLabel as="span">{t("auth.invite_code_label", locale)}</SectionLabel>
          <input
            name="invite_code"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            placeholder={t("auth.invite_code_placeholder", locale)}
            defaultValue={sp.invite_code || ""}
            required
            maxLength={20}
            className={`${inputCls} uppercase tracking-[0.12em]`}
            style={{ fontFeatureSettings: '"tnum" 1' }}
          />
          {inlineInvite && (
            <p className="m-0 text-[12px] font-medium text-[color:var(--error)]">{inlineInvite}</p>
          )}
        </label>

        <label className="flex flex-col gap-2">
          <SectionLabel as="span">{t("auth.my_name_label", locale)}</SectionLabel>
          <input
            name="display_name"
            autoComplete="name"
            placeholder={t("auth.my_name_placeholder", locale)}
            defaultValue={sp.display_name || ""}
            required
            maxLength={20}
            className={inputCls}
          />
          {inlineName && (
            <p className="m-0 text-[12px] font-medium text-[color:var(--error)]">{inlineName}</p>
          )}
        </label>

        <label className="flex flex-col gap-2">
          <SectionLabel as="span">{t("auth.password", locale)}</SectionLabel>
          <input
            type="password"
            name="pin"
            autoComplete="new-password"
            placeholder={t("auth.password_min", locale)}
            minLength={6}
            required
            className={inputCls}
          />
          {inlinePin && (
            <p className="m-0 text-[12px] font-medium text-[color:var(--error)]">{inlinePin}</p>
          )}
        </label>

        <label className="flex flex-col gap-2">
          <SectionLabel as="span">{t("auth.role_label", locale)}</SectionLabel>
          <select name="role" defaultValue={sp.role === "parent" ? "parent" : "child"} className={selectCls}>
            <option value="child">{t("auth.role_child", locale)}</option>
            <option value="parent">{t("auth.role_parent", locale)}</option>
          </select>
        </label>

        {sp.error && (
          <div className="text-[color:var(--error)] text-sm text-center mt-1">
            {sp.error}
          </div>
        )}

        <SubmitButton
          className="mt-[10px] h-12 w-full rounded-[10px] text-[15px] font-bold text-[color:var(--on-accent)] bg-[color:var(--ink)] border-none cursor-pointer tracking-[-0.01em] disabled:opacity-70"
          style={{ boxShadow: "0 1px 2px rgba(10,10,10,0.04), 0 12px 28px -16px rgba(10,10,10,0.4)" }}
        >
          {t("auth.join_submit", locale)}
        </SubmitButton>
      </form>

      <div className="mt-6 text-center">
        <div className="flex items-center justify-center gap-[6px]">
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
        <p className="mt-3 mb-0">
          <Link
            href="/privacy"
            className="text-[13px] font-medium text-[color:var(--ink-muted)] no-underline"
          >
            {t("privacy.link", locale)}
          </Link>
        </p>
      </div>
    </div>
  );
}
