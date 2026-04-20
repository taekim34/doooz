import { Suspense } from "react";
import { requireUser } from "@/features/auth/current-user";
import { AppNav } from "./_nav";
import { PushSubscriber } from "./_push-subscriber";
import { ForegroundRefresh } from "./_foreground-refresh";
import { NavigationLoading } from "./_navigation-loading";
import { LocaleProvider } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, family } = await requireUser();
  const locale = (family.locale || "ko") as Locale;

  return (
    <LocaleProvider locale={locale}>
      <Suspense>
        <NavigationLoading>
          <div
            data-role={user.role === "child" ? "kid" : "parent"}
            data-theme={user.tone}
            data-mode={user.mode}
            className="flex min-h-screen flex-col bg-[var(--surface-raised)]"
          >
            <AppNav role={user.role} userName={user.display_name} familyName={family.name} locale={locale} />

            <main className="flex-1 overflow-x-hidden">
              {/* Mobile: direct content with bottom-tab padding */}
              <div className="p-4 pb-24 md:hidden">{children}</div>

              {/* Desktop: PhoneCanvas card wrapper */}
              <div
                className="mx-auto hidden max-w-[960px] p-[clamp(16px,2.5vw,32px)] px-[clamp(12px,3vw,24px)] pb-14 md:block"
              >
                <div
                  className="overflow-hidden rounded-3xl border border-white/80 bg-white"
                  style={{
                    boxShadow: "0 24px 48px -20px rgba(45,27,61,0.18), 0 2px 4px rgba(10,10,10,0.04)",
                  }}
                >
                  <div className="p-6 lg:p-8">{children}</div>
                </div>
              </div>
            </main>

            <PushSubscriber />
            <ForegroundRefresh />
          </div>
        </NavigationLoading>
      </Suspense>
    </LocaleProvider>
  );
}
