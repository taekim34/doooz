# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev                                          # dev server
npm run build                                        # production build
npm run lint && npm run typecheck                    # static checks
npm run test                                         # vitest all
npx vitest run src/lib/streak.test.ts                # single file
npm run test:e2e                                     # playwright
```

## Architecture

Next.js 15 App Router + React 19 + TS 5 + Supabase (Postgres/Auth/RLS) + Tailwind + Vercel.

**Domain:** Family task gamification. Parents create templates → cron generates daily instances → kids complete → points (append-only ledger) → levels (30) / badges (58) / characters (12). "Beg" = kids request extra tasks.

### Routes

- `(app)/` — Auth required. `layout.tsx` → `requireUser()` → onboarding redirect chain.
- `(auth)/` — Public. Login, signup, onboarding, join.
- `api/` — RPCs, cron, push, badges.

### Key Paths

- `features/auth/current-user.ts` — `requireUser()` / `getCurrentAuth()`
- `features/tasks/actions.ts` — Server actions (`"use server"`)
- `schemas/` — Zod per domain
- `lib/supabase/` — 3 clients (see below)
- `lib/i18n/` — `useT()`, locale per family (en/ko/ja)
- `lib/datetime/` — Family TZ via `date-fns-tz`, `clock.ts` for testable time
- `components/ui/` — Shared primitives
- `(app)/_*.tsx` — Non-routable layout components

### Conventions

- Aliases: `@/*` → `src/*`, `@/features/*`, `@/lib/*`, `@/schemas/*`, `@/components/*`
- `noUncheckedIndexedAccess: true` — index access returns `T | undefined`
- `typedRoutes: true`
- `_` prefix = client component co-located with server page
- Types: `npx supabase gen types typescript` → `lib/supabase/types.ts`

## Critical Rules

### Supabase Clients — NEVER Mix

| Context | Client | RLS |
|---------|--------|-----|
| RSC / Server Actions / API routes | `server.ts` | Yes |
| Client Components | `client.ts` | Yes |
| `/api/cron/*` only | `admin.ts` | **No** — bypasses RLS |

**`admin.ts` in actions/routes = cross-family data leak.**

### Invariants

- **I1/I2:** `current_balance` / `lifetime_earned` are trigger-computed caches. Never UPDATE directly.
- **I4:** One `task_reward` per instance (ON CONFLICT).
- **I5:** `family_id` perimeter — RLS enforced.
- **I6:** `point_transactions` is **append-only**. Reverse via `adjustment` INSERT.
- **I7:** Completed instances are **immutable** (trigger-blocked).
- **I10:** All dates in **family timezone** (`lib/datetime`), never raw UTC/client time.

### Recurrence = JSONB Discriminated Union

- `{ kind: 'once', due_date: 'YYYY-MM-DD' }`
- `{ kind: 'weekly', days: [0..6] }` (0=Sun)

Parse: `recurrenceSchema`. SQL: `recurrence ->> 'kind'`. Actions: `parseRecurrenceFromFormData()`.

### Task Status Transitions

```
pending → completed (complete_task RPC, idempotent)
pending → overdue   (midnight rollover)
overdue → pardoned  (pardon_task, parent-only, +50 adjustment)
completed → pending (uncomplete_task — revokes badges!)
requested → pending (beg approve) | deleted (cancel/reject)
```

### Other Non-Obvious Rules

- **Level sync:** `src/lib/level.ts` ↔ `calculate_level()` SQL — change both or neither.
- **Cron:** Fixed KST (01:00 rollover, 21:00 reminder). RPCs convert via `now() AT TIME ZONE f.timezone`.
- **Streaks:** Tolerates incomplete today (ends at today OR today-1).
- **3-layer validation:** App code → RPC → RLS/triggers. All must agree.
- **Actions vs Routes:** Actions for RLS-sufficient mutations. Routes for RPCs or cron (CRON_SECRET).

## Workflow & Skills

### Recommended Skills

- **supabase** + **supabase-postgres-best-practices** — DB work
- **bkit pdca** — structured workflow (3 Agent Teams + 9-phase pipeline)
- **superpowers** — complements bkit (brainstorming, TDD, verification, code-review)
- **my-* skill chains** — deep domain workflows (see below)

### Feature Development Workflow

**Planning phase** — lean on bkit PM Team (`pm-lead` → pm-discovery, pm-strategy, pm-research, pm-prd). Use `plan-plus` or superpowers `brainstorming` when exploring new directions.

**Implementation phase** — CTO Team (`cto-lead`) drives architecture and coding. QA Team (`qa-lead`) validates in parallel. Both teams may recruit superpowers agents (TDD, verification, code-review) as auxiliary force for fresh perspectives.

**my-* skill chains** — CTO Team uses these chained workflows for deeper work:

```
Backend chain:    my-infra-architect → my-backend-architect → my-backend-dev
                  (infra-design.md)    (backend-architecture.md)  (TDD implementation)

Frontend chain:   my-designer → my-design-system → my-frontend-dev
                  (UX direction)  (design-system.md)   (Clean Architecture code)
```

Each skill produces a `docs/*.md` artifact that feeds the next. CTO Team invokes these chains when the corresponding pipeline phase demands deep design (not for every small change).

**When stuck or pivoting** — consult the 9-phase pipeline (schema → convention → mockup → api → design-system → ui → seo-security → review → deploy) to locate where you are and what comes next.

**QA** — if Docker is available locally, use `zero-script-qa` for automated log-based testing without writing test scripts.

**Quality gate** — gap-detector + pdca-iterator: iterate until match rate ≥ 90%, then report.

### DB: Conservative

- New tables MUST have RLS. Review: secure but not over-engineered (`family_id` isolation is usually sufficient).
- Backup → test locally → never apply directly to production.
