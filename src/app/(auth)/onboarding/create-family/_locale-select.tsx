"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n";

const LOCALE_COOKIE = process.env.NEXT_PUBLIC_LOCALE_COOKIE || "doooz_locale";

export function FamilyLocaleSelect({ value, className }: { value: Locale; className?: string }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value;
    document.cookie = `${LOCALE_COOKIE}=${v};path=/;max-age=31536000`;
    startTransition(() => router.refresh());
  }

  return (
    <select name="locale" value={value} onChange={onChange} className={className}>
      <option value="ko">한국어</option>
      <option value="en">English</option>
      <option value="ja">日本語</option>
    </select>
  );
}
