import Link from "next/link";
import { t, type Locale } from "@/lib/i18n";

export function BackButton({ fallback = "/", locale = "ko" as Locale }: { fallback?: string; locale?: Locale }) {
  return (
    <Link
      href={fallback as never}
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      {t("common.back", locale)}
    </Link>
  );
}
