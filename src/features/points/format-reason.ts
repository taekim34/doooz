import { t, type Locale } from "@/lib/i18n";

/**
 * Some point_transactions rows store English codes or Korean prefixes that
 * leak when the viewer's locale doesn't match. Two layers of normalization:
 *
 * 1. Exact codes — `missed_task` (penalty trigger), `pardon_reversal`
 *    (uncomplete_task adjustment) are inserted as bare English by RPCs.
 *
 * 2. Prefixes — `할일 완료: 책읽기 30분` / `beg approved: Hatchet 다봄` /
 *    `취소: 영어숙제` etc. The prefix is RPC-generated (so always one of a
 *    fixed set in either Korean or older English form); the suffix is
 *    user-typed text that must pass through unchanged.
 *
 * Order matters: exact codes are checked first, then prefix replacement.
 * Anything else (legitimate user-typed reason) falls through untouched.
 */

const REASON_KEYS: Record<string, string> = {
  missed_task: "points.missed_task",
  pardon_reversal: "points.reason_pardon_reversal",
};

const PREFIX_KEYS: Array<{ match: RegExp; key: string }> = [
  // Beg approval — both legacy English and current Korean form
  { match: /^beg approved:\s*/i, key: "points.reason_beg_approved" },
  { match: /^조르기 승인:\s*/, key: "points.reason_beg_approved" },
  // Korean RPC prefixes (translated on the fly for en/ja viewers)
  { match: /^할일 완료:\s*/, key: "points.reason_task_complete" },
  { match: /^보상 교환:\s*/, key: "points.reason_reward_redeemed" },
  { match: /^취소:\s*/, key: "points.reason_cancelled" },
  { match: /^재체크:\s*/, key: "points.reason_recheck" },
];

export function formatPointsReason(reason: string, locale: Locale): string {
  const exact = REASON_KEYS[reason];
  if (exact) return t(exact, locale);

  for (const { match, key } of PREFIX_KEYS) {
    if (match.test(reason)) {
      const rest = reason.replace(match, "");
      return `${t(key, locale)}: ${rest}`;
    }
  }
  return reason;
}
