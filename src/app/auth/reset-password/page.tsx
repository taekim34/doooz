import { redirect } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { t, type Locale } from "@/lib/i18n";
import { SubmitButton } from "@/components/ui/submit-button";

async function updatePasswordAction(formData: FormData) {
  "use server";
  const password = String(formData.get("password") || "");
  const confirm = String(formData.get("confirm") || "");

  if (password.length < 6) {
    redirect("/auth/reset-password?error=password_min");
  }
  if (password !== confirm) {
    redirect("/auth/reset-password?error=password_mismatch");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    redirect(`/auth/reset-password?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/");
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=recovery_session_expired");
  }

  const cookieStore = await cookies();
  const locale = (cookieStore.get("doooz_locale")?.value || "ko") as Locale;

  const errorMsg = sp.error === "password_min"
    ? t("settings.error_password_min", locale)
    : sp.error === "password_mismatch"
    ? t("settings.error_password_mismatch", locale)
    : sp.error
    ? decodeURIComponent(sp.error)
    : null;

  return (
    <main
      data-role="parent" data-theme="warm"
      className="relative flex min-h-[100dvh] items-center justify-center overflow-auto bg-[color:var(--surface)] px-7"
    >
      <div className="w-full max-w-[440px] flex flex-col gap-6">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="text-[64px] leading-none">&#x1F511;</div>
          <h2 className="m-0 text-2xl font-extrabold text-[color:var(--ink)] tracking-[-0.02em]">
            {t("settings.password", locale)}
          </h2>
        </div>

        <form action={updatePasswordAction} className="flex flex-col gap-4">
          <input
            type="password"
            name="password"
            placeholder={t("settings.new_password", locale)}
            minLength={6}
            required
            className="h-12 w-full rounded-[10px] px-4 outline-none bg-[color:var(--surface-raised)] border border-[color:var(--border-subtle)] text-[17px] font-medium text-[color:var(--ink)] box-border"
          />
          <input
            type="password"
            name="confirm"
            placeholder={t("settings.confirm_password", locale)}
            minLength={6}
            required
            className="h-12 w-full rounded-[10px] px-4 outline-none bg-[color:var(--surface-raised)] border border-[color:var(--border-subtle)] text-[17px] font-medium text-[color:var(--ink)] box-border"
          />
          {errorMsg && (
            <p className="m-0 text-[13px] font-medium text-[color:var(--error)]">{errorMsg}</p>
          )}
          <SubmitButton
            className="h-12 w-full rounded-[10px] text-[15px] font-semibold text-[color:var(--on-accent)] bg-[color:var(--ink)] border-none cursor-pointer tracking-[-0.01em] disabled:opacity-70"
            style={{ boxShadow: "var(--shadow-card-parent)" }}
          >
            {t("settings.password", locale)}
          </SubmitButton>
          <div className="text-center">
            <Link href="/login" className="text-sm font-medium text-[color:var(--accent)] no-underline">
              {t("auth.forgot_return_login", locale)}
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
