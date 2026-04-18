import { randomUUID } from "node:crypto";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { FamilyNameInput } from "./_family-name-input";
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

  const redirectWith = (msg: string) =>
    redirect(`/join?error=${encodeURIComponent(msg)}&family_name=${encodeURIComponent(familyName)}`);

  if (!familyName) redirectWith(t("auth.error_family_name_required", locale));
  if (!inviteCode) redirectWith(t("auth.error_invite_code_required", locale));
  if (!displayName) redirectWith(t("auth.error_name_required", locale));
  if (pin.length < 6) redirectWith(t("auth.error_password_min", locale));

  // WHY: admin required — invite link join needs cross-family lookup before user has a family_id
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

const inputStyle: React.CSSProperties = {
  height: 48, width: "100%", borderRadius: 10,
  padding: "0 16px", outline: "none",
  background: "#FAFAFA", border: "1px solid #F0F0F0",
  fontSize: 17, fontWeight: 500, color: "#0A0A0A",
  fontFamily: "inherit",
  transition: "border-color 150ms, background 150ms",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 700, textTransform: "uppercase",
  color: "#9CA3AF", letterSpacing: "0.15em",
};

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; family_name?: string }>;
}) {
  const sp = await searchParams;
  const locale = await getAuthLocale();
  return (
    <>
      <h1 style={{
        marginTop: 0, fontSize: 24, fontWeight: 800,
        color: "#0A0A0A", letterSpacing: "-0.02em", textAlign: "center",
      }}>
        {t("auth.join_family", locale)}
      </h1>
      <p style={{
        marginTop: 8, fontSize: 14, fontWeight: 500,
        color: "#6B7280", textAlign: "center",
      }}>
        {t("auth.join_family_sub", locale)}
      </p>

      <form action={joinAction} style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 14 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={labelStyle}>{t("auth.family_name_label", locale)}</span>
          <FamilyNameInput defaultValue={sp.family_name} placeholder={t("auth.family_name_placeholder", locale)} />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={labelStyle}>{t("auth.invite_code_label", locale)}</span>
          <input
            name="invite_code"
            placeholder={t("auth.invite_code_placeholder", locale)}
            required
            maxLength={20}
            style={inputStyle}
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={labelStyle}>{t("auth.my_name_label", locale)}</span>
          <input
            name="display_name"
            placeholder={t("auth.my_name_placeholder", locale)}
            required
            maxLength={20}
            style={inputStyle}
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={labelStyle}>{t("auth.password", locale)}</span>
          <input
            type="password"
            name="pin"
            placeholder={t("auth.password_min", locale)}
            minLength={6}
            required
            style={inputStyle}
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={labelStyle}>{t("auth.role_label", locale)}</span>
          <select
            name="role"
            defaultValue="child"
            style={{
              height: 48, width: "100%", borderRadius: 10,
              padding: "0 16px", outline: "none",
              background: "#FAFAFA", border: "1px solid #F0F0F0",
              fontSize: 17, fontWeight: 500, color: "#0A0A0A",
              fontFamily: "inherit",
              transition: "border-color 150ms, background 150ms",
              boxSizing: "border-box" as const,
              appearance: "none" as const,
              WebkitAppearance: "none" as const,
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%239CA3AF' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 16px center",
              paddingRight: 40,
            }}
          >
            <option value="child">{t("auth.role_child", locale)}</option>
            <option value="parent">{t("auth.role_parent", locale)}</option>
          </select>
        </label>

        {sp.error && (
          <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "#EF4444" }}>{sp.error}</p>
        )}

        <button
          type="submit"
          style={{
            marginTop: 6, height: 48, width: "100%", borderRadius: 10,
            fontSize: 15, fontWeight: 600, color: "#fff",
            background: "#0A0A0A", border: "none", cursor: "pointer",
            letterSpacing: "-0.01em",
            boxShadow: "0 1px 2px rgba(10,10,10,0.04)",
            fontFamily: "inherit",
          }}
        >
          {t("auth.join_family", locale)}
        </button>
      </form>

      <div style={{ marginTop: 16, textAlign: "center" }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: "#6B7280" }}>
          {t("auth.first_time_create", locale)}{" "}
          <Link href="/signup" style={{ fontSize: 14, fontWeight: 500, color: "#6366F1", textDecoration: "none" }}>
            {t("auth.email_signup", locale)}
          </Link>
        </p>
        <p style={{ margin: "8px 0 0" }}>
          <Link href="/privacy" style={{ fontSize: 13, fontWeight: 500, color: "#6B7280", textDecoration: "none" }}>
            {t("privacy.link", locale)}
          </Link>
        </p>
      </div>
    </>
  );
}
