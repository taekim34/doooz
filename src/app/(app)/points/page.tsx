import { requireUser } from "@/features/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { t, type Locale } from "@/lib/i18n";
import { formatDateInFamilyTz } from "@/lib/datetime/family-tz";
import Link from "next/link";
import { BackButton, SectionLabel } from "@/components/atoms";
import { AnimatedBalance } from "./_animated-balance";
import { PointsViewToggle } from "./_view-toggle";
import { CharacterAvatar } from "@/components/molecules/character-avatar";
import { txMeta } from "@/lib/tx-meta";

type Tx = {
  id: string;
  amount: number;
  reason: string;
  kind: string;
  created_at: string;
  user_id: string;
  task_instances: { due_date: string } | null;
};

export default async function PointsPage() {
  const { user, family } = await requireUser();
  const locale = (family.locale || "ko") as Locale;
  const supabase = await createClient();

  const { data: txs } = await supabase
    .from("point_transactions")
    .select(
      "id, amount, reason, kind, created_at, user_id, task_instances(due_date)",
    )
    .eq(
      user.role === "child" ? "user_id" : "family_id",
      user.role === "child" ? user.id : family.id,
    )
    .order("created_at", { ascending: false })
    .limit(30);

  const { data: members } =
    user.role === "parent"
      ? await supabase
          .from("users")
          .select(
            "id, display_name, current_balance, lifetime_earned, level, role, character_id",
          )
          .eq("family_id", family.id)
          .eq("role", "child")
          .order("display_name")
      : { data: null };

  const txList = (txs ?? []) as Tx[];
  const kidList = (members ?? []) as Array<{
    id: string;
    display_name: string;
    current_balance: number;
    lifetime_earned: number;
    level: number;
    character_id: string | null;
  }>;

  const isKid = user.role === "child";
  const familyTotalBalance = kidList.reduce(
    (a, k) => a + (k.current_balance || 0),
    0,
  );
  const familyTotalLifetime = kidList.reduce(
    (a, k) => a + (k.lifetime_earned || 0),
    0,
  );

  const recentForList = txList.slice(0, 5);

  // Kid-view totals — for the parent "kid view" preview we aggregate the
  // entire family balance as a friendly top-line for now. Children see their
  // own data.
  const heroBalance = isKid ? user.current_balance : familyTotalBalance;
  const heroLifetime = isKid ? user.lifetime_earned : familyTotalLifetime;
  const heroLevel = isKid ? user.level : 1;

  // Parents default to parent view; kids cannot switch.
  const defaultMode = isKid ? "kid" : "parent";

  return (
    <div
      id="points-root"
      data-view={defaultMode}
      className="relative mx-auto max-w-2xl lg:max-w-5xl points-root text-[color:var(--ink)] pt-2"
    >
      {/* Mode-dependent background. Set on a fixed pseudo-layer via <style>. */}
      <style>{`
        .points-root[data-view="kid"] {
          background: linear-gradient(180deg, #FFF5EC 0%, #FFE4E9 38%, #E5EFFF 100%);
          transition: background 320ms var(--ease-spring);
        }
        .points-root[data-view="parent"] {
          background: var(--surface);
          transition: background 320ms var(--ease-spring);
        }
        .points-root[data-view="kid"] .points-kid { display: block; }
        .points-root[data-view="kid"] .points-parent { display: none; }
        .points-root[data-view="parent"] .points-kid { display: none; }
        .points-root[data-view="parent"] .points-parent { display: block; }
        .points-root[data-view="kid"] .points-back-btn {
          background: rgba(255,255,255,0.7);
          border-color: rgba(255,255,255,0.8);
        }
        .points-root[data-view="parent"] .points-back-btn {
          background: var(--surface-raised);
          border-color: var(--border-subtle);
        }
        .points-root[data-view="kid"] .points-subtitle-kid { display: inline; }
        .points-root[data-view="kid"] .points-subtitle-parent { display: none; }
        .points-root[data-view="parent"] .points-subtitle-kid { display: none; }
        .points-root[data-view="parent"] .points-subtitle-parent { display: inline; }
      `}</style>

      <div className="px-5">
        {/* Top bar: back + view toggle */}
        <div className="flex items-center justify-between py-1.5 pb-3.5">

          <BackButton href="/" className="points-back-btn" />

          {/* Parents get a segmented toggle. Kids see nothing in the center. */}
          {isKid ? (
            <span />
          ) : (
            <PointsViewToggle
              defaultMode={defaultMode}
              kidLabel={t("points.kid_view", locale)}
              parentLabel={t("points.parent_view", locale)}
            />
          )}

          <span className="w-9 h-9" />
        </div>

        {/* Page title + subtitle */}
        <div className="mb-4">
          <h1 className="mb-1 text-2xl font-extrabold tracking-tight">
            {t("nav.points", locale)}
          </h1>
          <p className="m-0 text-[13px] font-medium text-[color:var(--ink-subtle)] tracking-[-0.01em]">

            {/* Both subtitles render; CSS hides the inactive one. */}
            <span className="points-subtitle-kid">
              {t("points.subtitle_kid", locale)}
            </span>
            <span className="points-subtitle-parent">
              {isKid
                ? t("points.subtitle_kid", locale)
                : t("points.subtitle_parent", locale)}
            </span>
          </p>
        </div>
      </div>

      <div className="px-5 pb-7">
        {/* KID VIEW — always rendered; CSS shows/hides based on mode. */}
        <section className="points-kid lg:grid lg:grid-cols-2 lg:gap-6">
          {/* Left column: Hero balance card — kid */}
          <div className="lg:sticky lg:top-20 lg:self-start">
            <div
              style={{
                position: "relative",
                overflow: "hidden",
                background: "var(--surface)",
                borderRadius: 22,
                border: "1px solid rgba(255,255,255,0.7)",
                boxShadow:
                  "0 20px 40px -20px rgba(255,107,157,0.35), 0 2px 4px rgba(10,10,10,0.04)",
                padding: "22px 22px 20px",
              }}
            >
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  right: -40,
                  top: -40,
                  width: 180,
                  height: 180,
                  borderRadius: 9999,
                  filter: "blur(4px)",
                  background:
                    "radial-gradient(closest-side, rgba(255,160,122,0.35) 0%, rgba(255,107,157,0.18) 50%, transparent 75%)",
                }}
              />
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    color: "var(--accent)",
                    letterSpacing: "0.18em",
                  }}
                >
                  {t("points.current", locale)}
                </div>
                <div
                  style={{
                    marginTop: 8,
                    display: "flex",
                    alignItems: "baseline",
                    gap: 6,
                  }}
                >
                  <span
                    style={{
                      fontSize: 48,
                      fontWeight: 800,
                      letterSpacing: "-0.03em",
                      lineHeight: 1,
                      fontFeatureSettings: '"tnum" 1',
                      background:
                        "var(--accent-gradient)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    <AnimatedBalance value={heroBalance} />
                  </span>
                  <span
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      color: "var(--accent)",
                    }}
                  >
                    pt
                  </span>
                </div>

                <div
                  style={{
                    marginTop: 16,
                    padding: "12px 14px",
                    borderRadius: 12,
                    background: "var(--surface-raised)",
                    border: "1px solid var(--border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        color: "var(--ink-subtle)",
                        letterSpacing: "0.14em",
                      }}
                    >
                      {t("points.lifetime", locale)}
                    </span>
                    <span
                      style={{
                        marginTop: 2,
                        fontSize: 16,
                        fontWeight: 800,
                        color: "var(--ink)",
                        letterSpacing: "-0.01em",
                        fontFeatureSettings: '"tnum" 1',
                      }}
                    >
                      <AnimatedBalance
                        value={heroLifetime}
                        duration={900}
                        delay={250}
                      />{" "}
                      pt
                    </span>
                  </div>
                  <LevelChip level={heroLevel} />
                </div>
              </div>
            </div>
          </div>

          {/* Right column: Recent transactions — kid */}
          <div>
            <div className="mt-5.5 flex items-center justify-between gap-3 lg:!mt-0">
              <SectionLabel>{t("points.recent", locale)}</SectionLabel>
              <Link
                href="/points/history"
                className="bg-transparent border-none text-[12.5px] font-bold text-[color:var(--accent)] py-1 whitespace-nowrap shrink-0 no-underline"
              >
                {t("points.all", locale)} →
              </Link>
            </div>
            <div
              style={{
                marginTop: 10,
                padding: "4px 14px",
                background: "var(--surface)",
                borderRadius: 18,
                border: "1px solid rgba(255,255,255,0.6)",
                boxShadow:
                  "0 10px 28px -18px rgba(10,10,10,0.14), 0 1px 2px rgba(10,10,10,0.03)",
              }}
            >
              {recentForList.length === 0 ? (
                <div
                  style={{
                    padding: "22px 8px",
                    textAlign: "center",
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--ink-subtle)",
                  }}
                >
                  {t("points.no_history_child", locale)}
                </div>
              ) : (
                recentForList.map((tx, i) => (
                  <div
                    key={tx.id}
                    className="animate-dzTlRise"
                    style={{ opacity: 0, animationDelay: `${i * 40}ms` }}
                  >
                    <TxRow
                      tx={tx}
                      last={i === recentForList.length - 1}
                      timezone={family.timezone}
                      locale={locale}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* PARENT VIEW — rendered only for parents; CSS shows/hides. */}
        {!isKid && (
          <section className="points-parent lg:grid lg:grid-cols-2 lg:gap-6">
            {/* Left column: Per-kid balance cards + family totals */}
            <div className="lg:sticky lg:top-20 lg:self-start">
              <div className="flex flex-col gap-2.5">
                {kidList.map((kid) => (
                  <KidCard key={kid.id} kid={kid} />
                ))}
                {kidList.length === 0 && (
                  <div
                    style={{
                      padding: "20px 16px",
                      borderRadius: 16,
                      background: "var(--surface-raised)",
                      border: "1px solid var(--border)",
                      fontSize: 13,
                      fontWeight: 500,
                      color: "var(--ink-subtle)",
                      textAlign: "center",
                    }}
                  >
                    {t("points.no_history_child", locale)}
                  </div>
                )}
              </div>

              {/* Family totals */}
              {kidList.length > 0 && (
                <div className="mt-4.5">
                  <SectionLabel>{t("points.family_balance", locale)}</SectionLabel>
                  <div
                    style={{
                      marginTop: 10,
                      padding: "16px 18px",
                      borderRadius: 16,
                      background: "var(--ink)",
                      color: "var(--on-accent)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 14,
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          color: "rgba(255,255,255,0.6)",
                          letterSpacing: "0.14em",
                        }}
                      >
                        {t("points.current", locale)}
                      </div>
                      <div
                        style={{
                          marginTop: 4,
                          fontSize: 26,
                          fontWeight: 800,
                          letterSpacing: "-0.02em",
                          fontFeatureSettings: '"tnum" 1',
                        }}
                      >
                        {familyTotalBalance.toLocaleString()} pt
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          color: "rgba(255,255,255,0.5)",
                          letterSpacing: "0.14em",
                        }}
                      >
                        {t("points.lifetime", locale)}
                      </div>
                      <div
                        style={{
                          marginTop: 4,
                          fontSize: 15,
                          fontWeight: 700,
                          color: "#A5F3FC",
                          letterSpacing: "-0.01em",
                          fontFeatureSettings: '"tnum" 1',
                        }}
                      >
                        {familyTotalLifetime.toLocaleString()} pt
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right column: Recent transactions — parent */}
            <div>
              <div className="mt-5.5 flex items-center justify-between gap-3 lg:!mt-0">
                <SectionLabel>{t("points.recent", locale)}</SectionLabel>
                <Link
                  href="/points/history"
                  className="bg-transparent border-none text-[12.5px] font-bold text-[color:var(--accent)] py-1 whitespace-nowrap shrink-0 no-underline"
                >
                  {t("points.all", locale)} →
                </Link>
              </div>
              <div className="mt-2.5 px-3.5 py-1 bg-[color:var(--bg)] rounded-2xl border border-[color:var(--border)]">

                {recentForList.length === 0 ? (
                  <div
                    style={{
                      padding: "22px 8px",
                      textAlign: "center",
                      fontSize: 13,
                      fontWeight: 500,
                      color: "var(--ink-subtle)",
                    }}
                  >
                    {t("points.no_history_full", locale)}
                  </div>
                ) : (
                  recentForList.map((tx, i) => {
                    const kid = kidList.find((k) => k.id === tx.user_id);
                    return (
                      <div
                        key={tx.id}
                        className="animate-dzTlRise"
                        style={{ opacity: 0, animationDelay: `${i * 40}ms` }}
                      >
                        <TxRow
                          tx={tx}
                          last={i === recentForList.length - 1}
                          timezone={family.timezone}
                          locale={locale}
                          showWho={kid?.display_name}
                        />
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function KidCard({
  kid,
}: {
  kid: {
    id: string;
    display_name: string;
    current_balance: number;
    lifetime_earned: number;
    level: number;
    character_id: string | null;
  };
}) {
  return (
    <Link
      href={`/points/history?child=${kid.id}` as never}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 16px",
        borderRadius: 16,
        background: "var(--surface-raised)",
        border: "1px solid var(--border)",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <CharacterAvatar
        characterId={kid.character_id ?? ""}
        level={kid.level}
        size="md"
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "var(--ink)",
              letterSpacing: "-0.01em",
            }}
          >
            {kid.display_name}
          </span>
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              padding: "2px 7px",
              borderRadius: 9999,
              background: "#EEF2FF",
              color: "var(--accent)",
              letterSpacing: "0.04em",
            }}
          >
            Lv.{kid.level}
          </span>
        </div>
        <div
          style={{
            marginTop: 2,
            fontSize: 12,
            fontWeight: 500,
            color: "var(--ink-subtle)",
            letterSpacing: "-0.01em",
            fontFeatureSettings: '"tnum" 1',
          }}
        >
          {kid.lifetime_earned.toLocaleString()} pt
        </div>
      </div>
      <span
        style={{
          fontSize: 17,
          fontWeight: 800,
          color: "var(--ink)",
          letterSpacing: "-0.01em",
          fontFeatureSettings: '"tnum" 1',
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        {kid.current_balance.toLocaleString()} pt
      </span>
    </Link>
  );
}

function LevelChip({ level }: { level: number }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        borderRadius: 9999,
        background:
          "linear-gradient(135deg, rgba(255,107,157,0.15) 0%, rgba(255,160,122,0.15) 100%)",
        border: "1px solid rgba(255,107,157,0.25)",
      }}
    >
      <span aria-hidden style={{ fontSize: 12 }}>
        ⭐
      </span>
      <span
        style={{
          fontSize: 11.5,
          fontWeight: 800,
          color: "#FF6B9D",
          letterSpacing: "0.04em",
        }}
      >
        Lv.{level}
      </span>
    </div>
  );
}


function TxRow({
  tx,
  last,
  timezone,
  locale,
  showWho,
}: {
  tx: Tx;
  last: boolean;
  timezone: string;
  locale: Locale;
  showWho?: string;
}) {
  const meta = txMeta(tx.kind);
  const isPos = tx.amount >= 0;
  const whenRaw =
    tx.task_instances?.due_date ??
    formatDateInFamilyTz(tx.created_at, timezone, "MM-dd");
  const isPenalty = tx.kind === "penalty";
  const isAdjustment = tx.kind === "adjustment";
  const label =
    (isPenalty ? t("points.missed_task", locale) + " · " : "") +
    (isAdjustment ? t("points.adjustment", locale) + " · " : "") +
    tx.reason;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 0",
        borderBottom: last ? "none" : "1px solid var(--divider)",
      }}
    >
      <span
        aria-hidden
        style={{
          flexShrink: 0,
          display: "flex",
          height: 32,
          width: 32,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 9999,
          background: meta.bg,
          fontSize: 15,
        }}
      >
        {meta.icon}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "var(--ink)",
            letterSpacing: "-0.01em",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {showWho && <span style={{ fontWeight: 700 }}>{showWho} · </span>}
          {label}
        </div>
        <div
          style={{
            marginTop: 2,
            fontSize: 12,
            fontWeight: 400,
            color: "var(--ink-subtle)",
          }}
        >
          {whenRaw}
        </div>
      </div>
      <span
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: isPos ? "var(--success)" : "var(--error)",
          fontFeatureSettings: '"tnum" 1',
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        {isPos ? "+" : "−"}
        {Math.abs(tx.amount)} pt
      </span>
    </div>
  );
}
