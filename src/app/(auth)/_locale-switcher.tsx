"use client";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n";

const LOCALE_COOKIE =
  process.env.NEXT_PUBLIC_LOCALE_COOKIE || "doooz_locale";

const LOCALE_LABELS: Record<Locale, string> = {
  ko: "🇰🇷",
  ja: "🇯🇵",
  en: "🇺🇸",
};

export function AuthLocaleSwitcher({ current }: { current: Locale }) {
  const router = useRouter();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    document.cookie = `${LOCALE_COOKIE}=${val};path=/;max-age=31536000`;
    router.refresh();
  }

  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[9px] text-muted-foreground">LANGUAGE</span>
      <select
        value={current}
        onChange={onChange}
        className="rounded border bg-background px-2 py-1 text-sm"
      >
        {Object.entries(LOCALE_LABELS).map(([code, flag]) => (
          <option key={code} value={code}>
            {flag}
          </option>
        ))}
      </select>
    </div>
  );
}
