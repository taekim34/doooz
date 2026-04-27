import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/features/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { CharacterIcon } from "@/components/molecules/character-icon";
import { getStage } from "@/lib/level";
import { TimezoneSelect } from "@/components/ui/timezone-select";
import { SubmitButton } from "@/components/ui/submit-button";
import { BackButton, SectionLabel } from "@/components/atoms";
import { ThemeToggle } from "./_theme-toggle";
import { t, type Locale } from "@/lib/i18n";
import { DeleteAccount } from "./_delete-account";
import { DeleteFamily } from "./_delete-family";

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
    const params = new URLSearchParams({
      error_code: "family_exists",
      family_name: familyName,
      timezone,
      locale: localeVal,
    });
    redirect(`/settings?${params.toString()}`);
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
  if (!authUser) return;
  const tone = formData.get("tone") === "cool" ? "cool" : "warm";
  await supabase.from("users").update({ tone }).eq("id", authUser.id);
}

async function updateModeAction(formData: FormData) {
  "use server";
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return;
  const color_mode = formData.get("mode") === "dark" ? "dark" : "light";
  await supabase.from("users").update({ color_mode }).eq("id", authUser.id);
}

async function logoutAction() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

const inputCls = "h-12 w-full rounded-[10px] border border-[color:var(--border)] bg-[color:var(--surface-raised)] px-3.5 text-[17px] font-medium tracking-[-0.01em] text-[color:var(--ink)] outline-none";

const dividerStyle = "h-px bg-[var(--border)] my-6";

