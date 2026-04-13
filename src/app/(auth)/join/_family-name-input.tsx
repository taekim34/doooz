"use client";
import { useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";

const STORAGE_KEY =
  process.env.NEXT_PUBLIC_FAMILY_STORAGE_KEY || "doooz_family_name";

export function FamilyNameInput({ defaultValue }: { defaultValue?: string }) {
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
    <Input
      ref={ref}
      name="family_name"
      placeholder={defaultValue || ""}
      defaultValue={defaultValue}
      required
      maxLength={40}
      onChange={(e) => {
        const v = e.target.value.trim();
        if (v) localStorage.setItem(STORAGE_KEY, v);
      }}
    />
  );
}
