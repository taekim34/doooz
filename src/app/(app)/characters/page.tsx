import { requireUser } from "@/features/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { CharacterIcon } from "@/components/molecules/character-icon";
import { getStage, progressToNextLevel } from "@/lib/level";
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
      className="relative min-h-screen text-[color:var(--ink)]"
      style={{ background: BG }}
    >
      <style>{`
        @keyframes chBounce {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-4px); }
        }
        @keyframes chTlRise { to { opacity: 1; transform: none; } }
        .ch-tl-rise { opacity: 0; transform: translateY(8px); animation: chTlRise 520ms var(--ease-spring) forwards; }
        @media (prefers-reduced-motion: reduce) {
          .ch-tl-rise { animation: none; opacity: 1; transform: none; }
          [data-ch-avatar] { animation: none !important; }
        }
      `}</style>

      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-2.5">
        <BackButton href="/" variant="glass" />
        <SectionLabel as="span">{t("characters.my_character", locale)}</SectionLabel>
        <div className="w-9" />
      </div>

      <div className="mx-auto max-w-md px-5 pt-1 pb-7">
        {/* Hero */}
        <div className="flex flex-col items-center pt-2.5 pb-1">
          <div
            data-ch-avatar
            style={{
              filter: "drop-shadow(0 10px 18px rgba(10,10,10,0.14))",
            }}
          >
            <CharacterIcon
              id={user.character_id}
              stage={stage}
              pixelSize={216}
              idle="breathe"
              tappable
            />
          </div>
          <div className="mt-2.5 flex items-center gap-2 whitespace-nowrap">
            <span className="text-2xl font-extrabold tracking-[-0.02em] text-[color:var(--ink)]">
              {user.display_name}
            </span>
            <span
              className="inline-flex h-6 items-center rounded-full border border-[rgba(255,107,157,0.25)] bg-[color:var(--surface)] px-2.5 text-[11.5px] font-extrabold tracking-[-0.01em] text-[color:var(--accent)]"
            >
              {stageName}
            </span>
          </div>
        </div>

        {/* Progress */}
        <div
          className="mt-[18px] rounded-[18px] border border-[rgba(255,255,255,0.8)] bg-[color:var(--surface)] p-3.5"
          style={{
            boxShadow:
              "0 14px 32px -22px rgba(10,10,10,0.18), 0 2px 4px rgba(10,10,10,0.04)",
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex h-6 items-center rounded-full bg-[color:var(--ink)] px-2.5 text-[11.5px] font-extrabold tracking-[-0.01em] text-[color:var(--on-accent)]" style={{ fontFeatureSettings: '"tnum" 1' }}>
              Lv.{user.level}
            </span>
            <span className="text-[12.5px] font-medium tracking-[-0.01em] text-[color:var(--ink-subtle)]" style={{ fontFeatureSettings: '"tnum" 1' }}>
              {progress.nextThreshold ? (
                <>
                  Lv.{user.level + 1}{" "}
                  <span className="font-bold text-[color:var(--ink)]">
                    {pointsToNext.toLocaleString()}pt
                  </span>
                </>
              ) : (
                "MAX"
              )}
            </span>
          </div>
          <div className="relative mt-2.5 h-2.5 overflow-hidden rounded-full bg-[color:var(--surface-sunken)]">
            <div
              className="absolute inset-0 rounded-full"
              style={{
                width: `${progressPct}%`,
                background: ACCENT_GRAD,
                transition:
                  "width 900ms var(--ease-spring), background 320ms ease",
              }}
            />
          </div>
        </div>

        {/* Stage road */}
        <div className="mt-[22px]">
          <SectionLabel as="span">
            {t("characters.growth_stage", locale)}
          </SectionLabel>
        </div>
        <div
          className="mt-2.5 rounded-[18px] border border-[rgba(255,255,255,0.8)] bg-[color:var(--surface)] px-3 pt-4 pb-3.5"
          style={{
            boxShadow:
              "0 12px 28px -22px rgba(10,10,10,0.16), 0 2px 4px rgba(10,10,10,0.04)",
          }}
        >
          <StageProgress currentStage={stage} locale={locale} />
        </div>

        {/* Badges */}
        <div className="mt-[22px] flex items-center justify-between gap-2">
          <SectionLabel as="span">{t("characters.badges", locale)}</SectionLabel>
          <span className="text-xs font-bold tracking-[-0.01em] text-[color:var(--ink-subtle)]" style={{ fontFeatureSettings: '"tnum" 1' }}>
            <span className="text-[color:var(--accent)]">{earnedCount}</span>
            <span> / {badges.length}</span>
          </span>
        </div>
        <div className="mt-2.5 grid grid-cols-3 gap-2">
          {badges.length === 0 && (
            <p className="col-span-full text-[13px] text-[color:var(--ink-subtle)]">
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
                    className="flex flex-col items-center gap-1.5 rounded-[14px] border border-[rgba(255,255,255,0.8)] bg-[color:var(--surface)] px-1.5 pt-3 pb-2.5"
                    style={{
                      boxShadow:
                        "0 10px 22px -18px rgba(10,10,10,0.18), 0 1px 2px rgba(10,10,10,0.03)",
                    }}
                  >
                    <span
                      aria-hidden
                      className="text-[32px] leading-none"
                    >
                      {b.icon}
                    </span>
                    <div className="w-full truncate text-center text-[11px] font-medium tracking-[-0.01em] text-[color:var(--ink)]">
                      {b.name}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1.5 rounded-[14px] bg-[color:var(--surface-sunken)] px-1.5 pt-3 pb-2.5">
                    <span
                      aria-hidden
                      className="text-2xl font-extrabold leading-none text-[#B5B5BE]"
                    >
                      ???
                    </span>
                    <div className="w-full truncate text-center text-[10px] font-medium tracking-[-0.01em] text-[color:var(--ink-subtle)]">
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
            className="mt-4 flex h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-[rgba(255,255,255,0.7)] bg-[color:var(--surface)] text-[13px] font-bold tracking-[-0.01em] text-[color:var(--accent)] no-underline"
            style={{ boxShadow: "0 8px 22px -20px rgba(10,10,10,0.2)" }}
          >
            {t("characters.change", locale)}
            <span aria-hidden>→</span>
          </Link>
        )}

        {/* Level table toggle */}
        <div className="mt-2.5">
          <LevelTable currentLifetime={user.lifetime_earned} />
        </div>
      </div>
    </div>
  );
}
