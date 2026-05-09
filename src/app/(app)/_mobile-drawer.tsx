"use client";
import Link from "next/link";
import type { Route } from "next";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { cn } from "@/lib/utils";
import { t as translate, type Locale } from "@/lib/i18n";
import { useMobileNav } from "./_mobile-nav-context";

type Item = {
  href: Route;
  labelKey: string;
  emoji: string;
  roles?: ReadonlyArray<"parent" | "child">;
};

const ITEMS: ReadonlyArray<Item> = [
  { href: "/" as Route,                  labelKey: "nav.home",       emoji: "🏠" },
  { href: "/tasks" as Route,             labelKey: "nav.tasks",      emoji: "🎯" },
  { href: "/points" as Route,            labelKey: "nav.points",     emoji: "⭐" },
  { href: "/rewards" as Route,           labelKey: "nav.rewards",    emoji: "🎁", roles: ["child"] },
  { href: "/rewards/manage" as Route,    labelKey: "nav.rewards",    emoji: "🎁", roles: ["parent"] },
  { href: "/rewards/requests" as Route,  labelKey: "nav.requests",   emoji: "✅", roles: ["parent"] },
  { href: "/characters" as Route,        labelKey: "nav.characters", emoji: "🦊", roles: ["child"] },
  { href: "/family" as Route,            labelKey: "nav.family",     emoji: "👨‍👩‍👧‍👦" },
  { href: "/settings" as Route,          labelKey: "nav.settings",   emoji: "⚙️" },
];

export function MobileDrawer({
  role,
  familyName,
  locale,
}: {
  role: "parent" | "child";
  familyName: string;
  locale: Locale;
}) {
  const { drawerOpen, closeDrawer } = useMobileNav();
  const pathname = usePathname();
  const router = useRouter();
  const t = (k: string) => translate(k, locale);
  const items = ITEMS.filter((it) => !it.roles || it.roles.includes(role));
  const isKid = role === "child";

  // Lock body scroll when open
  React.useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  // Close on ESC
  React.useEffect(() => {
    if (!drawerOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeDrawer();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen, closeDrawer]);

  // Auto-close when route changes
  const lastPath = React.useRef(pathname);
  React.useEffect(() => {
    if (pathname !== lastPath.current && drawerOpen) {
      closeDrawer();
    }
    lastPath.current = pathname;
  }, [pathname, drawerOpen, closeDrawer]);

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  async function onLogout() {
    closeDrawer();
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.replace("/login" as Route);
  }

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden
        onClick={closeDrawer}
        className={cn(
          "fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] transition-opacity duration-200 md:hidden",
          drawerOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />
      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={t("nav.menu")}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[80%] max-w-[320px] flex-col text-[color:var(--ink)] shadow-2xl transition-transform duration-300 md:hidden",
          drawerOpen ? "translate-x-0" : "-translate-x-full",
        )}
        style={{
          background: "color-mix(in srgb, var(--surface) 96%, transparent)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[color:var(--border)] px-5 py-4">
          <div
            className={cn(
              "rounded-full px-3 py-1 text-[12px] font-bold tracking-wide",
              isKid ? "bg-pink-100 text-pink-600" : "bg-indigo-100 text-indigo-600",
            )}
          >
            {familyName}
          </div>
          <button
            type="button"
            onClick={closeDrawer}
            aria-label="close"
            className="flex h-9 w-9 items-center justify-center rounded-full text-[color:var(--ink-subtle)] hover:bg-[color:var(--surface-sunken)]"
          >
            ✕
          </button>
        </div>

        {/* Menu list */}
        <nav className="flex-1 overflow-y-auto p-3">
          {items.map((it) => {
            const active = isActive(it.href);
            return (
              <Link
                key={it.href}
                href={it.href}
                className={cn(
                  "mb-1 flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] font-semibold transition-colors",
                  active
                    ? "bg-[color:var(--accent-soft)] text-[color:var(--ink)]"
                    : "text-[color:var(--ink-muted)] hover:bg-[color:var(--surface-sunken)]",
                )}
              >
                <span aria-hidden className="text-[18px]">
                  {it.emoji}
                </span>
                <span className="flex-1">{t(it.labelKey)}</span>
                {active && (
                  <span
                    aria-hidden
                    className="h-2 w-2 rounded-full"
                    style={{ background: "var(--accent)" }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-[color:var(--border)] p-3">
          <button
            type="button"
            onClick={onLogout}
            className="w-full rounded-xl px-4 py-3 text-left text-[14px] font-semibold text-[color:var(--ink-subtle)] hover:bg-[color:var(--surface-sunken)] hover:text-[color:var(--ink)]"
          >
            {t("nav.logout")}
          </button>
        </div>
      </aside>
    </>
  );
}
