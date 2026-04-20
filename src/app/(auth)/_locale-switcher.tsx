"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n";

const LOCALE_COOKIE = process.env.NEXT_PUBLIC_LOCALE_COOKIE || "doooz_locale";

const LOCALES: { v: Locale; label: string }[] = [
  { v: "ko", label: "한국어" },
  { v: "en", label: "English" },
  { v: "ja", label: "日本語" },
];

function GlobeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M1.5 7h11M7 1.5c1.7 2 1.7 9 0 11M7 1.5c-1.7 2-1.7 9 0 11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}

export function AuthLocaleSwitcher() {
  const currentLocale = useLocale();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loc, setLoc] = useState<Locale>(currentLocale);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  function selectLocale(v: Locale) {
    setLoc(v);
    setOpen(false);
    document.cookie = `${LOCALE_COOKIE}=${v};path=/;max-age=31536000`;
    router.refresh();
  }

  return (
    <div ref={ref} className="relative z-50">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-[6px] py-[7px] px-3 rounded-full bg-[rgba(250,250,250,0.85)] border border-[color:var(--border-subtle)] text-[13px] font-semibold text-[color:var(--ink)] cursor-pointer"
        style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
      >
        <GlobeIcon/>
        <span className="whitespace-nowrap">
          {LOCALES.find(l => l.v === loc)?.label ?? loc}
        </span>
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none"
          style={{ transition: "transform 200ms", transform: open ? "rotate(180deg)" : "none" }}>
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <div role="listbox" className="absolute top-[calc(100%+6px)] right-0 min-w-[132px] p-1 bg-[color:var(--bg)] border border-[color:var(--border-subtle)] rounded-xl flex flex-col gap-[2px]"
          style={{ boxShadow: "0 14px 30px -10px rgba(10,10,10,0.18)" }}>
          {LOCALES.map(o => {
            const on = loc === o.v;
            return (
              <button key={o.v} type="button" onClick={() => selectLocale(o.v)}
                role="option" aria-selected={on}
                className="flex items-center justify-between py-2 px-3 rounded-lg text-sm text-[color:var(--ink)] text-left border-none cursor-pointer"
                style={{
                  background: on ? "var(--surface-raised)" : "transparent",
                  fontWeight: on ? 700 : 500,
                }}>
                <span>{o.label}</span>
                {on && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6.5L5 9l4.5-5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
