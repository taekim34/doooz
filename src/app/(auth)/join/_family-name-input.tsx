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
      style={{
        height: 48, width: "100%", borderRadius: 10,
        padding: "0 16px", outline: "none",
        background: "#FAFAFA", border: "1px solid #F0F0F0",
        fontSize: 17, fontWeight: 500, color: "#0A0A0A",
        fontFamily: "inherit",
        transition: "border-color 150ms, background 150ms",
        boxSizing: "border-box",
      }}
    />
  );
}
