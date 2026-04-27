import { t } from "@/lib/i18n";
import { getAuthLocale } from "@/lib/i18n/auth-locale";
import { CreateFamilyForm } from "./_form";

export default async function CreateFamilyPage() {
  const locale = await getAuthLocale();

  return (
    <div className="flex flex-col w-full">
      <div className="flex flex-col items-center text-center">
        <h1 className="m-0 text-2xl font-extrabold tracking-[-0.02em] text-[color:var(--ink)]">
          {t("auth.create_family", locale)}
        </h1>
        <p className="mt-2 mb-0 text-sm font-medium text-[color:var(--ink-muted)] tracking-[-0.01em] leading-[1.5]">
          {t("auth.create_family_sub", locale)}
        </p>
      </div>
      <CreateFamilyForm locale={locale} />
    </div>
  );
}
