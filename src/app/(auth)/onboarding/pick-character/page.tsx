import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { t } from "@/lib/i18n";
import { getAuthLocale } from "@/lib/i18n/auth-locale";
import { FadeUp } from "@/components/molecules";
import { CharacterAvatar } from "@/components/molecules/character-avatar";
import { EyebrowLabel, LevelPill } from "@/components/atoms";

async function pickAction(formData: FormData) {
  "use server";
  const id = String(formData.get("character_id") || "");
  if (!id) redirect("/onboarding/pick-character");
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");
  await supabase.from("users").update({ character_id: id }).eq("id", authUser.id);
  redirect("/onboarding/finish");
}

export default async function PickCharacterPage() {
  const locale = await getAuthLocale();
  const supabase = await createClient();

  const { data: characters } = await supabase
    .from("characters")
    .select("id, name, unlock_level")
    .order("unlock_level");
  const list = (characters ?? []) as Array<{
    id: string;
    name: string;
    unlock_level: number;
  }>;

  return (
    <div>
      <FadeUp>
        <EyebrowLabel className="text-center">STEP 3 of 3</EyebrowLabel>
        <h2
          className="mb-6 text-center text-3xl font-extrabold text-[color:var(--ink)]"
        >
          {t("auth.pick_character", locale)}
        </h2>
      </FadeUp>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {list.map((c, i) => {
          const locked = c.unlock_level > 0;
          return (
            <FadeUp key={c.id} delay={i * 60}>
              <form action={pickAction}>
                <input type="hidden" name="character_id" value={c.id} />
                <button
                  type="submit"
                  disabled={locked}
                  className="relative flex w-full flex-col items-center rounded-lg p-4 text-sm transition-spring hover:translate-y-[-2px] disabled:pointer-events-none disabled:opacity-40"
                  style={{
                    background: "var(--surface-raised)",
                    border: "1px solid var(--border, #f0f0f0)",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  }}
                >
                  <CharacterAvatar characterId={c.id} size="md" />
                  <span className="mt-2 text-[color:var(--ink)]">{c.name}</span>
                  {locked && (
                    <div className="absolute top-2 right-2">
                      <LevelPill level={c.unlock_level} />
                    </div>
                  )}
                </button>
              </form>
            </FadeUp>
          );
        })}
      </div>
    </div>
  );
}
