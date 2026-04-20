import { redirect } from "next/navigation";
import Link from "next/link";
import { BackButton } from "@/components/atoms";
import { requireUser } from "@/features/auth/current-user";
import { CopyButton } from "./_copy";
import { t, type Locale } from "@/lib/i18n";

export default async function InvitePage() {
  const { user, family } = await requireUser();
  const locale = (family.locale || "ko") as Locale;
  if (user.role !== "parent") redirect("/family");

  return (
    <div
      className="relative min-h-screen"
      style={{
        background: "var(--bg)",
        color: "var(--ink)",        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          padding: "12px 20px 8px",
          display: "grid",
          gridTemplateColumns: "36px 1fr 36px",
          alignItems: "center",
        }}
      >
        <BackButton href="/family" />
        <div
          style={{
            textAlign: "center",
            fontSize: 12,
            fontWeight: 700,
            color: "var(--ink-subtle)",
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            whiteSpace: "nowrap",
          }}
        >
          {t("family.invite_title", locale)}
        </div>
        <div />
      </div>

      {/* Body */}
      <div
        className="mx-auto w-full max-w-md"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "20px 20px 24px",
          gap: 18,
        }}
      >
        <div
          style={{
            textAlign: "center",
            fontSize: 14,
            fontWeight: 500,
            color: "var(--ink-subtle)",
            letterSpacing: "-0.01em",
            lineHeight: 1.5,
            margin: "4px 0 4px",
          }}
        >
          {t("family.invite_desc", locale)}
        </div>

        {/* Dashed code card */}
        <CopyButton
          code={family.invite_code}
          copyLabel={t("family.copy", locale)}
          copiedLabel={t("family.copied", locale)}
        />

        <div style={{ flex: 1 }} />

        {/* Kakao CTA */}
        <a
          href={`https://sharer.kakao.com/talk/friends/picker/shorturl?url=${encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/join?code=${family.invite_code}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            width: "100%",
            height: 56,
            borderRadius: 10,
            background: "var(--ink)",
            border: "none",
            color: "var(--on-accent)",
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: "-0.01em",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            textDecoration: "none",
            cursor: "pointer",
          }}
        >
          <span aria-hidden>💬</span>
          {t("family.invite_kakao", locale)}
        </a>

        {/* Back link */}
        <Link
          href={"/family" as never}
          style={{
            textAlign: "center",
            background: "transparent",
            fontSize: 14,
            fontWeight: 500,
            color: "var(--accent)",
            letterSpacing: "-0.01em",
            padding: "4px 0",
            textDecoration: "none",
          }}
        >
          {t("common.back", locale)}
        </Link>
      </div>
    </div>
  );
}
