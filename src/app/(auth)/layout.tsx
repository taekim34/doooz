import Image from "next/image";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getCurrentAuth } from "@/features/auth/current-user";
import { LocaleProvider } from "@/lib/i18n/context";
import { AuthLocaleSwitcher } from "./_locale-switcher";
import { NavigationLoading } from "@/app/(app)/_navigation-loading";
import { GlowBlob } from "@/components/ui/glow-blob";
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
        <main
          data-mode="parent"
          className="relative flex h-[100dvh] items-center justify-center overflow-auto p-4"
          style={{ background: "var(--bg)" }}
        >
          <GlowBlob className="top-0 right-0 h-64 w-64" color="#FFE4E9" />
          <div className="relative z-10 w-full max-w-md">
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
