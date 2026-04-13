# dooooz

Stop nagging. Start cheering.

Families lose hours every week reminding kids to do chores — and chores become a battleground. **dooooz** turns the daily grind into a multi-year adventure: parents assign, kids check off, points flow, characters evolve, and streaks keep the whole family pulling in the same direction.

Built for families who want to see their kids grow — literally — over 5+ years.

## Why dooooz

- **Trust-based, instant credit.** Kids tap, points land. No pestering, no approval bottleneck.
- **Points are the language.** One append-only ledger tracks every credit and redemption. No lost points, ever.
- **Gamification that lasts.** 30 levels, 40 badges, 10 evolving characters — curves tuned for *years*, not a weekend.
- **Goals with teeth.** Weekly, monthly, quarterly, yearly, and multi-year goals — with sub-goal support.
- **Family-first privacy.** Row-level security isolates every family at the database layer.

## Stack

- Next.js 15 (App Router, RSC) + React 19 + TypeScript 5
- Tailwind + shadcn-style primitives
- Supabase (Postgres, Auth, Realtime, RLS)
- Zustand + TanStack Query + Zod

## Setup

```bash
# 1. clone + install
npm install

# 2. env
cp .env.example .env.local
# fill NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

# 3. supabase local
supabase start            # spins up local Postgres + Auth + Realtime
supabase db reset         # applies migrations + seeds characters & badges

# 4. dev
npm run dev               # http://localhost:3000
```

Local Supabase migrations live in `supabase/migrations/`. `db reset` replays them in order and runs `seed.sql` last.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm test` | Vitest unit tests (level, streak, invariants, schemas) |
| `npm run test:watch` | Vitest watch mode |
| `npm run test:e2e` | Playwright E2E (requires `npm run dev` running) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint — enforces `no-restricted-syntax` ban on `new Date()` |

## Folder Structure

```
src/
├─ app/
│  ├─ (auth)/              login, signup, onboarding
│  ├─ (app)/               protected routes — home, chores, points, rewards, goals, family
│  └─ api/                 route handlers (complete chore, redeem, evaluate badges, etc.)
├─ features/
│  ├─ auth/                requireUser, getCurrentAuth
│  └─ characters/          emoji placeholder map
├─ lib/
│  ├─ supabase/            client, server, admin clients + typed Database shell
│  ├─ datetime/            family-tz utilities + injectable clock (I10)
│  ├─ level.ts             L1–L30 threshold calculator
│  ├─ streak.ts            consecutive-day streak computation
│  └─ invariants.ts        I1–I10 documentation + ledger assertion helper
├─ schemas/                shared zod (family, user, chore, point, reward, goal, badge)
└─ components/ui/          shadcn-style primitives

supabase/
├─ migrations/
│  ├─ 20260411000001_initial_schema.sql   tables, RLS, triggers, indexes
│  └─ 20260411000002_flows.sql            complete_chore, redeem_points, evaluate_*, ensure_today_instances
└─ seed.sql                                10 characters + 40 badges

tests/
├─ unit/                   (reserved; current unit tests live alongside sources)
├─ integration/rls.test.ts RLS matrix (it.todo — requires Supabase local)
└─ e2e/flows.spec.ts       7 Playwright scenarios (test.fixme)
```

## Design & Gap Analysis

- Full spec: [`docs/superpowers/specs/2026-04-11-dooooz-design.md`](./docs/superpowers/specs/2026-04-11-dooooz-design.md) — data model, invariants I1–I10, gamification curves, flows, testing strategy.
- Gap analysis: [`docs/superpowers/specs/2026-04-11-dooooz-gap-analysis.md`](./docs/superpowers/specs/2026-04-11-dooooz-gap-analysis.md) — MVP checklist status, invariant enforcement map, deferred TODOs.
