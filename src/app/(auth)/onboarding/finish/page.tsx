import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { t } from "@/lib/i18n";
import { getAuthLocale } from "@/lib/i18n/auth-locale";
import Link from "next/link";
import type { Route } from "next";
import { CopyButton } from "./_copy-button";

export default async function OnboardingFinishPage() {
  const locale = await getAuthLocale();
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  const { data: user } = await supabase
    .from("users")
    .select("character_id, family_id")
    .eq("id", authUser.id)
    .single();

  if (!user?.family_id) redirect("/onboarding/create-family");

  const { data: family } = await supabase
    .from("families")
    .select("name, invite_code")
    .eq("id", user.family_id)
    .single();

  if (!family) redirect("/");

  const inviteCode = family.invite_code ?? "---";

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100dvh",
        background: "var(--bg)",
        padding: "64px 28px 32px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      {/* Decorative blob – large radial */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: -180,
          left: "50%",
          transform: "translateX(-50%)",
          width: 520,
          height: 520,
          opacity: 0.75,
          borderRadius: "50%",
          background:
            "radial-gradient(closest-side, #FFE4E9 0%, #FFF5EC 45%, rgba(255,245,236,0) 72%)",
          pointerEvents: "none",
        }}
      />

      {/* Decorative blob – small glow */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: -40,
          left: "50%",
          transform: "translateX(-50%)",
          width: 220,
          height: 220,
          opacity: 0.5,
          borderRadius: "50%",
          filter: "blur(24px)",
          background:
            "radial-gradient(closest-side, #FFB4C6 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Content */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          maxWidth: 400,
        }}
      >
        {/* Check icon */}
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #FF6B9D, #FFA07A)",
            boxShadow:
              "0 8px 20px -6px rgba(255,107,157,0.45), inset 0 1px 0 rgba(255,255,255,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        {/* Step label */}
        <p
          style={{
            marginTop: 20,
            fontSize: 12,
            fontWeight: 700,
            textTransform: "uppercase",
            color: "var(--accent)",
            letterSpacing: "0.15em",
          }}
        >
          STEP 3 of 3 {t("auth.setup_complete", locale)}
        </p>

        {/* Title */}
        <h1
          style={{
            marginTop: 12,
            fontSize: 40,
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: "-0.03em",
            color: "var(--ink)",
            textAlign: "center",
            whiteSpace: "pre-line",
          }}
        >
          {t("auth.family_created", locale)}
        </h1>

        {/* Description */}
        <p
          style={{
            marginTop: 12,
            fontSize: 17,
            fontWeight: 500,
            color: "var(--ink-muted)",
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          <span style={{ fontWeight: 700, color: "var(--ink)" }}>
            {family.name}
          </span>{" "}
          {t("auth.invite_family_desc", locale)}
        </p>

        {/* Invite code section */}
        <div
          style={{
            marginTop: 32,
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* Invite code label */}
          <p
            style={{
              fontSize: 12,
              fontWeight: 700,
              textTransform: "uppercase",
              color: "var(--ink-subtle)",
              letterSpacing: "0.15em",
              marginBottom: 12,
            }}
          >
            {t("auth.invite_code_label", locale)}
          </p>

          {/* Code box */}
          <div
            style={{
              width: "100%",
              borderRadius: 14,
              padding: "16px 20px",
              background: "var(--surface-raised)",
              border: "1.5px dashed var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                fontSize: 24,
                fontWeight: 800,
                letterSpacing: "0.08em",
                color: "#FF6B9D",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {inviteCode}
            </span>

            <CopyButton
              code={inviteCode}
              copyLabel={t("family.copy", locale)}
              copiedLabel={t("family.copied", locale)}
            />
          </div>
        </div>

        {/* CTA section */}
        <div
          style={{
            marginTop: 32,
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            alignItems: "center",
          }}
        >
          {/* Primary CTA — create child account (per mockup) */}
          <Link
            href={"/signup" as Route}
            style={{
              width: "100%",
              height: 56,
              borderRadius: 10,
              background: "var(--bg)",
              border: "1px solid var(--border)",
              color: "var(--ink)",
              fontSize: 16,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              textDecoration: "none",
              cursor: "pointer",
            }}
          >
            <span>{t("auth.create_child_account", locale)}</span>
            <span style={{ color: "var(--ink-subtle)" }}>→</span>
          </Link>

          {/* Secondary CTA — Kakao invite */}
          <a
            href={`https://sharer.kakao.com/talk/friends/picker/shorturl?url=${encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/join?code=${inviteCode}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              width: "100%",
              height: 48,
              borderRadius: 10,
              background: "var(--bg)",
              border: "1px solid var(--border)",
              color: "var(--ink)",
              fontSize: 15,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              textDecoration: "none",
              cursor: "pointer",
            }}
          >
            💬 카카오톡으로 초대
          </a>

          {/* Skip link */}
          <Link
            href={"/" as Route}
            style={{
              marginTop: 8,
              fontSize: 13,
              fontWeight: 500,
              color: "var(--ink-subtle)",
              textDecoration: "underline",
              textUnderlineOffset: 4,
            }}
          >
            {t("auth.skip_for_now", locale)} →
          </Link>
        </div>
      </div>
    </div>
  );
}
