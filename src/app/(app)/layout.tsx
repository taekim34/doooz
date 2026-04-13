import { requireUser } from "@/features/auth/current-user";
import { AppNav } from "./_nav";
import { PushSubscriber } from "./_push-subscriber";
import { LocaleProvider } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, family } = await requireUser();
  const locale = (family.locale || "ko") as Locale;

  return (
    <LocaleProvider locale={locale}>
      <div className="flex min-h-screen flex-col md:flex-row">
        <AppNav role={user.role} userName={user.display_name} familyName={family.name} locale={locale} />
        <main className="flex-1 p-4 pb-24 md:p-8 md:pb-8">{children}</main>
        <PushSubscriber />
      </div>
    </LocaleProvider>
  );
}
