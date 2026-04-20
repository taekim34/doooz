/**
 * Transaction kind → visual metadata mapping.
 * Shared utility so pages and molecules can use the same mapping.
 */

export interface TxMeta {
  icon: string;
  bg: string;
}

export function txMeta(kind: string): TxMeta {
  switch (kind) {
    case "task_reward":
      return { icon: "✅", bg: "rgba(34,197,94,0.14)" };
    case "reward_redeem":
    case "redemption":
      return { icon: "🎁", bg: "rgba(255,107,122,0.14)" };
    case "adjustment":
    case "bonus":
      return { icon: "⚡", bg: "rgba(99,102,241,0.14)" };
    case "penalty":
      return { icon: "😢", bg: "rgba(239,68,68,0.14)" };
    default:
      return { icon: "✅", bg: "rgba(34,197,94,0.14)" };
  }
}
