import { Suspense } from "react";
import { requireUser } from "@/features/auth/current-user";
import { AppNav } from "./_nav";
import { PushSubscriber } from "./_push-subscriber";
import { ForegroundRefresh } from "./_foreground-refresh";
import { NavigationLoading } from "./_navigation-loading";
import { LocaleProvider } from "@/lib/i18n/context";
import { MobileNavProvider } from "./_mobile-nav-context";
import { MobileDrawer } from "./_mobile-drawer";
import { MobileFloatingHeader } from "./_mobile-floating-header";
import type { Locale } from "@/lib/i18n";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, family } = await requireUser();
  const locale = (family.locale || "ko") as Locale;

  return (
    <LocaleProvider locale={locale}>
      <Suspense>
        <NavigationLoading>
          <MobileNavProvider>
            <div
              data-role={user.role === "child" ? "kid" : "parent"}
              data-theme={user.tone}
              data-mode={user.color_mode}
              className="app-shell flex min-h-screen flex-col"
            >
              <AppNav role={user.role} familyName={family.name} locale={locale} />

              <main className="flex-1 overflow-x-hidden">
                {/* Mobile: floating header (per-page slots) + edge-to-edge content */}
                <div className="md:hidden">
                  <MobileFloatingHeader />
                  <div className="px-4 pb-10">{children}</div>
                </div>

                {/* Desktop: max-width content; gradient (kid) or surface (parent) bleeds through */}
                <div className="mx-auto hidden max-w-[960px] px-[clamp(16px,3vw,32px)] py-[clamp(16px,2.5vw,32px)] pb-14 md:block">
                  {children}
                </div>
              </main>

              <MobileDrawer role={user.role === "child" ? "child" : "parent"} familyName={family.name} locale={locale} />
              <PushSubscriber />
              <ForegroundRefresh />
            </div>
          </MobileNavProvider>
        </NavigationLoading>
      </Suspense>
    </LocaleProvider>
  );
}
