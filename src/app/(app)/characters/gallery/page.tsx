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
      className="relative min-h-screen"
      style={{
        background: BG,
        color: "var(--ink)",      }}
    >
      <style>{`
        @keyframes cgTlRise { to { opacity: 1; transform: none; } }
        .cg-tl-rise { opacity: 0; transform: translateY(8px); animation: cgTlRise 520ms cubic-bezier(0.16,1,0.3,1) forwards; }
        @media (prefers-reduced-motion: reduce) {
          .cg-tl-rise { animation: none; opacity: 1; transform: none; }
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
        <BackButton href="/characters" variant="glass" />
        <div style={{ width: 36 }} />
        <div style={{ width: 36 }} />
      </div>

      <div className="mx-auto max-w-md" style={{ padding: "4px 20px 28px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 8,
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
            {t("characters.gallery_title", locale)}
          </h1>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "var(--ink-subtle)",
              letterSpacing: "-0.01em",
              fontFeatureSettings: '"tnum" 1',
            }}
          >
            <span style={{ color: ACCENT }}>{unlockedCount}</span>
            <span> / {list.length}</span>
          </span>
        </div>
        <p
          style={{
            margin: "6px 0 20px",
            fontSize: 14,
            fontWeight: 500,
            color: "var(--ink-subtle)",
            letterSpacing: "-0.01em",
            lineHeight: 1.45,
          }}
        >
          {t("characters.gallery_desc", locale)}
        </p>

        {showLockedBanner && (
          <div
            style={{
              marginBottom: 16,
              padding: "14px 16px",
              background: "var(--surface)",
              borderRadius: 14,
              border: "1px solid rgba(255,107,157,0.18)",
              boxShadow: "0 8px 20px -14px rgba(255,107,157,0.25)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "var(--ink)",
                letterSpacing: "-0.01em",
              }}
            >
              {t("characters.gallery_locked_title", locale)}
            </div>
            <div
              style={{
                marginTop: 4,
                fontSize: 12,
                fontWeight: 500,
                color: "var(--ink-subtle)",
                letterSpacing: "-0.01em",
              }}
            >
              {t("characters.gallery_locked_desc", locale).replace(
                "{level}",
                String(user.level),
              )}
            </div>
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 10,
          }}
        >
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
                  style={{
                    position: "relative",
                    width: "100%",
                    padding: "16px 8px 12px",
                    borderRadius: 14,
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
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                    transition:
                      "transform 200ms cubic-bezier(0.16,1,0.3,1), box-shadow 200ms cubic-bezier(0.16,1,0.3,1)",
                    opacity: locked ? 0.4 : 1,
                  }}
                >
                  {isCurrent && (
                    <span
                      style={{
                        position: "absolute",
                        top: 6,
                        left: 6,
                        display: "inline-flex",
                        alignItems: "center",
                        height: 18,
                        padding: "0 7px",
                        borderRadius: 9999,
                        background: ACCENT,
                        color: "var(--on-accent)",
                        fontSize: 9.5,
                        fontWeight: 800,
                        letterSpacing: "0.02em",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {t("characters.current_character", locale)}
                    </span>
                  )}
                  {locked && isSoon && (
                    <span
                      style={{
                        position: "absolute",
                        top: 6,
                        left: 6,
                        display: "inline-flex",
                        alignItems: "center",
                        height: 18,
                        padding: "0 7px",
                        borderRadius: 9999,
                        background: "var(--success)",
                        color: "var(--on-accent)",
                        fontSize: 9.5,
                        fontWeight: 800,
                        letterSpacing: "0.02em",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {t("characters.gallery_soon", locale)}
                    </span>
                  )}
                  {locked && (
                    <span
                      style={{
                        position: "absolute",
                        top: 6,
                        right: 6,
                        display: "inline-flex",
                        alignItems: "center",
                        height: 18,
                        padding: "0 7px",
                        borderRadius: 9999,
                        background: "var(--ink)",
                        color: "var(--on-accent)",
                        fontSize: 9.5,
                        fontWeight: 800,
                        letterSpacing: "0.02em",
                        whiteSpace: "nowrap",
                        fontFeatureSettings: '"tnum" 1',
                      }}
                    >
                      Lv.{c.unlock_level}
                    </span>
                  )}

                  <span
                    aria-hidden
                    style={{
                      fontSize: 48,
                      lineHeight: 1,
                      display: "inline-block",
                      filter: locked ? "grayscale(1)" : "none",
                    }}
                  >
                    {characterEmoji(c.id, 1)}
                  </span>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--ink)",
                      letterSpacing: "-0.01em",
                      whiteSpace: "nowrap",
                    }}
                  >
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
