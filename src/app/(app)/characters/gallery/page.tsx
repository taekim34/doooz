import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/features/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { characterEmoji } from "@/features/characters/emoji-map";
import { BackButton } from "@/components/ui/back-button";
import { t, type Locale } from "@/lib/i18n";

async function switchCharacter(formData: FormData) {
  "use server";
  const characterId = String(formData.get("character_id") || "");
  if (!characterId) return;

  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  // Verify character exists and user meets unlock_level
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
  const list = (data ?? []) as Array<{ id: string; name: string; unlock_level: number }>;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <BackButton fallback="/characters" />
      <h1 className="text-2xl font-bold">{t("characters.gallery_title", locale)}</h1>
      <p className="text-sm text-muted-foreground">
        {t("characters.gallery_desc", locale)}
      </p>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        {list.map((c) => {
          const locked = c.unlock_level > user.level;
          const isCurrent = c.id === user.character_id;
          return (
            <form key={c.id} action={switchCharacter}>
              <input type="hidden" name="character_id" value={c.id} />
              <button
                type="submit"
                disabled={locked || isCurrent}
                className={`flex w-full flex-col items-center rounded border p-4 text-sm transition-all ${
                  locked
                    ? "cursor-not-allowed opacity-30 grayscale"
                    : isCurrent
                      ? "border-primary bg-primary/10 ring-2 ring-primary"
                      : "cursor-pointer hover:border-primary hover:bg-muted"
                } disabled:pointer-events-none`}
              >
                <span className="text-4xl">{characterEmoji(c.id, 1)}</span>
                <span className="mt-1">{c.name}</span>
                {locked && (
                  <span className="text-xs text-muted-foreground">Lv.{c.unlock_level} {t("characters.unlock_level", locale)}</span>
                )}
                {isCurrent && (
                  <span className="mt-1 text-xs font-semibold text-primary">{t("characters.current_character", locale)}</span>
                )}
              </button>
            </form>
          );
        })}
      </div>
    </div>
  );
}
