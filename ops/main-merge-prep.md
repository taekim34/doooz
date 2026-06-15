# main → dev merge prep: what changed on main since the branch diverged

Branch diverged at **`c2d4d62`** (atomic family creation RPC). Since then `main` got **18 commits** (mostly prod hotfixes). Merge direction is **dev → main, "dev-wins" on conflicts** — so anything `main` has that dev lacks is **silently lost** unless ported into dev first. "dev is the superior version" is an *assumption*: to keep only the superior, you must SEE each diff and confirm dev's (refactored) file actually contains main's fix.

**Verification recipe per file:** `git diff c2d4d62 main -- <file>` shows exactly what main changed; compare against dev's version. The per-file inventory below lists which main commits touched each file so you know what to look for.

---

## 1. MUST PORT into dev (dev genuinely LACKS it → dev-wins merge regresses prod)

### Web Push `urgency:"high"` — CONFIRMED missing on dev
- `src/lib/push/send.ts`: add 3rd arg to `webpush.sendNotification(sub, JSON.stringify(payload), …)`:
  ```ts
  { urgency: "high", TTL: 86400 }
  ```
  dev's `send.ts` already has the `// WHY: admin required` comments — just ADD the urgency arg, don't overwrite the comments. (send.ts diverged BOTH ways: dev=comments, main=urgency → keep both.)
- `src/types/web-push.d.ts`: add 3rd param to the `sendNotification` signature:
  ```ts
  options?: { TTL?: number; urgency?: "very-low" | "low" | "normal" | "high"; topic?: string },
  ```
- Why: without it FCM/APNs delay pushes to locked/idle phones (worst for beg → parent phones). Deployed to prod 2026-06-16 (commit `2fa2d44`).

---

## 2. Verified present on dev (spot-checked) — but re-confirm at merge

- **Penalty cancel** `src/app/api/points/penalty/[id]/cancel/route.ts` — dev is BYTE-IDENTICAL to main (status-update + compensating adjustment, NOT delete; the "no DELETE RLS" fix `bd8cd7c` is present). ✓
- **Penalty negative points** `src/app/api/points/penalty/route.ts` — dev handles negative penalty (amount 1–10000). The `b77eae7` points_check fix intent is present. ✓

These confirm penalty is "clean/dev-wins". Still `git diff` them at merge to be sure.

---

## 3. Per-file inventory — main changes since `c2d4d62` (verify dev covers each)

Most of these are the **penalty feature** + the **47841b4 prod-sync** (linear levels, 22 characters, parent change-link guard). Per merge_dev_to_main analysis these are dev-wins (dev's redesign is superior / characters copied byte-identical FROM dev). For each `fix:` commit, confirm dev's refactored file kept the fix.

| File | main commits that touched it |
|---|---|
| `app/(app)/page.tsx` | 47841b4 sync · 1bd7a59 penalty-instance · a59c9c2 overdue-yesterday-only |
| `app/(app)/tasks/page.tsx` | 841cd67 canPardon · 0f074fa penalty-gaps · 1bd7a59 · eb5f2c4 penalty-form · 24f816f penalty+overdue+future |
| `app/(app)/tasks/_checkbox.tsx` | bb44292 overdue-completable-history-only · 20462c8 parent-complete-overdue · 2c5cdb1 · 0f074fa · 1bd7a59 |
| `app/(app)/tasks/history/page.tsx` | bb44292 overdue-completable-history-only |
| `app/(app)/points/history/page.tsx` | 2c5cdb1 penalty-cancel+format-reason |
| `app/(app)/children/[id]/page.tsx` | 47841b4 · 2c5cdb1 · 24f816f |
| `app/(app)/children/[id]/_penalty-form.tsx` | 4bb02f2 negative-points+error · 24f816f |
| `app/(app)/settings,family,family/member/[id]/page.tsx` | 47841b4 sync (CharacterIcon, change-link role guard) |
| `app/(app)/characters/{page,gallery}.tsx`, `onboarding/pick-character` | 47841b4 sync (CharacterIcon) |
| `components/molecules/character-icon.tsx`, `features/characters/image-map.ts` | 47841b4 (new on main; dev has its own — byte-identical per plan) |
| `lib/level.ts` + `level.test.ts` | 47841b4 linear levels (dev = formula-based, dev-wins) |
| `lib/datetime/family-tz.ts` | 24f816f (date helper for overdue/future) |
| `features/points/format-reason.ts` | 2c5cdb1 |
| `lib/i18n/{ko,en,ja}.json` | 665f9fc label · 2c5cdb1 · 1bd7a59 · a59c9c2 · 24f816f (penalty/overdue keys) |
| `app/api/points/penalty/route.ts` | 1bd7a59 · 24f816f |
| `app/api/points/penalty/[id]/cancel/route.ts` | bd8cd7c no-DELETE-RLS · 2c5cdb1 |

**i18n note (from merge plan):** main's `home.missed_yesterday_count` key is REPLACED by dev's `home.overdue_yesterday_badge` — don't re-add the main key; grep it's unused after merge.

---

## 4. Additive on main — safe at merge (no action)
- `supabase/migrations/20260615000001_harden_column_writes.sql` — main-only, dev doesn't touch it → survives merge. (RLS column-write lock; already applied to prod. See `ops/security-followups.md`.)
- The 5 schema migrations (tone/mode/color_mode/level/characters) — originated on dev, also committed to main for history reconciliation; identical → no conflict.

## 5. Docs to carry to dev
- **`CLAUDE.md` STOP block** (main-only): "PROD DB is ahead of main — run `supabase migration list --linked` + diff prod dump before any migration; write migrations defensively." dev devs push migrations too → port the gist into dev's CLAUDE.md.
- `ops/security-followups.md` (this branch): HIGH-02 login enumeration + LOW-03 Zod.

## 6. At merge time (dev → main)
1. Port urgency:high into dev FIRST (section 1) so dev ⊇ main.
2. For each section-3 `fix:` commit, `git diff c2d4d62 main -- <file>` and confirm dev's version kept the fix; if dev refactored the same area, manually preserve the fix's intent.
3. Confirm `send.ts` ends with BOTH dev's admin comments AND urgency:high.
4. After merge: `supabase migration list --linked` (main history should ⊇ prod), `npm run lint && typecheck && test`, then `npx vercel --prod`.
