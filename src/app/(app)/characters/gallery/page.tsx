import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { BackButton } from "@/components/atoms";
import { requireUser } from "@/features/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { characterEmoji } from "@/features/characters/emoji-map";
import { t, type Locale } from "@/lib/i18n";

const ACCENT = "var(--accent)";
const ACCENT_SHADOW = "rgba(255,107,157,0.35)";
const BG = "linear-gradient(180deg, #FFF5EC 0%, #FFE4E9 40%, #E5EFFF 100%)";

async function switchCharacter(formData: FormData) {
  "use server";
  const characterId = String(formData.get("character_id") || "");
  if (!characterId) return;

  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  const { data: char } = await supabase
    .from("characters")
    .select("id, unlock_level")
    .eq("id", characterId)
    .single();
  if (!char) return;

  const { data: me } = await supabase
    .from("users")
    .select("level, role")
    .eq("id", authUser.id)
    .single();
  if (!me || me.role !== "child") return;
  if (me.level < char.unlock_level) return;

  await supabase
    .from("users")
    .update({ character_id: characterId })
    .eq("id", authUser.id);

  revalidatePath("/characters");
  revalidatePath("/characters/gallery");
  redirect("/characters");
}

export default async function GalleryPage() {
  const { user, family } = await requireUser();
  const locale = (family.locale || "ko") as Locale;
  if (user.role === "parent") redirect("/");

  const supabase = await createClient();
  const { data } = await supabase
    .from("characters")
    .select("id, name, unlock_level")
    .order("unlock_level");
  const list = (data ?? []) as Array<{
    id: string;
    name: string;
    unlock_level: number;
  }>;

  const unlockedCount = list.filter((c) => c.unlock_level <= user.level).length;

  // Find next character to unlock (locked + lowest unlock_level above user.level)
  const nextUnlockId =
    list.find((c) => c.unlock_level > user.level)?.id ?? null;

  // Show guidance banner when nothing is unlocked yet (locked state)
  const showLockedBanner = unlockedCount === 0;

  return (
    <div
      className="relative min-h-screen text-[color:var(--ink)]"
      style={{ background: BG }}
    >
      <style>{`
        @keyframes cgTlRise { to { opacity: 1; transform: none; } }
        .cg-tl-rise { opacity: 0; transform: translateY(8px); animation: cgTlRise 520ms var(--ease-spring) forwards; }
        @media (prefers-reduced-motion: reduce) {
          .cg-tl-rise { animation: none; opacity: 1; transform: none; }
        }
      `}</style>

      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-2.5">
        <BackButton href="/characters" variant="glass" />
        <div className="w-9" />
        <div className="w-9" />
      </div>

      <div className="mx-auto max-w-md px-5 pt-1 pb-7">
        <div className="flex items-baseline justify-between gap-2">
          <h1 className="m-0 text-2xl font-extrabold tracking-[-0.02em] text-[color:var(--ink)]">
            {t("characters.gallery_title", locale)}
          </h1>
          <span className="text-xs font-bold tracking-[-0.01em] text-[color:var(--ink-subtle)]" style={{ fontFeatureSettings: '"tnum" 1' }}>
            <span className="text-[color:var(--accent)]">{unlockedCount}</span>
            <span> / {list.length}</span>
          </span>
        </div>
        <p className="mt-1.5 mb-5 text-sm font-medium leading-[1.45] tracking-[-0.01em] text-[color:var(--ink-subtle)]">
          {t("characters.gallery_desc", locale)}
        </p>

        {showLockedBanner && (
          <div
            className="mb-4 rounded-[14px] border border-[rgba(255,107,157,0.18)] bg-[color:var(--surface)] px-4 py-3.5 text-center"
            style={{ boxShadow: "0 8px 20px -14px rgba(255,107,157,0.25)" }}
          >
            <div className="text-base font-semibold tracking-[-0.01em] text-[color:var(--ink)]">
              {t("characters.gallery_locked_title", locale)}
            </div>
            <div className="mt-1 text-xs font-medium tracking-[-0.01em] text-[color:var(--ink-subtle)]">
              {t("characters.gallery_locked_desc", locale).replace(
                "{level}",
                String(user.level),
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2.5">
          {list.map((c, i) => {
            const locked = c.unlock_level > user.level;
            const isCurrent = c.id === user.character_id;
            const isSoon = locked && c.id === nextUnlockId;

            return (
              <form
                key={c.id}
                action={switchCharacter}
                className="cg-tl-rise"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <input type="hidden" name="character_id" value={c.id} />
                <button
                  type="submit"
                  disabled={locked || isCurrent}
                  className="relative flex w-full flex-col items-center gap-1.5 rounded-[14px] transition-[transform,box-shadow] duration-200"
                  style={{
                    padding: "16px 8px 12px",
                    background: locked
                      ? "rgba(255,255,255,0.55)"
                      : "var(--surface)",
                    border: isCurrent
                      ? `2px solid ${ACCENT}`
                      : "1px solid rgba(255,255,255,0.8)",
                    boxShadow: locked
                      ? "none"
                      : isCurrent
                        ? `0 10px 24px -14px ${ACCENT_SHADOW}`
                        : "0 10px 22px -18px rgba(10,10,10,0.18), 0 1px 2px rgba(10,10,10,0.03)",
                    cursor: locked || isCurrent ? "default" : "pointer",
                    opacity: locked ? 0.4 : 1,
                  }}
                >
                  {isCurrent && (
                    <span className="absolute left-1.5 top-1.5 inline-flex h-[18px] items-center whitespace-nowrap rounded-full bg-[color:var(--accent)] px-[7px] text-[9.5px] font-extrabold tracking-[0.02em] text-[color:var(--on-accent)]">
                      {t("characters.current_character", locale)}
                    </span>
                  )}
                  {locked && isSoon && (
                    <span className="absolute left-1.5 top-1.5 inline-flex h-[18px] items-center whitespace-nowrap rounded-full bg-[color:var(--success)] px-[7px] text-[9.5px] font-extrabold tracking-[0.02em] text-[color:var(--on-accent)]">
                      {t("characters.gallery_soon", locale)}
                    </span>
                  )}
                  {locked && (
                    <span className="absolute right-1.5 top-1.5 inline-flex h-[18px] items-center whitespace-nowrap rounded-full bg-[color:var(--ink)] px-[7px] text-[9.5px] font-extrabold tracking-[0.02em] text-[color:var(--on-accent)]" style={{ fontFeatureSettings: '"tnum" 1' }}>
                      Lv.{c.unlock_level}
                    </span>
                  )}

                  <span
                    aria-hidden
                    className="inline-block text-[48px] leading-none"
                    style={{ filter: locked ? "grayscale(1)" : "none" }}
                  >
                    {characterEmoji(c.id, 1)}
                  </span>
                  <div className="whitespace-nowrap text-[13px] font-semibold tracking-[-0.01em] text-[color:var(--ink)]">
                    {c.name}
                  </div>
                </button>
              </form>
            );
          })}
        </div>
      </div>
    </div>
  );
}
