"use client";
import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import * as React from "react";
import { cn } from "@/lib/utils";
import { t as translate, type Locale } from "@/lib/i18n";

type NavItem = {
  href: Route;
  labelKey: string;
  emoji: string;
  roles?: ReadonlyArray<"parent" | "child">;
};

/**
 * Self-aware nav link: when `active` is true the click is suppressed
 * (preventDefault + pointer-events-none) and a11y signals are emitted,
 * so tapping the current page can never trigger a no-op navigation +
 * the global spinner. Visual styling is left to the caller.
 */
function NavLink({
  active,
  className,
  children,
  ...rest
}: {
  active: boolean;
  href: Route;
  className?: string;
  children: React.ReactNode;
} & Omit<React.ComponentProps<typeof Link>, "href" | "className" | "onClick" | "tabIndex" | "aria-current" | "aria-disabled">) {
  return (
    <Link
      aria-current={active ? "page" : undefined}
      aria-disabled={active || undefined}
      tabIndex={active ? -1 : undefined}
      onClick={active ? (e) => e.preventDefault() : undefined}
      className={cn(active && "pointer-events-none cursor-default", className)}
      {...rest}
    >
      {children}
    </Link>
  );
}

const ITEMS: ReadonlyArray<NavItem> = [
  { href: "/" as Route, labelKey: "nav.home", emoji: "\u{1F3E0}" },
  { href: "/tasks" as Route, labelKey: "nav.tasks", emoji: "\u{1F3AF}" },
  { href: "/points" as Route, labelKey: "nav.points", emoji: "\u2B50" },
  { href: "/rewards" as Route, labelKey: "nav.rewards", emoji: "\u{1F381}", roles: ["child"] },
  { href: "/rewards/manage" as Route, labelKey: "nav.rewards", emoji: "\u{1F381}", roles: ["parent"] },
  { href: "/rewards/requests" as Route, labelKey: "nav.requests", emoji: "\u2705", roles: ["parent"] },
  { href: "/characters" as Route, labelKey: "nav.characters", emoji: "\u{1F98A}", roles: ["child"] },
  { href: "/family" as Route, labelKey: "nav.family", emoji: "\u{1F468}\u200D\u{1F469}\u200D\u{1F467}" },
  { href: "/settings" as Route, labelKey: "nav.settings", emoji: "\u2699\uFE0F" },
];

export function AppNav({
  role,
  familyName,
  locale,
}: {
  role: "parent" | "child";
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
      {/* Mobile uses MobileFloatingHeader + MobileDrawer (mounted in layout). */}

      {/* ── Desktop top nav (md+) ── */}
      <nav
        className="sticky top-0 z-40 hidden border-b border-[rgba(45,27,61,0.12)] md:block"
        style={{
          background: "color-mix(in srgb, var(--surface) 75%, transparent)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          boxShadow: "0 4px 14px -10px rgba(45,27,61,0.18)",
        }}
      >
        <div
          className="mx-auto flex max-w-[960px] items-center justify-between"
          style={{ padding: "12px clamp(16px, 3vw, 32px)" }}
        >
          {/* Left: logo + name + role badge */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Image src="/logo.png" alt="Doooz" width={54} height={54} priority className="h-[27px] w-[27px]" />
              <span className="text-lg font-extrabold tracking-tight text-[color:var(--ink)]">Doooz</span>
            </div>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-wide",
                isKid
                  ? "bg-pink-100 text-pink-600"
                  : "bg-indigo-100 text-indigo-600",
              )}
            >
              {familyName}
            </span>
          </div>

          {/* Right-aligned nav pills (incl. 설정) */}
          <div className="ml-auto flex items-center gap-1">
            {items.map((it) => {
              const active = isActive(it.href);
              return (
                <NavLink
                  key={it.href}
                  href={it.href}
                  active={active}
                  className={cn(
                    "rounded-full px-3.5 py-2 text-[13.5px] font-medium transition-all",
                    active
                      ? "bg-[color:var(--ink)] text-[color:var(--on-accent)]"
                      : "text-[color:var(--ink-muted)] hover:bg-[color:var(--surface-sunken)] hover:text-[color:var(--ink)]",
                  )}
                >
                  {t(it.labelKey)}
                </NavLink>
              );
            })}
          </div>
        </div>
      </nav>

    </>
  );
}

