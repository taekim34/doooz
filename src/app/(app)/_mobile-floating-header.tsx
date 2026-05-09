"use client";
import * as React from "react";
import { useMobileNav } from "./_mobile-nav-context";

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M3 5h12M3 9h12M3 13h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

const FLOATING_BUTTON_STYLE: React.CSSProperties = {
  background: "rgba(255,255,255,0.7)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
  boxShadow: "0 8px 18px -10px rgba(45,27,61,0.18)",
};

/**
 * Mobile-only floating top bar — always visible at the top of (app) pages.
 * Left: hamburger that opens the global drawer.
 * Center / Right: per-page slots populated via `useFloatingHeader`.
 */
export function MobileFloatingHeader() {
  const { openDrawer, slots } = useMobileNav();

  if (slots.hidden) return null;

  return (
    <div className="relative flex items-center justify-between px-5 pt-4 pb-2 md:hidden">
      <button
        type="button"
        onClick={openDrawer}
        aria-label="menu"
        className="flex h-11 w-11 items-center justify-center rounded-full text-[color:var(--ink)]"
        style={FLOATING_BUTTON_STYLE}
      >
        <MenuIcon />
      </button>

      <div className="pointer-events-auto">{slots.center ?? <span aria-hidden className="w-px" />}</div>

      <div className="flex items-center">
        {slots.right ?? <span aria-hidden className="h-11 w-11" />}
      </div>
    </div>
  );
}

/** Convenience right-slot button used by KidHome / pages with notifications. */
export function FloatingRightButton({
  onClick,
  href,
  ariaLabel,
  children,
}: {
  onClick?: () => void;
  href?: string;
  ariaLabel: string;
  children: React.ReactNode;
}) {
  const className =
    "flex h-11 w-11 items-center justify-center rounded-full text-[color:var(--ink)]";
  if (href) {
    return (
      <a href={href} aria-label={ariaLabel} className={className} style={FLOATING_BUTTON_STYLE}>
        {children}
      </a>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={className}
      style={FLOATING_BUTTON_STYLE}
    >
      {children}
    </button>
  );
}
