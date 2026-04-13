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
  { href: "/chores" as Route, labelKey: "nav.chores", icon: ListChecks },
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

  return (
    <>
      {/* Mobile top header */}
      <header className="sticky top-0 z-40 flex items-center gap-2 border-b bg-background px-4 py-2 md:hidden">
        <Image src="/logo.png" alt="DOOOZ" width={80} height={27} priority />
        <span className="text-xs text-muted-foreground">{familyName}</span>
      </header>

      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r bg-muted/30 p-4 md:block">
        <div className="mb-6">
          <Image src="/logo.png" alt="DOOOZ" width={120} height={40} priority />
          <div className="text-xs text-muted-foreground">{familyName}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            {userName} · {role === "parent" ? t("nav.parent") : t("nav.child")}
          </div>
        </div>
        <nav className="flex flex-col gap-1">
          {items.map((it) => {
            const Icon = it.icon;
            const active = pathname === it.href || (it.href !== "/" && pathname.startsWith(it.href));
            return (
              <Link
                key={it.href}
                href={it.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition",
                  active ? "bg-primary text-primary-foreground" : "hover:bg-accent",
                )}
              >
                <Icon className="h-4 w-4" /> {t(it.labelKey)}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile bottom tabs — show all items */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t bg-background md:hidden">
        {items.map((it) => {
          const Icon = it.icon;
          const active = pathname === it.href || (it.href !== "/" && pathname.startsWith(it.href));
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-[9px]",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {t(it.labelKey)}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
