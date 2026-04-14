import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { t } from "@/lib/i18n";
import { getAuthLocale } from "@/lib/i18n/auth-locale";

async function signupAction(formData: FormData) {
  "use server";
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const mode = String(formData.get("mode") || "create"); // 'create' | 'join'
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }
  // If email confirmation is required, session won't exist yet
  if (data?.user && !data.session) {
    redirect("/signup?confirm=1");
  }
  // If email confirmation is disabled (local dev), a session will be active; go to onboarding.
  redirect(mode === "join" ? "/onboarding/join-family" : "/onboarding/create-family");
}

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; confirm?: string }>;
}) {
  const sp = await searchParams;
  const locale = await getAuthLocale();

  if (sp.confirm) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>📧 {t("auth.check_email_title", locale)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">{t("auth.check_email_desc", locale)}</p>
          <Link href="/login" className="text-sm text-primary underline">
            {t("auth.login_title", locale)}
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("auth.signup_title", locale)}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={signupAction} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t("auth.signup_desc", locale)}
          </p>
          <Input type="email" name="email" placeholder={t("auth.email_placeholder", locale)} required />
          <Input type="password" name="password" placeholder={t("auth.password_min", locale)} minLength={6} required />
          <input type="hidden" name="mode" value="create" />
          {sp.error && <p className="text-sm text-destructive">{sp.error}</p>}
          <Button type="submit" className="w-full">
            {t("auth.signup_button", locale)}
          </Button>
        </form>
        <div className="mt-4 space-y-2 text-center text-sm text-muted-foreground">
          <p>
            {t("auth.already_have_account", locale)}{" "}
            <Link href="/login" className="text-primary underline">
              {t("auth.login_title", locale)}
            </Link>
          </p>
          <p>
            {t("auth.have_invite_code", locale)}{" "}
            <Link href="/join" className="text-primary underline">
              {t("auth.join_with_code", locale)}
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
