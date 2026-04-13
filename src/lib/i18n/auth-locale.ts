import { cookies } from "next/headers";
import type { Locale } from "./index";

export async function getAuthLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  return (cookieStore.get("doooz_locale")?.value || "ko") as Locale;
}
