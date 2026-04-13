import { redirect } from "next/navigation";
import { requireUser } from "@/features/auth/current-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyButton } from "./_copy";
import { BackButton } from "@/components/ui/back-button";
import { t, type Locale } from "@/lib/i18n";

export default async function InvitePage() {
  const { user, family } = await requireUser();
  const locale = ((family as unknown as { locale?: string }).locale as Locale) || "ko";
  if (user.role !== "parent") redirect("/family");

  return (
    <div className="mx-auto max-w-md space-y-4">
      <BackButton fallback="/family" />
      <Card>
        <CardHeader>
          <CardTitle>{t("family.invite_title", locale)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-center">
          <div className="font-mono text-4xl font-bold tracking-widest">{family.invite_code}</div>
          <p className="text-sm text-muted-foreground">
            {t("family.invite_desc", locale)}
          </p>
          <CopyButton code={family.invite_code} />
        </CardContent>
      </Card>
    </div>
  );
}
