import { requireUser } from "@/features/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { characterEmoji } from "@/features/characters/emoji-map";
import { getStage, progressToNextLevel, getLevelTitle, LEVEL_THRESHOLDS } from "@/lib/level";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { BackButton } from "@/components/ui/back-button";
import { LevelTable } from "./_level-table";
import { StageProgress } from "./_stage-progress";
import { t, type Locale } from "@/lib/i18n";

export default async function CharactersPage() {
  const { user, family } = await requireUser();
  const locale = (family.locale || "ko") as Locale;
  const supabase = await createClient();

  const { data: allBadges } = await supabase.from("badges").select("id, name, icon, description").order("sort_order");
  const { data: earned } = await supabase
    .from("user_badges")
    .select("badge_id")
    .eq("user_id", user.id);

  const earnedSet = new Set(((earned ?? []) as Array<{ badge_id: string }>).map((b) => b.badge_id));
  const badges = (allBadges ?? []) as Array<{
    id: string;
    name: string;
    icon: string | null;
    description: string | null;
  }>;

  const stage = getStage(user.level);
  const progress = progressToNextLevel(user.lifetime_earned);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <BackButton fallback="/" />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("characters.my_character", locale)}</h1>
        <Link href="/characters/gallery" className="text-sm text-primary underline">
          {t("characters.change", locale)}
        </Link>
      </div>
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-6">
            <div className="text-7xl">{characterEmoji(user.character_id, stage)}</div>
            <div className="flex-1">
              <div className="text-lg font-semibold">{t("settings.character_label", locale)} Lv. {user.level} · {getLevelTitle(user.level, (k) => t(k, locale))}</div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${Math.round(progress.fraction * 100)}%` }}
                />
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {user.lifetime_earned.toLocaleString()} /{" "}
                {progress.nextThreshold?.toLocaleString() ?? "MAX"}
              </div>
              <LevelTable currentLevel={user.level} />
            </div>
          </div>

          {/* Stage progress */}
          <StageProgress currentStage={stage} locale={locale} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("characters.badges", locale)} ({earnedSet.size}/{badges.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {badges.map((b) => {
              const has = earnedSet.has(b.id);
              return (
                <div
                  key={b.id}
                  className={`flex flex-col items-center rounded-lg border p-3 text-center ${
                    has ? "border-primary bg-primary/5" : "opacity-50 grayscale"
                  }`}
                >
                  <span className="text-3xl">{b.icon}</span>
                  <span className="mt-1 text-xs font-medium">{b.name}</span>
                  {!has && b.description && (
                    <span className="mt-1 text-[10px] text-muted-foreground">{b.description}</span>
                  )}
                  {has && (
                    <span className="mt-1 text-[10px] text-primary font-medium">{t("characters.achieved", locale)}</span>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
