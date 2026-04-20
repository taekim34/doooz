import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getCurrentAuth } from "@/features/auth/current-user";
import { LocaleProvider } from "@/lib/i18n/context";
import { NavigationLoading } from "@/app/(app)/_navigation-loading";
import { AuthLocaleSwitcher } from "./_locale-switcher";
import { t, type Locale } from "@/lib/i18n";

const HERO_PILL_KEYS = [
  "auth.hero_pill_1",
  "auth.hero_pill_2",
  "auth.hero_pill_3",
  "auth.hero_pill_4",
  "auth.hero_pill_5",
] as const;

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const auth = await getCurrentAuth();
  if (auth?.hasUserRow && auth.hasCharacter) {
    redirect("/");
  }

  const cookieStore = await cookies();
  const locale = (cookieStore.get("doooz_locale")?.value || "ko") as Locale;

  return (
    <LocaleProvider locale={locale}>
      <NavigationLoading>
        <main
          data-role="parent" data-theme="warm"
          className="relative flex min-h-[100dvh] items-center justify-center overflow-auto lg:grid lg:min-h-[100dvh] lg:grid-cols-2"
          style={{ background: "var(--surface)" }}
        >
          {/* ── Hero column (desktop only) ── */}
          <div
            className="hidden lg:flex relative flex-col items-center justify-center overflow-hidden self-stretch"
            style={{
              background: "linear-gradient(135deg, #FFE4E9 0%, #FFF0DD 55%, #E5EFFF 100%)",
              padding: "clamp(40px, 5vw, 72px)",
            }}
          >
            {/* Decorative blobs */}
            <div
              aria-hidden
              className="pointer-events-none absolute -left-[80px] -top-[80px] h-[360px] w-[360px] rounded-full"
              style={{
                opacity: 0.6,
                filter: "blur(80px)",
                background: "radial-gradient(closest-side, #FFB6C1 0%, transparent 100%)",
              }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-[60px] -right-[60px] h-[320px] w-[320px] rounded-full"
              style={{
                opacity: 0.55,
                filter: "blur(80px)",
                background: "radial-gradient(closest-side, #A5B4FC 0%, transparent 100%)",
              }}
            />

            {/* Hero content */}
            <div className="relative z-10 w-full max-w-[440px]">
              <p
                className="font-extrabold uppercase"
                style={{
                  fontSize: "12px",
                  color: "var(--accent)",
                  letterSpacing: "0.18em",
                }}
              >
                {t("auth.hero_eyebrow", locale)}
              </p>

              <h1
                className="mt-4 font-extrabold whitespace-pre-line"
                style={{
                  fontSize: "clamp(32px, 3.4vw, 44px)",
                  lineHeight: 1.15,
                  letterSpacing: "-0.025em",
                }}
              >
                {t("auth.hero_title", locale)}
              </h1>

              <p
                className="mt-4 whitespace-pre-line"
                style={{
                  fontSize: "16px",
                  lineHeight: 1.55,
                  color: "rgba(45, 27, 61, 0.68)",
                }}
              >
                {t("auth.hero_desc", locale)}
              </p>

              <div className="mt-7 flex flex-wrap gap-2">
                {HERO_PILL_KEYS.map((key) => (
                  <span
                    key={key}
                    className="font-bold"
                    style={{
                      padding: "8px 14px",
                      borderRadius: "9999px",
                      background: "rgba(255, 255, 255, 0.7)",
                      border: "1px solid rgba(255, 255, 255, 0.8)",
                      fontSize: "13px",
                      color: "var(--ink)",
                      backdropFilter: "blur(6px)",
                      WebkitBackdropFilter: "blur(6px)",
                    }}
                  >
                    {t(key, locale)}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* ── Form column ── */}
          <div
            className="relative z-10 flex min-h-[100dvh] w-full flex-col items-center lg:overflow-y-auto lg:max-h-[100dvh]"
            style={{
              padding: "20px 28px 32px",
            }}
          >
            {/* Mobile-only decorative blob */}
            <div
              aria-hidden
              className="pointer-events-none absolute -right-[120px] -top-[120px] h-[420px] w-[420px] rounded-full opacity-40 lg:hidden"
              style={{
                filter: "blur(8px)",
                background:
                  "radial-gradient(closest-side, #FFE4E9 0%, rgba(255,228,233,0.4) 45%, transparent 75%)",
              }}
            />
            {/* Language switcher — same width as form */}
            <div className="relative z-20 w-full max-w-[440px] flex justify-end">
              <AuthLocaleSwitcher />
            </div>
            {/* Form — vertically centered in remaining space */}
            <div className="relative z-10 w-full max-w-[440px] flex-1 flex items-center">
              <div className="w-full">
                {children}
              </div>
            </div>
          </div>
        </main>
      </NavigationLoading>
    </LocaleProvider>
  );
}
