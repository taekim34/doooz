import { requireUser } from "@/features/auth/current-user";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { characterEmoji } from "@/features/characters/emoji-map";
import { getStage } from "@/lib/level";
import Link from "next/link";
import { t, type Locale } from "@/lib/i18n";

export default async function FamilyPage() {
  const { user, family } = await requireUser();
  const locale = ((family as unknown as { locale?: string }).locale as Locale) || "ko";
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

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{family.name}</h1>
        {user.role === "parent" && (
          <Link href="/family/invite" className="text-sm text-primary underline">
            {t("family.invite", locale)}
          </Link>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {members.map((m) => (
          <Link key={m.id} href={`/family/member/${m.id}` as never}>
            <Card className="transition hover:border-primary">
              <CardContent className="flex items-center gap-4 p-4">
                <span className="text-4xl">{characterEmoji(m.character_id, getStage(m.level))}</span>
                <div className="flex-1">
                  <div className="font-semibold">{m.display_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {m.role === "parent" ? t("family.role_parent", locale) : t("family.role_child", locale)} · Lv.{m.level}
                  </div>
                  <div className="text-sm">{m.current_balance.toLocaleString()} pt</div>
                </div>
                <span className="text-muted-foreground">→</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
