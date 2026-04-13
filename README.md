# dooooz

Stop nagging. Start cheering.

Families lose hours every week reminding kids to do their tasks — and daily tasks become a battleground. **dooooz** turns the daily grind into a multi-year adventure: parents assign, kids check off, points flow, characters evolve, and streaks keep the whole family pulling in the same direction.

Built for families who want to see their kids grow — literally — over 5+ years.

## Why dooooz

- **Trust-based, instant credit.** Kids tap, points land. No pestering, no approval bottleneck.
- **Points are the language.** One append-only ledger tracks every credit and redemption. No lost points, ever.
- **Kids can ask for more.** The "beg" feature lets children request extra tasks and earn bonus points — parents approve with one tap.
- **Gamification that lasts.** 30 levels, 58 badges, 12 evolving characters — curves tuned for *years*, not a weekend.
- **Auto-pilot.** Daily tasks auto-generate at midnight. Evening push reminders nudge incomplete items.
- **Installable PWA.** Add to home screen on any device — works offline-first with background sync.
- **Family-first privacy.** Row-level security isolates every family at the database layer. Parent-only permissions enforced at both code and DB level.
- **Multilingual.** Korean, Japanese, and English out of the box.

## Stack

- Next.js 15 (App Router, RSC) + React 19 + TypeScript 5
- Tailwind + shadcn-style primitives
- Supabase (Postgres, Auth, RLS)
- Zod schema validation
- Web Push API (VAPID)
- Deployed on Vercel

## Setup

```bash
# 1. Clone & install
git clone https://github.com/taekim34/doooz.git
cd doooz && npm install

# 2. Environment variables
cp .env.example .env.local
# Fill in the required values (see below)

# 3. Dev server
npm run dev               # http://localhost:3000
```

### Using tene (recommended)

[tene](https://github.com/tomo-kay/tene) encrypts secrets locally so AI coding agents never see them.

```bash
curl -sSfL https://tene.sh/install.sh | sh
tene init
tene import .env.local          # import your secrets
rm .env.local                   # no more plaintext secrets
tene run -- npm run dev         # secrets injected at runtime
```

### Environment Variables

All variables are defined in [`.env.example`](./.env.example). Copy it and fill in the values.

#### Required (no defaults — must be set)

| Variable | Where to get it | Notes |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Your deployment URL | e.g. `https://<project>.vercel.app` or your custom domain. Must also be set in **Supabase Dashboard → Auth → URL Configuration** and in `supabase/config.toml`. |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API Keys | Public (anon) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API Keys | Secret — never expose to client |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | `npx web-push generate-vapid-keys` | Public key |
| `VAPID_PRIVATE_KEY` | Same command above | Private key |
| `CRON_SECRET` | Any random string | Used to authenticate cron job requests |

#### Optional (defaults pre-filled in `.env.example`)

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_APP_NAME` | `DOOOZ` | App display name (manifest, title) |
| `NEXT_PUBLIC_APP_DESCRIPTION` | `Family tasks, points...` | App description |
| `NEXT_PUBLIC_THEME_COLOR` | `#7c3aed` | PWA theme color |
| `NEXT_PUBLIC_DEFAULT_LOCALE` | `en` | Fallback language (see supported locales above) |
| `NEXT_PUBLIC_LOCALE_COOKIE` | `doooz_locale` | Cookie name for language preference |
| `NEXT_PUBLIC_SYNTHETIC_EMAIL_DOMAIN` | `dooooz.invalid` | Fake email domain for child accounts (no real email sent). Not required to match your site domain, but recommended for consistency. |
| `VAPID_CONTACT_EMAIL` | `mailto:noreply@dooooz.invalid` | Push service contact URI. Same as above — matching your domain is recommended but optional. |
| `NEXT_PUBLIC_FAMILY_STORAGE_KEY` | `doooz_family_name` | localStorage key for family name |

### Deploying to Vercel

1. Link repo: `vercel link`
2. Add all **required** env vars: `vercel env add <NAME> production`
3. Set **Supabase Auth URLs** (Dashboard → Auth → URL Configuration):
   - **Site URL**: your Vercel domain (e.g. `https://<project>.vercel.app`)
   - **Redirect URLs**: add `https://<project>.vercel.app/**` and `http://localhost:3000` (for local dev)
4. Update `supabase/config.toml` → `site_url` and `additional_redirect_urls` to match
5. Deploy: `vercel --prod`

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm test` | Vitest unit tests (level, streak, invariants, schemas) |
| `npm run test:watch` | Vitest watch mode |
| `npm run test:e2e` | Playwright E2E (requires `npm run dev` running) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |

## Folder Structure

```
src/
├─ app/
│  ├─ (auth)/              login, signup, onboarding
│  ├─ (app)/               protected routes — home, tasks, points, rewards, characters, family, settings
│  └─ api/                 route handlers + cron jobs (evening-reminder, midnight-rollover)
├─ features/
│  ├─ auth/                requireUser, getCurrentAuth
│  ├─ tasks/               server actions (update, pardon)
│  ├─ children/            rank calculation
│  └─ characters/          emoji map
├─ lib/
│  ├─ supabase/            client, server, admin clients + typed Database
│  ├─ datetime/            family-tz utilities + injectable clock
│  ├─ i18n/                ko.json, ja.json, en.json + translation helpers
│  ├─ push/                web push notification sender
│  ├─ level.ts             L1-L30 threshold calculator
│  ├─ streak.ts            consecutive-day streak computation
│  └─ invariants.ts        I1-I10 ledger assertion helper
├─ schemas/                Zod schemas (family, user, task, point, reward, badge)
└─ components/ui/          shadcn-style primitives

supabase/
├─ migrations/             schema, RLS, triggers, indexes
└─ seed.sql                12 characters + 58 badges

tests/
├─ unit/                   co-located with source files
├─ integration/            RLS matrix
└─ e2e/                    Playwright scenarios
```

## License

[Apache License 2.0](./LICENSE)
