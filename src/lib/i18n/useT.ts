"use client";
import { useLocale } from "./context";
import { t } from "./index";

export function useT() {
  const locale = useLocale();
  return (key: string, vars?: Record<string, string | number>) => {
    let text = t(key, locale);
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        text = text.replace(`{${k}}`, String(v));
      }
    }
    return text;
  };
}
