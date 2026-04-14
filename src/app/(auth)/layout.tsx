import Image from "next/image";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getCurrentAuth } from "@/features/auth/current-user";
import { LocaleProvider } from "@/lib/i18n/context";
import { AuthLocaleSwitcher } from "./_locale-switcher";
import { NavigationLoading } from "@/app/(app)/_navigation-loading";
import type { Locale } from "@/lib/i18n";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const auth = await getCurrentAuth();
  if (auth?.hasUserRow && auth.hasCharacter) {
    redirect("/");
  }

  const cookieStore = await cookies();
  const locale = (cookieStore.get("doooz_locale")?.value || "ko") as Locale;

  // Show language switcher only before login (not during onboarding)
  const showLocaleSwitcher = !auth;

  return (
    <LocaleProvider locale={locale}>
      <NavigationLoading>
        <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
          <div className="w-full max-w-md">
            <div className="mb-6 flex items-center justify-between">
              <div />
              <Image src="/logo.png" alt="DOOOZ" width={160} height={53} priority />
              {showLocaleSwitcher ? <AuthLocaleSwitcher current={locale} /> : <div />}
            </div>
            {children}
          </div>
        </main>
      </NavigationLoading>
    </LocaleProvider>
  );
}
