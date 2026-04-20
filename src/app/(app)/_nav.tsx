"use client";
import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { t as translate, type Locale } from "@/lib/i18n";

type NavItem = {
  href: Route;
  labelKey: string;
  emoji: string;
  roles?: ReadonlyArray<"parent" | "child">;
};

const ITEMS: ReadonlyArray<NavItem> = [
  { href: "/" as Route, labelKey: "nav.home", emoji: "\u{1F3E0}" },
  { href: "/tasks" as Route, labelKey: "nav.tasks", emoji: "\u{1F3AF}" },
  { href: "/points" as Route, labelKey: "nav.points", emoji: "\u2B50" },
  { href: "/rewards" as Route, labelKey: "nav.rewards", emoji: "\u{1F381}", roles: ["child"] },
  { href: "/rewards/manage" as Route, labelKey: "nav.rewards", emoji: "\u{1F381}", roles: ["parent"] },
  { href: "/rewards/requests" as Route, labelKey: "nav.requests", emoji: "\u2705", roles: ["parent"] },
  { href: "/characters" as Route, labelKey: "nav.characters", emoji: "\u{1F98A}", roles: ["child"] },
  { href: "/family" as Route, labelKey: "nav.family", emoji: "\u{1F468}\u200D\u{1F469}\u200D\u{1F467}" },
];

export function AppNav({
  role,
  userName,
  familyName,
  locale,
}: {
  role: "parent" | "child";
  userName: string;
  familyName: string;
  locale: Locale;
}) {
  const t = (key: string) => translate(key, locale);
  const pathname = usePathname();
  const items = ITEMS.filter((it) => !it.roles || it.roles.includes(role));
  const isKid = role === "child";

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <>
      {/* ── Mobile top header (<md) ── */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-4 py-2 md:hidden"
        style={{
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(10,10,10,0.06)",
        }}
      >
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="DOOOZ" width={54} height={54} priority className="h-[27px] w-[27px]" />
          <span className="text-xs text-gray-400">{familyName}</span>
        </div>
        <Link href={"/settings" as Route} className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600">
          <SettingsGearIcon />
        </Link>
      </header>

      {/* ── Desktop top nav (md+) ── */}
      <nav
        className="sticky top-0 z-40 hidden md:block"
        style={{
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(10,10,10,0.06)",
        }}
      >
        <div
          className="mx-auto flex max-w-[1280px] items-center justify-between"
          style={{ padding: "12px clamp(16px, 4vw, 32px)" }}
        >
          {/* Left: logo + name + role badge */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Image src="/logo.png" alt="DOOOZ" width={54} height={54} priority className="h-[27px] w-[27px]" />
              <span className="text-lg font-extrabold tracking-tight text-gray-900">doooz</span>
            </div>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                isKid
                  ? "bg-pink-100 text-pink-600"
                  : "bg-indigo-100 text-indigo-600",
              )}
            >
              {isKid ? t("nav.child") : t("nav.parent")}
            </span>
          </div>

          {/* Center: nav pills */}
          <div className="flex items-center gap-1">
            {items.map((it) => {
              const active = isActive(it.href);
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  className={cn(
                    "rounded-full px-3.5 py-2 text-[13.5px] font-medium transition-all",
                    active
                      ? "bg-gray-900 text-white"
                      : "text-gray-500 hover:bg-gray-100 hover:text-gray-700",
                  )}
                >
                  <span className="mr-1.5">{it.emoji}</span>
                  {t(it.labelKey)}
                </Link>
              );
            })}
          </div>

          {/* Right: settings gear + avatar */}
          <div className="flex items-center gap-2">
            <Link
              href={"/settings" as Route}
              className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              <SettingsGearIcon />
            </Link>
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white",
                isKid
                  ? "bg-gradient-to-br from-pink-400 to-rose-500"
                  : "bg-gradient-to-br from-indigo-400 to-violet-500",
              )}
              title={userName}
            >
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </nav>

      {/* ── Mobile bottom tabs (<md) ── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-6 pb-[env(safe-area-inset-bottom)] md:hidden"
        style={{
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(10,10,10,0.06)",
        }}
      >
        {items.map((it) => {
          const active = isActive(it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              className="flex flex-col items-center gap-0.5 py-2 transition-colors"
              style={{
                color: active
                  ? isKid ? "var(--accent-kid)" : "var(--accent-parent)"
                  : "var(--ink-subtle)",
              }}
            >
              <span className="text-[18px] leading-none">{it.emoji}</span>
              <span className={cn("text-[10px]", active && "font-semibold")}>
                {t(it.labelKey)}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

/** Inline SVG gear icon to avoid lucide-react dependency */
function SettingsGearIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
