import ko from "./ko.json";
import ja from "./ja.json";
import en from "./en.json";

export type Locale = "ko" | "ja" | "en";
export const DEFAULT_LOCALE = (process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "en") as Locale;
export const LOCALES: Locale[] = ["ko", "ja", "en"];

const dictionaries: Record<Locale, Record<string, string>> = { ko, ja, en };

export function t(key: string, locale: Locale = DEFAULT_LOCALE): string {
  return dictionaries[locale]?.[key] ?? dictionaries[DEFAULT_LOCALE]?.[key] ?? key;
}

export function getLocaleFromHeader(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;
  if (acceptLanguage.includes("ja")) return "ja";
  if (acceptLanguage.includes("en")) return "en";
  return DEFAULT_LOCALE;
}
