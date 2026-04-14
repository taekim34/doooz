import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FamilyNameInput } from "../join/_family-name-input";
import { LoginTabs } from "./_login-tabs";
import { t } from "@/lib/i18n";
import { getAuthLocale } from "@/lib/i18n/auth-locale";

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
  searchParams: Promise<{ error?: string; tab?: string; need_confirm?: string }>;
}) {
  const sp = await searchParams;
  const locale = await getAuthLocale();

  if (sp.need_confirm) {
    return (
      <Card>
        <CardContent className="space-y-6 p-8 text-center">
          <div className="text-5xl">📧</div>
          <div>
            <h2 className="text-xl font-bold">{t("auth.email_not_confirmed_title", locale)}</h2>
            <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{t("auth.email_not_confirmed_desc", locale)}</p>
          </div>
          <Link href="/login" className="inline-block text-sm text-primary underline">
            {t("auth.login_button", locale)}
          </Link>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("auth.login_title", locale)}</CardTitle>
      </CardHeader>
      <CardContent>
        <LoginTabs defaultTab={sp.tab === "email" ? "email" : "family"}>
          {/* Family login (default) */}
          <form data-tab="family" action={familyLoginAction} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">{t("auth.family_name_label", locale)}</label>
              <FamilyNameInput />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{t("auth.my_name_label", locale)}</label>
              <Input name="display_name" placeholder={t("auth.my_name_placeholder", locale)} required />
            </div>
            <Input type="password" name="password" placeholder={t("auth.password", locale)} required />
            {sp.tab !== "email" && sp.error && (
              <p className="text-sm text-destructive">{sp.error}</p>
            )}
            <Button type="submit" className="w-full">{t("auth.login_button", locale)}</Button>
          </form>

          {/* Email login */}
          <form data-tab="email" action={emailLoginAction} className="space-y-4">
            <Input type="email" name="email" placeholder={t("auth.email_placeholder", locale)} required />
            <Input type="password" name="password" placeholder={t("auth.password", locale)} required />
            {sp.tab === "email" && sp.error && (
              <p className="text-sm text-destructive">{sp.error}</p>
            )}
            <Button type="submit" className="w-full">{t("auth.login_button", locale)}</Button>
          </form>
        </LoginTabs>

        <div className="mt-4 space-y-2 text-center text-sm text-muted-foreground">
          <p>
            {t("auth.first_time", locale)}{" "}
            <Link href="/join" className="text-primary underline">
              {t("auth.join_family", locale)}
            </Link>
            {" · "}
            <Link href="/signup" className="text-primary underline">
              {t("auth.signup_create_link", locale)}
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
