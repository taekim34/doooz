import { t, type Locale } from "@/lib/i18n";

/**
 * Some point_transactions rows store an English code in `reason` instead of
 * user-generated text — currently `missed_task` (penalty) and
 * `pardon_reversal` (adjustment from uncomplete_task). Map those codes to
 * a localized label; everything else (task titles, "할일 완료: …",
 * "보상 교환: …", etc.) is already in the family's locale and passes through.
 */
const REASON_KEYS: Record<string, string> = {
  missed_task: "points.missed_task",
  pardon_reversal: "points.reason_pardon_reversal",
};

export function formatPointsReason(reason: string, locale: Locale): string {
  const key = REASON_KEYS[reason];
  return key ? t(key, locale) : reason;
}
