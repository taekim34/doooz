import { requireUser } from "@/features/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { characterEmoji } from "@/features/characters/emoji-map";
import { getStage } from "@/lib/level";
import Link from "next/link";
import { BackButton, SectionLabel } from "@/components/atoms";
import { t, type Locale } from "@/lib/i18n";
import { tileGrad } from "@/lib/tile-grad";

export default async function FamilyPage() {
  const { user, family } = await requireUser();
  const locale = (family.locale || "ko") as Locale;
  const supabase = await createClient();
  const { data } = await supabase
    .from("users")
    .select("id, display_name, role, level, current_balance, character_id")
    .eq("family_id", family.id);
  const members = (data ?? []) as Array<{
    id: string;
    display_name: string;
    role: string;
    level: number;
    current_balance: number;
    character_id: string | null;
  }>;

  const parents = members.filter((m) => m.role === "parent").length;
  const kids = members.filter((m) => m.role === "child").length;

  return (
    <div
      className="relative min-h-screen"
      style={{
        background: "var(--bg)",
        color: "var(--ink)",      }}
    >
      <style>{`
        @keyframes fmTlRise { to { opacity: 1; transform: none; } }
        .fm-tl-rise { opacity: 0; transform: translateY(8px); animation: fmTlRise 520ms cubic-bezier(0.16,1,0.3,1) forwards; }
        @media (prefers-reduced-motion: reduce) {
          .fm-tl-rise { animation: none; opacity: 1; transform: none; }
        }
      `}</style>

      {/* Back */}
      <div
        style={{
          padding: "12px 20px 8px",
          display: "flex",
          alignItems: "center",
        }}
      >
        <BackButton href="/" />
      </div>

      <div className="mx-auto max-w-md" style={{ padding: "4px 20px 24px" }}>
        <SectionLabel as="span">
          {locale === "ko" ? "가족" : locale === "ja" ? "家族" : "Family"}
        </SectionLabel>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 8,
            marginTop: 4,
            marginBottom: 22,
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: "var(--ink)",
            }}
          >
            {family.name}
          </h1>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--ink-subtle)",
              letterSpacing: "-0.01em",
              whiteSpace: "nowrap",
              fontFeatureSettings: '"tnum" 1',
            }}
          >
            {t("family.role_parent", locale)} {parents} ·{" "}
            {t("family.role_child", locale)} {kids}
          </span>
        </div>

        {/* Members */}
        <div
          style={{ display: "flex", flexDirection: "column", gap: 8 }}
        >
          {members.map((m, i) => (
            <Link
              key={m.id}
              href={`/family/member/${m.id}` as never}
              className="fm-tl-rise"
              style={{
                animationDelay: `${i * 40}ms`,
                textDecoration: "none",
                color: "inherit",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: 12,
                borderRadius: 14,
                background: "var(--surface-raised)",
                transition: "background 150ms cubic-bezier(0.16,1,0.3,1)",
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: tileGrad(m.character_id, m.id),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <span aria-hidden style={{ fontSize: 24, lineHeight: 1 }}>
                  {characterEmoji(m.character_id, getStage(m.level))}
                </span>
              </div>

              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                }}
              >
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "var(--ink)",
                    letterSpacing: "-0.01em",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {m.display_name}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: "var(--ink-subtle)",
                    letterSpacing: "-0.01em",
                    fontFeatureSettings: '"tnum" 1',
                    whiteSpace: "nowrap",
                  }}
                >
                  Lv.{m.level} ·{" "}
                  {m.role === "parent"
                    ? t("family.role_parent", locale)
                    : t("family.role_child", locale)}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--ink)",
                    letterSpacing: "-0.01em",
                    fontFeatureSettings: '"tnum" 1',
                    whiteSpace: "nowrap",
                  }}
                >
                  {m.current_balance.toLocaleString()} pt
                </span>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden
                >
                  <path
                    d="M6 3l5 5-5 5"
                    stroke="#C7C7CC"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Invite CTA */}
      {user.role === "parent" && (
        <div
          className="mx-auto max-w-md"
          style={{ padding: "10px 20px 22px" }}
        >
          <Link
            href={"/family/invite" as never}
            style={{
              width: "100%",
              height: 48,
              borderRadius: 10,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              fontSize: 15,
              fontWeight: 600,
              color: "var(--ink)",
              letterSpacing: "-0.01em",
              textDecoration: "none",
              transition:
                "transform 200ms cubic-bezier(0.16,1,0.3,1), background 150ms cubic-bezier(0.16,1,0.3,1)",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden
            >
              <path
                d="M8 3.5v9M3.5 8h9"
                stroke="var(--ink)"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
            {t("family.invite", locale)}
          </Link>
        </div>
      )}
    </div>
  );
}
