import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FadeUp } from "@/components/ui/fade-up";
import { EyebrowLabel } from "@/components/ui/eyebrow-label";
import { CharacterAvatar } from "@/components/ui/character-avatar";
import { InviteCodeCard } from "@/components/ui/invite-code-card";
import { Confetti } from "@/components/ui/confetti";
import { buttonVariants } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import { getAuthLocale } from "@/lib/i18n/auth-locale";
import Link from "next/link";
import type { Route } from "next";

export default async function OnboardingFinishPage() {
  const locale = await getAuthLocale();
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login");

  const { data: user } = await supabase
    .from("users")
    .select("character_id, family_id")
    .eq("id", authUser.id)
    .single();

  if (!user?.family_id) redirect("/onboarding/create-family");

  const { data: family } = await supabase
    .from("families")
    .select("name, invite_code")
    .eq("id", user.family_id)
    .single();

  if (!family) redirect("/");

  return (
    <div className="space-y-6 text-center">
      <Confetti />

      <FadeUp>
        <EyebrowLabel className="text-center">
          {t("auth.setup_complete", locale)}
        </EyebrowLabel>
        <h1
          className="mt-2 text-3xl font-extrabold"
          style={{ color: "var(--ink)" }}
        >
          {family.name} {t("auth.family_created", locale)}
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
          {t("auth.invite_family_desc", locale)}
        </p>
      </FadeUp>

      <FadeUp delay={80}>
        <div className="flex justify-center">
          <div className="animate-bounce">
            <CharacterAvatar
              characterId={user.character_id}
              stage={1}
              size="hero"
            />
          </div>
        </div>
      </FadeUp>

      <FadeUp delay={160}>
        <InviteCodeCard
          code={family.invite_code ?? "---"}
          copyLabel={t("family.copy", locale)}
          copiedLabel={t("family.copied", locale)}
        />
      </FadeUp>

      <FadeUp delay={240}>
        <div className="space-y-3">
          <Link
            href={"/signup" as Route}
            className={buttonVariants({ className: "w-full" })}
          >
            {t("auth.create_child_account", locale)}
          </Link>
          <Link
            href={"/" as Route}
            className="block text-sm font-medium"
            style={{ color: "var(--muted)" }}
          >
            {t("auth.skip_for_now", locale)} →
          </Link>
        </div>
      </FadeUp>
    </div>
  );
}
