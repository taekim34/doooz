# Security Follow-ups (fix on dev)

Remaining items from the 2026-04-13 security audit (`bkit-docs/03-analysis/security-audit-2026-04-13.md`). **Not urgent** — fix on dev alongside the visual-redesign work. The critical/urgent items were already hotfixed on `main` → prod (2026-06-16): column-write RLS lock (`20260615000001_harden_column_writes`), Vercel WAF rate limiting. Low-severity items below are deferred here on purpose.

(Placed in `ops/` because `docs/` is gitignored in this repo.)

---

## HIGH-02 — User enumeration in family login

**File:** `src/app/(auth)/login/page.tsx` → `familyLoginAction`

**Problem:** the family-login path returns *step-specific* errors —
`error_family_not_found` → `error_name_not_found` → `error_account_not_found` → `error_wrong_password`.
An attacker can probe which families / names / accounts exist (an enumeration oracle), narrowing brute-force targets. The **email** login path already returns a single generic "Invalid credentials".

**Fix:** collapse every *post-submit* failure branch (family not found, name not found, account not found, wrong password) into ONE generic message — reuse the email path's generic credential error. Log the real reason **server-side only** (`console.error`).
- Keep the empty-field guard (`error_all_required`) — that is pre-submit form validation, not enumeration.
- Add the generic message key to i18n (`ko`/`en`/`ja`) if missing.

**Trade-off:** users lose the hint of whether the family name vs name vs password was wrong. Acceptable — it matches how email login already behaves.

**Verify:** all four failure paths return the identical client message; server log still distinguishes for debugging.

---

## LOW-03 — Ad-hoc input validation on API routes (use Zod)

**Files:** `src/app/api/rewards/request/route.ts`, `src/app/api/tasks/beg/route.ts`, `src/app/api/push/subscribe/route.ts`

**Problem:** these validate input by hand (`if (!body.reward_id)`, `String(body.title)`) instead of Zod schemas. Not directly exploitable (Supabase parameterizes queries) but inconsistent and fragile — malformed bodies can slip through.

**Fix:** mirror the existing pattern in `src/app/api/points/redeem/route.ts` (`redeemInputSchema.safeParse()`). Add schemas under `src/schemas/`:
- `begInputSchema` — `{ title: string, trimmed, 1..N chars }`
- `rewardRequestInputSchema` — `{ reward_id: uuid }`
- `pushSubscriptionSchema` — `{ endpoint: url, keys: { p256dh: string, auth: string } }`

Use `safeParse`; on failure return `400` with a generic message.

**Verify:** invalid/malformed bodies are rejected consistently with `400`.

---

## Reviewed — NOT doing (low/no value)
- **MEDIUM-05** (internal error exposure): largely mitigated already — `error.message` is used for HTTP status-code mapping / server logs, not returned raw to clients. No action.
- **LOW-02** (push endpoint partial logging, `send.ts` logs last 20 chars on failure): server-log only, hygiene-level. Optional.

---

## IMPORTANT — main hotfixes NOT yet on dev (preserve at merge)
`main` received prod hotfixes that dev does NOT have. The dev→main merge plan is "dev-wins" on conflicts — **do not blindly dev-win these, or you regress prod:**
- **Web Push `urgency: "high"`** — `src/lib/push/send.ts` (3rd arg to `webpush.sendNotification`) + `src/types/web-push.d.ts` (options param). Without it, notifications are delayed on locked/idle phones. dev's `send.ts` lacks this → a naive dev-wins merge drops it. Port this change into dev (`{ urgency: "high", TTL: 86400 }` + the type's 3rd param) so the merge can't lose it.
- **`20260615000001_harden_column_writes.sql`** migration — additive file on `main` only; dev doesn't touch it, so it survives the merge. No action needed, just don't delete it.
