/**
 * dooooz invariants (spec Section 3.2).
 * These are the hard rules the system must never break.
 * Enforcement lives in migrations, triggers, RLS, and service code.
 * This module exports documentation constants + test helpers.
 */

export const INVARIANTS = {
  I1: "users.current_balance = SUM(point_transactions.amount) per user",
  I2: "users.lifetime_earned = SUM(amount) WHERE amount > 0 AND kind IN ('task_reward','bonus')",
  I3: "balance may be negative after a penalty (relaxed from >= 0)",
  I4: "At most one point_transactions row with kind='task_reward' per task_instance",
  I5: "Every row's family_id matches the actor's family_id",
  I6: "point_transactions is append-only (no UPDATE / DELETE)",
  I7: "task_instances with status='completed' are immutable",
  I8: "user_badges (user_id, badge_id) is unique",
  I9: "Rank/level/character filter role='child'",
  I10: "All date comparisons use families.timezone via lib/datetime helpers",
} as const;

export type InvariantKey = keyof typeof INVARIANTS;

interface LedgerRow {
  amount: number;
  kind: "task_reward" | "redemption" | "adjustment" | "bonus" | "penalty";
}

interface UserCache {
  current_balance: number;
  lifetime_earned: number;
}

/**
 * Test helper: verify I1 and I2 against a ledger sequence.
 * Throws on violation.
 */
export function assertBalanceMatchesLedger(user: UserCache, transactions: ReadonlyArray<LedgerRow>): void {
  let balance = 0;
  let lifetime = 0;
  for (const tx of transactions) {
    balance += tx.amount;
    if (tx.amount > 0 && (tx.kind === "task_reward" || tx.kind === "bonus")) {
      lifetime += tx.amount;
    }
  }
  if (user.current_balance !== balance) {
    throw new Error(
      `Invariant I1 violated: current_balance=${user.current_balance} but ledger sum=${balance}`,
    );
  }
  if (user.lifetime_earned !== lifetime) {
    throw new Error(
      `Invariant I2 violated: lifetime_earned=${user.lifetime_earned} but positive-qualifying ledger sum=${lifetime}`,
    );
  }
  // I3 relaxed: balance may be negative after a penalty.
}
