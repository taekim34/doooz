"use client";
import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { t as translate, type Locale } from "@/lib/i18n";
import {
  Home,
  ListChecks,
  Coins,
  Gift,
  Inbox,
  Users,
  Sparkles,
  Settings,
} from "lucide-react";

type NavItem = {
  href: Route;
  labelKey: string;
  icon: typeof Home;
  roles?: ReadonlyArray<"parent" | "child">;
};

const ITEMS: ReadonlyArray<NavItem> = [
  { href: "/" as Route, labelKey: "nav.home", icon: Home },
  { href: "/tasks" as Route, labelKey: "nav.tasks", icon: ListChecks },
  { href: "/points" as Route, labelKey: "nav.points", icon: Coins },
  { href: "/rewards" as Route, labelKey: "nav.rewards", icon: Gift, roles: ["child"] },
  { href: "/rewards/manage" as Route, labelKey: "nav.rewards", icon: Gift, roles: ["parent"] },
  { href: "/rewards/requests" as Route, labelKey: "nav.requests", icon: Inbox, roles: ["parent"] },
  { href: "/family" as Route, labelKey: "nav.family", icon: Users },
  { href: "/characters" as Route, labelKey: "nav.characters", icon: Sparkles, roles: ["child"] },
  { href: "/settings" as Route, labelKey: "nav.settings", icon: Settings },
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
      {/* Mobile top header */}
      <header
        className="sticky top-0 z-40 flex items-center gap-2 border-b px-4 py-2 md:hidden"
        style={{ background: "var(--bg)", borderColor: "var(--border, #f0f0f0)" }}
      >
        <Image src="/logo.png" alt="DOOOZ" width={54} height={54} priority className="h-[27px] w-[27px]" />
        <span className="text-xs" style={{ color: "var(--muted)" }}>{familyName}</span>
      </header>

      {/* Desktop sidebar */}
      <aside
        className="hidden w-60 shrink-0 border-r p-4 md:block"
        style={{ background: "color-mix(in srgb, var(--bg) 95%, var(--card))", borderColor: "var(--border, #f0f0f0)" }}
      >
        <div className="mb-6">
          <Image src="/logo.png" alt="DOOOZ" width={80} height={80} priority className="h-[40px] w-[40px]" />
          <div className="text-xs" style={{ color: "var(--muted)" }}>{familyName}</div>
          <div className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
            {userName} · {role === "parent" ? t("nav.parent") : t("nav.child")}
          </div>
        </div>
        <nav className="flex flex-col gap-1">
          {items.map((it) => {
            const Icon = it.icon;
            const active = isActive(it.href);
            return (
              <Link
                key={it.href}
                href={it.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-spring",
                  active
                    ? "font-semibold"
                    : "hover:bg-[color:var(--card)]",
                )}
                style={active ? {
                  background: isKid ? "var(--accent-color)" : "var(--primary-color)",
                  color: "white",
                } : { color: "var(--ink)" }}
              >
                <Icon className="h-4 w-4" /> {t(it.labelKey)}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile bottom tabs */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex border-t md:hidden"
        style={{ background: "var(--bg)", borderColor: "var(--border, #f0f0f0)" }}
      >
        {items.map((it) => {
          const Icon = it.icon;
          const active = isActive(it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[9px] transition-colors",
              )}
              style={{ color: active ? "var(--accent-color)" : "var(--muted)" }}
            >
              {isKid && active && (
                <span
                  className="absolute -top-0.5 left-1/2 h-1 w-6 -translate-x-1/2 rounded-full"
                  style={{ background: "var(--accent-color)" }}
                />
              )}
              <Icon className="h-4 w-4" />
              <span className={active ? "font-semibold" : ""}>{t(it.labelKey)}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
