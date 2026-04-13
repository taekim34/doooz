import ko from "./ko.json";
import ja from "./ja.json";
import en from "./en.json";

export type Locale = "ko" | "ja" | "en";
export const DEFAULT_LOCALE: Locale = "ko";
export const LOCALES: Locale[] = ["ko", "ja", "en"];

const dictionaries: Record<Locale, Record<string, string>> = { ko, ja, en };

export function t(key: string, locale: Locale = DEFAULT_LOCALE): string {
  return dictionaries[locale]?.[key] ?? dictionaries.ko[key] ?? key;
}

export function getLocaleFromHeader(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;
  if (acceptLanguage.includes("ja")) return "ja";
  if (acceptLanguage.includes("en")) return "en";
  return DEFAULT_LOCALE;
}
