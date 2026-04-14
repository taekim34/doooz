import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { t } from "@/lib/i18n";
import { getAuthLocale } from "@/lib/i18n/auth-locale";

export default async function PrivacyPage() {
  const locale = await getAuthLocale();

  const sections = [
    {
      title: t("privacy.section_data_title", locale),
      items: [
        t("privacy.section_data_parent", locale),
        t("privacy.section_data_child", locale),
        t("privacy.section_data_family", locale),
        t("privacy.section_data_activity", locale),
      ],
    },
    {
      title: t("privacy.section_why_title", locale),
      body: t("privacy.section_why_desc", locale),
    },
    {
      title: t("privacy.section_storage_title", locale),
      body: t("privacy.section_storage_desc", locale),
    },
    {
      title: t("privacy.section_children_title", locale),
      body: t("privacy.section_children_desc", locale),
    },
    {
      title: t("privacy.section_cookies_title", locale),
      body: t("privacy.section_cookies_desc", locale),
    },
    {
      title: t("privacy.section_push_title", locale),
      body: t("privacy.section_push_desc", locale),
    },
    {
      title: t("privacy.section_deletion_title", locale),
      body: t("privacy.section_deletion_desc", locale),
    },
    {
      title: t("privacy.section_export_title", locale),
      body: t("privacy.section_export_desc", locale),
    },
    {
      title: t("privacy.section_opensource_title", locale),
      body: t("privacy.section_opensource_desc", locale),
    },
    {
      title: t("privacy.section_contact_title", locale),
      body: t("privacy.section_contact_desc", locale),
    },
    {
      title: t("privacy.section_changes_title", locale),
      body: t("privacy.section_changes_desc", locale),
    },
  ] as const;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("privacy.title", locale)}</CardTitle>
        <p className="text-xs text-muted-foreground">{t("privacy.last_updated", locale)}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-muted-foreground">{t("privacy.intro", locale)}</p>

        {sections.map((section) => (
          <div key={section.title}>
            <h2 className="mb-1 text-sm font-semibold">{section.title}</h2>
            {"body" in section && section.body ? (
              <p className="text-sm text-muted-foreground">{section.body}</p>
            ) : null}
            {"items" in section && section.items ? (
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}

        <div className="pt-2 text-center">
          <Link href="/login" className="text-sm text-primary underline">
            {t("privacy.back_to_login", locale)}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
