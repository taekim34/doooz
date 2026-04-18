"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n";

const LOCALE_COOKIE = process.env.NEXT_PUBLIC_LOCALE_COOKIE || "doooz_locale";

const LOCALES: { v: Locale; label: string }[] = [
  { v: "ko", label: "\ud55c\uad6d\uc5b4" },
  { v: "en", label: "English" },
  { v: "ja", label: "\u65e5\u672c\u8a9e" },
];

export function LocalePill({ current }: { current: Locale }) {
  const [open, setOpen] = useState(false);
  const [loc, setLoc] = useState(current);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  function select(v: Locale) {
    setLoc(v);
    setOpen(false);
    document.cookie = `${LOCALE_COOKIE}=${v};path=/;max-age=31536000`;
    router.refresh();
  }

  return (
    <div ref={ref} className="absolute right-5 top-5 z-10">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-1.5 cursor-pointer"
        style={{
          padding: "7px 12px",
          borderRadius: 9999,
          background: "rgba(250,250,250,0.85)",
          border: "1px solid #F0F0F0",
          fontSize: 13,
          fontWeight: 600,
          color: "#0A0A0A",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
      >
        {/* Globe icon */}
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
          <circle cx="7" cy="7" r="5.5" stroke="#0A0A0A" strokeWidth="1.3" />
          <path
            d="M1.5 7h11M7 1.5c1.7 2 1.7 9 0 11M7 1.5c-1.7 2-1.7 9 0 11"
            stroke="#0A0A0A"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        </svg>
        <span className="whitespace-nowrap">
          {LOCALES.find((l) => l.v === loc)?.label ?? loc}
        </span>
        {/* Chevron */}
        <svg
          width="10"
          height="6"
          viewBox="0 0 10 6"
          fill="none"
          style={{ transition: "transform 200ms", transform: open ? "rotate(180deg)" : "none" }}
        >
          <path
            d="M1 1l4 4 4-4"
            stroke="#0A0A0A"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          className="flex flex-col"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            minWidth: 132,
            padding: 4,
            background: "#fff",
            border: "1px solid #F0F0F0",
            borderRadius: 12,
            boxShadow: "0 14px 30px -10px rgba(10,10,10,0.18)",
            gap: 2,
          }}
        >
          {LOCALES.map((o) => {
            const on = loc === o.v;
            return (
              <button
                key={o.v}
                type="button"
                onClick={() => select(o.v)}
                role="option"
                aria-selected={on}
                className="flex items-center justify-between cursor-pointer"
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  background: on ? "#FAFAFA" : "transparent",
                  border: "none",
                  fontSize: 14,
                  fontWeight: on ? 700 : 500,
                  color: "#0A0A0A",
                  textAlign: "left",
                }}
              >
                <span>{o.label}</span>
                {on && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                    <path
                      d="M2.5 6.5L5 9l4.5-5.5"
                      stroke="#0A0A0A"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
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
