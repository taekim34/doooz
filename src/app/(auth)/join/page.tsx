import { randomUUID } from "node:crypto";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FamilyNameInput } from "./_family-name-input";
import { t } from "@/lib/i18n";
import { getAuthLocale } from "@/lib/i18n/auth-locale";

// Children often don't have an email address. This route creates a Supabase
// auth user with a synthetic email under a reserved domain so we still get a
// real session + RLS while the child only sees nickname + PIN. email_confirm
// is forced true via the admin API so no verification email is ever sent.

function syntheticEmail(familyId: string): string {
  const shortId = randomUUID().replace(/-/g, "").slice(0, 10);
  return `kid-${shortId}@${familyId}.dooooz.kid`;
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

  const redirectWith = (msg: string) =>
    redirect(`/join?error=${encodeURIComponent(msg)}&family_name=${encodeURIComponent(familyName)}`);

  if (!familyName) redirectWith(t("auth.error_family_name_required", locale));
  if (!inviteCode) redirectWith(t("auth.error_invite_code_required", locale));
  if (!displayName) redirectWith(t("auth.error_name_required", locale));
  if (pin.length < 6) redirectWith(t("auth.error_password_min", locale));

  const admin = createAdminClient();

  // 1. Look up the family by name + invite code (both must match).
  const { data: fam } = await admin
    .from("families")
    .select("id")
    .eq("name", familyName)
    .eq("invite_code", inviteCode)
    .maybeSingle();
  if (!fam) redirectWith(t("auth.error_invite_mismatch", locale));

  // 2. Create the auth user with a synthetic email, pre-confirmed.
  const familyId = (fam as { id: string }).id;
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
    redirectWith(createErr?.message ?? t("auth.signup_failed", locale));
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
    redirectWith(insertErr.message);
  }

  // 4. Establish a browser session by signing in with the same synthetic
  //    email + PIN. The server client persists cookies via @supabase/ssr.
  const supabase = await createClient();
  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email,
    password: pin,
  });
  if (signInErr) {
    redirectWith(signInErr.message);
  }

  redirect("/onboarding/pick-character");
}

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; family_name?: string }>;
}) {
  const sp = await searchParams;
  const locale = await getAuthLocale();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("auth.join_family", locale)}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={joinAction} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">{t("auth.family_name_label", locale)}</label>
            <FamilyNameInput defaultValue={sp.family_name} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t("auth.invite_code_label", locale)}</label>
            <Input
              name="invite_code"
              placeholder={t("auth.invite_code_placeholder", locale)}
              required
              maxLength={20}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t("auth.my_name_label", locale)}</label>
            <Input
              name="display_name"
              placeholder={t("auth.my_name_placeholder", locale)}
              required
              maxLength={20}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              {t("auth.password_min", locale)}
            </label>
            <Input
              type="password"
              name="pin"
              placeholder={t("auth.password", locale)}
              minLength={6}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t("auth.role_label", locale)}</label>
            <select
              name="role"
              defaultValue="child"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="child">{t("auth.role_child", locale)}</option>
              <option value="parent">{t("auth.role_parent", locale)}</option>
            </select>
          </div>

          {sp.error && (
            <p className="text-sm text-destructive">{sp.error}</p>
          )}

          <Button type="submit" className="w-full">
            {t("auth.join_family", locale)}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          {t("auth.first_time_create", locale)}{" "}
          <Link href="/signup" className="text-primary underline">
            {t("auth.email_signup", locale)}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
