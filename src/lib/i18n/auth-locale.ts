import { cookies } from "next/headers";
import { DEFAULT_LOCALE, type Locale } from "./index";

export const LOCALE_COOKIE =
  process.env.NEXT_PUBLIC_LOCALE_COOKIE || "doooz_locale";

export async function getAuthLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  return (cookieStore.get(LOCALE_COOKIE)?.value || DEFAULT_LOCALE) as Locale;
}
