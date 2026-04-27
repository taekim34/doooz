import { requireUser } from "@/features/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { CharacterIcon } from "@/components/molecules/character-icon";
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
    <div className="relative min-h-screen bg-[color:var(--bg)] text-[color:var(--ink)]">
      <style>{`
        @keyframes fmTlRise { to { opacity: 1; transform: none; } }
        .fm-tl-rise { opacity: 0; transform: translateY(8px); animation: fmTlRise 520ms var(--ease-spring) forwards; }
        @media (prefers-reduced-motion: reduce) {
          .fm-tl-rise { animation: none; opacity: 1; transform: none; }
        }
      `}</style>

      {/* Back */}
      <div className="flex items-center px-5 pt-3 pb-2">
        <BackButton href="/" />
      </div>

      <div className="mx-auto max-w-md px-5 pt-1 pb-6">
        <SectionLabel as="span">
          {t("common.family", locale)}
        </SectionLabel>
        <div className="mt-1 mb-[22px] flex items-baseline justify-between gap-2">
          <h1 className="m-0 text-2xl font-extrabold tracking-[-0.02em] text-[color:var(--ink)]">
            {family.name}
          </h1>
          <span className="whitespace-nowrap text-xs font-semibold tracking-[-0.01em] text-[color:var(--ink-subtle)]" style={{ fontFeatureSettings: '"tnum" 1' }}>
            {t("family.role_parent", locale)} {parents} ·{" "}
            {t("family.role_child", locale)} {kids}
          </span>
        </div>

        {/* Members */}
        <div className="flex flex-col gap-2">
          {members.map((m, i) => (
            <Link
              key={m.id}
              href={`/family/member/${m.id}` as never}
              className="fm-tl-rise flex items-center gap-3 rounded-[14px] bg-[color:var(--surface-raised)] p-3 no-underline transition-[background] duration-150"
              style={{
                animationDelay: `${i * 40}ms`,
                color: "inherit",
              }}
            >
              <div
                className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl"
                style={{ background: tileGrad(m.character_id, m.id) }}
              >
                <CharacterIcon
                  id={m.character_id}
                  stage={getStage(m.level)}
                  pixelSize={36}
                />
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-px">
                <div className="truncate text-[15px] font-bold tracking-[-0.01em] text-[color:var(--ink)]">
                  {m.display_name}
                </div>
                <div className="whitespace-nowrap text-xs font-medium tracking-[-0.01em] text-[color:var(--ink-subtle)]" style={{ fontFeatureSettings: '"tnum" 1' }}>
                  Lv.{m.level} ·{" "}
                  {m.role === "parent"
                    ? t("family.role_parent", locale)
                    : t("family.role_child", locale)}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2.5">
                <span className="whitespace-nowrap text-[13px] font-semibold tracking-[-0.01em] text-[color:var(--ink)]" style={{ fontFeatureSettings: '"tnum" 1' }}>
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
        <div className="mx-auto max-w-md px-5 pt-2.5 pb-[22px]">
          <Link
            href={"/family/invite" as never}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-[10px] border border-[color:var(--border)] bg-[color:var(--surface)] text-[15px] font-semibold tracking-[-0.01em] text-[color:var(--ink)] no-underline transition-[transform,background] duration-200"
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
