import { requireUser } from "@/features/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { characterEmoji } from "@/features/characters/emoji-map";
import { getStage, progressToNextLevel, getLevelTitle } from "@/lib/level";
import Link from "next/link";
import { BackButton, SectionLabel } from "@/components/atoms";
import { LevelTable } from "./_level-table";
import { StageProgress } from "./_stage-progress";
import { t, type Locale } from "@/lib/i18n";

const ACCENT = "var(--accent)";
const ACCENT_GRAD = "var(--accent-gradient)";
const BG = "linear-gradient(180deg, #FFF5EC 0%, #FFE4E9 40%, #E5EFFF 100%)";

export default async function CharactersPage() {
  const { user, family } = await requireUser();
  const locale = (family.locale || "ko") as Locale;
  const supabase = await createClient();

  const { data: allBadges } = await supabase
    .from("badges")
    .select("id, name, icon, description")
    .order("sort_order");
  const { data: earned } = await supabase
    .from("user_badges")
    .select("badge_id")
    .eq("user_id", user.id);

  const earnedSet = new Set(
    ((earned ?? []) as Array<{ badge_id: string }>).map((b) => b.badge_id),
  );
  const badges = (allBadges ?? []) as Array<{
    id: string;
    name: string;
    icon: string | null;
    description: string | null;
  }>;

  const stage = getStage(user.level);
  const progress = progressToNextLevel(user.lifetime_earned);
  const progressPct = Math.round(progress.fraction * 100);
  const pointsToNext = progress.nextThreshold
    ? Math.max(0, progress.nextThreshold - user.lifetime_earned)
    : 0;
  const stageName = t(
    `characters.stage_${["chick", "rookie", "warrior", "hero", "legend"][stage - 1]}`,
    locale,
  );
  const earnedCount = badges.filter((b) => earnedSet.has(b.id)).length;

  return (
    <div
      className="relative min-h-screen"
      style={{
        background: BG,
        color: "var(--ink)",      }}
    >
      <style>{`
        @keyframes chBounce {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-4px); }
        }
        @keyframes chTlRise { to { opacity: 1; transform: none; } }
        .ch-tl-rise { opacity: 0; transform: translateY(8px); animation: chTlRise 520ms cubic-bezier(0.16,1,0.3,1) forwards; }
        @media (prefers-reduced-motion: reduce) {
          .ch-tl-rise { animation: none; opacity: 1; transform: none; }
          [data-ch-avatar] { animation: none !important; }
        }
      `}</style>

      {/* Top bar */}
      <div
        style={{
          padding: "10px 20px 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <BackButton href="/" variant="glass" />
        <SectionLabel as="span">{t("characters.my_character", locale)}</SectionLabel>
        <div style={{ width: 36 }} />
      </div>

      <div className="mx-auto max-w-md" style={{ padding: "4px 20px 28px" }}>
        {/* Hero */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            paddingTop: 10,
            paddingBottom: 4,
          }}
        >
          <div
            aria-hidden
            data-ch-avatar
            style={{
              fontSize: 96,
              lineHeight: 1,
              animation: "chBounce 2000ms ease-in-out infinite",
              filter: "drop-shadow(0 10px 18px rgba(10,10,10,0.14))",
            }}
          >
            {characterEmoji(user.character_id, stage)}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 10,
              whiteSpace: "nowrap",
            }}
          >
            <span
              style={{
                fontSize: 24,
                fontWeight: 800,
                letterSpacing: "-0.02em",
                color: "var(--ink)",
              }}
            >
              {user.display_name}
            </span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                height: 24,
                padding: "0 10px",
                borderRadius: 9999,
                background: "var(--surface)",
                color: ACCENT,
                fontSize: 11.5,
                fontWeight: 800,
                letterSpacing: "-0.01em",
                border: "1px solid rgba(255,107,157,0.25)",
              }}
            >
              {stageName}
            </span>
          </div>
        </div>

        {/* Progress */}
        <div
          style={{
            marginTop: 18,
            padding: 14,
            borderRadius: 18,
            background: "var(--surface)",
            border: "1px solid rgba(255,255,255,0.8)",
            boxShadow:
              "0 14px 32px -22px rgba(10,10,10,0.18), 0 2px 4px rgba(10,10,10,0.04)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                height: 24,
                padding: "0 10px",
                borderRadius: 9999,
                background: "var(--ink)",
                color: "var(--on-accent)",
                fontSize: 11.5,
                fontWeight: 800,
                letterSpacing: "-0.01em",
                fontFeatureSettings: '"tnum" 1',
              }}
            >
              Lv.{user.level}
            </span>
            <span
              style={{
                fontSize: 12.5,
                fontWeight: 500,
                color: "var(--ink-subtle)",
                letterSpacing: "-0.01em",
                fontFeatureSettings: '"tnum" 1',
              }}
            >
              {progress.nextThreshold ? (
                <>
                  Lv.{user.level + 1}{" "}
                  <span style={{ color: "var(--ink)", fontWeight: 700 }}>
                    {pointsToNext.toLocaleString()}pt
                  </span>
                </>
              ) : (
                "MAX"
              )}
            </span>
          </div>
          <div
            style={{
              position: "relative",
              marginTop: 10,
              height: 10,
              borderRadius: 9999,
              background: "var(--surface-sunken)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                width: `${progressPct}%`,
                background: ACCENT_GRAD,
                borderRadius: 9999,
                transition:
                  "width 900ms cubic-bezier(0.16,1,0.3,1), background 320ms ease",
              }}
            />
          </div>
        </div>

        {/* Stage road */}
        <div style={{ marginTop: 22 }}>
          <SectionLabel as="span">
            {t("characters.stages", locale) !== "characters.stages"
              ? t("characters.stages", locale)
              : locale === "ko"
                ? "성장 단계"
                : locale === "ja"
                  ? "成長段階"
                  : "Stages"}
          </SectionLabel>
        </div>
        <div
          style={{
            marginTop: 10,
            padding: "16px 12px 14px",
            borderRadius: 18,
            background: "var(--surface)",
            border: "1px solid rgba(255,255,255,0.8)",
            boxShadow:
              "0 12px 28px -22px rgba(10,10,10,0.16), 0 2px 4px rgba(10,10,10,0.04)",
          }}
        >
          <StageProgress currentStage={stage} locale={locale} />
        </div>

        {/* Badges */}
        <div
          style={{
            marginTop: 22,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <SectionLabel as="span">{t("characters.badges", locale)}</SectionLabel>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "var(--ink-subtle)",
              letterSpacing: "-0.01em",
              fontFeatureSettings: '"tnum" 1',
            }}
          >
            <span style={{ color: ACCENT }}>{earnedCount}</span>
            <span> / {badges.length}</span>
          </span>
        </div>
        <div
          style={{
            marginTop: 10,
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 8,
          }}
        >
          {badges.length === 0 && (
            <p
              style={{
                gridColumn: "1 / -1",
                fontSize: 13,
                color: "var(--ink-subtle)",
              }}
            >
              {t("characters.no_badges", locale)}
            </p>
          )}
          {badges.map((b, i) => {
            const has = earnedSet.has(b.id);
            return (
              <div
                key={b.id}
                className="ch-tl-rise"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                {has ? (
                  <div
                    style={{
                      padding: "12px 6px 10px",
                      borderRadius: 14,
                      background: "var(--surface)",
                      border: "1px solid rgba(255,255,255,0.8)",
                      boxShadow:
                        "0 10px 22px -18px rgba(10,10,10,0.18), 0 1px 2px rgba(10,10,10,0.03)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span
                      aria-hidden
                      style={{ fontSize: 32, lineHeight: 1 }}
                    >
                      {b.icon}
                    </span>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 500,
                        color: "var(--ink)",
                        letterSpacing: "-0.01em",
                        textAlign: "center",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        width: "100%",
                      }}
                    >
                      {b.name}
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      padding: "12px 6px 10px",
                      borderRadius: 14,
                      background: "var(--surface-sunken)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span
                      aria-hidden
                      style={{
                        fontSize: 24,
                        lineHeight: 1,
                        fontWeight: 800,
                        color: "#B5B5BE",
                      }}
                    >
                      ???
                    </span>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 500,
                        color: "var(--ink-subtle)",
                        letterSpacing: "-0.01em",
                        textAlign: "center",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        width: "100%",
                      }}
                    >
                      ???
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Gallery link (children only) */}
        {user.role === "child" && (
          <Link
            href={"/characters/gallery" as never}
            style={{
              marginTop: 16,
              width: "100%",
              height: 44,
              borderRadius: 12,
              background: "var(--surface)",
              border: "1px solid rgba(255,255,255,0.7)",
              boxShadow: "0 8px 22px -20px rgba(10,10,10,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              fontSize: 13,
              fontWeight: 700,
              color: ACCENT,
              letterSpacing: "-0.01em",
              textDecoration: "none",
            }}
          >
            {t("characters.change", locale)}
            <span aria-hidden>→</span>
          </Link>
        )}

        {/* Level table toggle */}
        <div style={{ marginTop: 10 }}>
          <LevelTable currentLevel={user.level} />
        </div>
      </div>
    </div>
  );
}
