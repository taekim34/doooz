"use client";
import { useEffect, useRef } from "react";

const STORAGE_KEY =
  process.env.NEXT_PUBLIC_FAMILY_STORAGE_KEY || "doooz_family_name";

export function FamilyNameInput({ defaultValue, placeholder }: { defaultValue?: string; placeholder?: string }) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    // Priority: URL param > localStorage
    const cached = localStorage.getItem(STORAGE_KEY);
    if (!ref.current.value && cached) {
      ref.current.value = cached;
    }
  }, []);

  return (
    <input
      ref={ref}
      name="family_name"
      placeholder={placeholder || defaultValue || ""}
      defaultValue={defaultValue}
      required
      maxLength={40}
      onChange={(e) => {
        const v = e.target.value.trim();
        if (v) localStorage.setItem(STORAGE_KEY, v);
      }}
      className="h-12 w-full rounded-[10px] px-4 outline-none bg-[color:var(--surface-raised)] border border-[color:var(--border-subtle)] text-[17px] font-medium text-[color:var(--ink)] transition-[border-color,background] duration-150 box-border"
    />
  );
}