const savePillCls = "inline-flex h-8 shrink-0 cursor-pointer items-center justify-center whitespace-nowrap rounded-full border-none bg-[color:var(--accent)] px-3.5 text-[13px] font-semibold tracking-[-0.01em] text-[color:var(--on-accent)]";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    error_code?: string;
    pw_error?: string;
    pw_ok?: string;
    family_name?: string;
    timezone?: string;
    locale?: string;
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
    <div className="relative min-h-screen bg-[color:var(--surface)] text-[color:var(--ink)]">
      {/* Back */}
      <div className="flex items-center px-5 pt-3 pb-2">
        <BackButton href="/" />
      </div>

      <div className="mx-auto max-w-md px-5 pt-1 pb-7">
        <h1 className="mb-[22px] text-2xl font-extrabold tracking-[-0.02em] text-[color:var(--ink)]">
          {t("settings.title", locale)}
        </h1>

        {/* My info */}
        <div>
          <div className="mb-2.5">
            <SectionLabel as="span">{t("settings.change_name", locale)}</SectionLabel>
          </div>
          <form
            action={updateNameAction}
            className="flex items-center gap-2"
          >
            <input
              name="display_name"
              defaultValue={user.display_name}
              required
              className={`${inputCls} min-w-0 flex-1`}
            />
            <SubmitButton className={savePillCls}>
              {t("settings.save", locale)}
            </SubmitButton>
          </form>
        </div>

        <div className={dividerStyle} />

        {/* Character */}
        <div>
          <div className="mb-2.5">
            <SectionLabel as="span">{t("settings.character", locale)}</SectionLabel>
          </div>
          <div className="flex items-center gap-3 px-0.5 py-2.5">
            <CharacterIcon
              id={user.character_id}
              stage={getStage(user.level)}
              pixelSize={66}
              className="shrink-0"
            />
            <div className="min-w-0 flex-1 truncate text-sm font-medium tracking-[-0.01em] text-[color:var(--ink)]">
              {user.display_name}
            </div>
            {user.role === "child" && (
              <Link
                href={"/characters/gallery" as never}
                className="shrink-0 whitespace-nowrap py-1 text-sm font-semibold tracking-[-0.01em] text-[color:var(--accent)] no-underline"
              >
                {t("settings.change_link", locale)} →
              </Link>
            )}
          </div>
        </div>

        {/* Tone & mode toggles (kid only — parent fixed to warm+light) */}
        {user.role === "child" && (
          <>
            <div className={dividerStyle} />
            <div>
              <div className="mb-2.5">
                <SectionLabel as="span">{t("settings.theme_tone", locale)}</SectionLabel>
              </div>
              <ThemeToggle
                name="tone"
                current={user.tone}
                options={[
                  { value: "warm", label: "🌅 Warm" },
                  { value: "cool", label: "🌊 Cool" },
                ]}
                action={updateToneAction}
              />
            </div>

            <div className={dividerStyle} />
            <div>
              <div className="mb-2.5">
                <SectionLabel as="span">{t("settings.color_mode_label", locale)}</SectionLabel>
              </div>
              <ThemeToggle
                name="mode"
                current={user.color_mode}
                options={[
                  { value: "light", label: "☀️ Light" },
                  { value: "dark", label: "🌙 Dark" },
                ]}
                action={updateModeAction}
              />
            </div>
          </>
        )}

        {/* Family settings (parent only) */}
        {user.role === "parent" && (
          <>
            <div className={dividerStyle} />
            <div>
              <div className="mb-2.5 flex items-baseline gap-2">
                <SectionLabel as="span">{t("settings.family", locale)}</SectionLabel>
                {isAdmin && (
                  <span className="whitespace-nowrap text-[10.5px] font-bold uppercase tracking-[0.1em] text-[color:var(--ink-subtle)]">
                    · {t("common.admin", locale)}
                  </span>
                )}
              </div>
              <form
                action={updateFamilyAction}
                className="flex flex-col gap-2"
              >
                <input
                  name="family_name"
                  defaultValue={sp.family_name ?? family.name}
                  required
                  maxLength={40}
                  placeholder={t("settings.family_name", locale)}
                  className={inputCls}
                />
                {sp.error_code === "family_exists" && (
                  <p className="m-0 text-[12px] font-medium text-[color:var(--error)]">
                    {t("settings.error_family_exists", locale)}
                  </p>
                )}
                <TimezoneSelect
                  name="timezone"
                  defaultValue={sp.timezone ?? family.timezone}
                />
                <select
                  name="locale"
                  defaultValue={sp.locale ?? family.locale ?? "ko"}
                  className={`${inputCls} cursor-pointer appearance-none pr-10`}
                  style={{
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
                {sp.error && !sp.error_code && (
                  <p className="m-0 text-[13px] text-[color:var(--error)]">
                    {sp.error}
                  </p>
                )}
                <div className="mt-0.5 flex justify-end">
                  <SubmitButton className={savePillCls}>
                    {t("settings.save", locale)}
                  </SubmitButton>
                </div>
              </form>
            </div>
          </>
        )}

        <div className={dividerStyle} />

        {/* Password */}
        <div>
          <div className="mb-2.5">
            <SectionLabel as="span">{t("settings.password", locale)}</SectionLabel>
          </div>
          <form
            action={changePasswordAction}
            className="flex flex-col gap-2"
          >
            <input
              type="password"
              name="current_password"
              placeholder={t("settings.current_password", locale)}
              required
              className={inputCls}
            />
            <input
              type="password"
              name="new_password"
              placeholder={t("settings.new_password", locale)}
              minLength={6}
              required
              className={inputCls}
            />
            <input
              type="password"
              name="confirm_password"
              placeholder={t("settings.confirm_password", locale)}
              minLength={6}
              required
              className={inputCls}
            />
            {sp.pw_error && (
              <p className="m-0 text-[13px] text-[color:var(--error)]">
                {sp.pw_error}
              </p>
            )}
            {sp.pw_ok && (
              <p className="m-0 text-[13px] text-[color:var(--success)]">
                {sp.pw_ok}
              </p>
            )}
            <SubmitButton
              className="mt-0.5 h-10 cursor-pointer self-end rounded-[10px] border-none bg-[color:var(--ink)] px-[18px] text-sm font-bold tracking-[-0.01em] text-[color:var(--on-accent)]"
            >
              {t("settings.change_button", locale)}
            </SubmitButton>
          </form>
        </div>

        <div className={dividerStyle} />

        {/* Account */}
        <div>
          <div className="mb-2.5">
            <SectionLabel as="span">
              {t("common.account", locale)}
            </SectionLabel>
          </div>
          <form action={logoutAction}>
            <SubmitButton
              className="block w-full cursor-pointer border-none bg-transparent py-2.5 text-left text-sm font-semibold tracking-[-0.01em] text-[color:var(--ink)]"
            >
              {t("settings.logout", locale)}
            </SubmitButton>
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
