import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { characterEmoji } from "@/features/characters/emoji-map";
import { t } from "@/lib/i18n";
import { getAuthLocale } from "@/lib/i18n/auth-locale";

async function pickAction(formData: FormData) {
  "use server";
  const id = String(formData.get("character_id") || "");
  if (!id) redirect("/onboarding/pick-character");
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");
  // Defense-in-depth: use admin client so this post-onboarding write
  // always succeeds regardless of RLS state.
  const admin = createAdminClient();
  await admin.from("users").update({ character_id: id }).eq("id", authUser.id);
  redirect("/");
}

export default async function PickCharacterPage() {
  const locale = await getAuthLocale();
  const supabase = await createClient();

  const { data: characters } = await supabase
    .from("characters")
    .select("id, name, unlock_level")
    .order("unlock_level");
  const list = (characters ?? []) as unknown as Array<{
    id: string;
    name: string;
    unlock_level: number;
  }>;

  return (
    <div>
      <h2 className="mb-4 text-center text-xl font-semibold">{t("auth.pick_character", locale)}</h2>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {list.map((c) => {
          const locked = c.unlock_level > 0;
          return (
            <form key={c.id} action={pickAction}>
              <input type="hidden" name="character_id" value={c.id} />
              <button
                type="submit"
                disabled={locked}
                className="flex w-full flex-col items-center rounded-lg border bg-background p-4 text-sm shadow-sm transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="text-4xl">{characterEmoji(c.id, 1)}</span>
                <span className="mt-2">{c.name}</span>
                {locked && <span className="text-xs text-muted-foreground">Lv.{c.unlock_level} {t("auth.unlock", locale)}</span>}
              </button>
            </form>
          );
        })}
      </div>
    </div>
  );
}
