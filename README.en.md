🌐 [한국어](./README.md) | [English](./README.en.md) | [日本語](./README.ja.md)

# DOOOZ

Stop nagging. Start cheering.

Families lose hours every week reminding kids to do their tasks — and daily tasks become a battleground. **DOOOZ** turns the daily grind into a multi-year adventure: parents assign, kids check off, points flow, characters evolve, and streaks keep the whole family pulling in the same direction.

Built for families who want to see their kids grow — literally — over 5+ years.

## 🤩 Why DOOOZ

- **Self-check, parent-approved.** Kids check off their own tasks for instant points. Beg requests and reward redemptions require parent approval.
- **Points are the language.** One append-only ledger tracks every credit and redemption. No lost points, ever.
- **Kids can ask for more.** The "beg" feature lets children request extra tasks and earn bonus points — parents approve with one tap.
- **Gamification that lasts.** 30 levels, 58 badges, 12 evolving characters — curves tuned for *years*, not a weekend.
- **Auto-pilot.** Daily tasks auto-generate at 1 AM. Evening push reminders at 9 PM nudge incomplete items.
- **App install & push notifications.** Add to home screen to use like a native app. Receive push alerts for beg requests, rewards, and daily reminders.
- **Family data protection.** Each family's data is fully isolated at the database level. Parent-only features are enforced in both code and database.
- **Multilingual.** Korean, Japanese, and English out of the box.

## 📸 Screenshots

| ![Dashboard](./images/DOOOZ%20dashboard.jpeg) | ![Tasks](./images/DOOOZ%20tasks1.png) |
|:---:|:---:|
| Family Detail | Tasks (1) |

| ![Tasks (2)](./images/DOOOZ%20tasks2.png) | ![Rewards](./images/DOOOZ%20rewards.jpeg) |
|:---:|:---:|
| Tasks (2) | Reward Management |

## 💡 Stack

- Next.js 15 (App Router, RSC) + React 19 + TypeScript 5
- Tailwind + shadcn-style primitives
- Supabase (Postgres, Auth, RLS)
- Zod schema validation
- Web Push API (VAPID)
- Deployed on Vercel

## 🔰 New to this? Ask Google or AI

Following this guide requires a small amount of dev environment setup.
- **Opening a terminal** — Mac uses Terminal, Windows uses **PowerShell**. If you don't know how, Google it or ask an AI.
- **git not found?** — Google **"how to install Git"** or ask an AI.
- **npm/npx not found?** — Google **"how to install Node.js"** or ask an AI.

## 🖥️ Run from your terminal

```bash
# 1. Navigate to desired download folder (e.g. Desktop)
cd ~/Desktop

# 2. Clone & install
git clone https://github.com/taekim34/doooz.git
cd doooz && npm install

# 3. Environment variables (copy .env.example to create .env.local)
cp .env.example .env.local   # Fill in the required values (see below)

# 4. Dev server
npm run dev               # http://localhost:3000
```

### Environment Variables

The copied `.env.local` has required values left blank. Open it with any text editor and fill in the values following the guide below.

#### Required (to run locally)

**1. Supabase connection** — Create a free project at [supabase.com](https://supabase.com), then go to Project Settings → API Keys in the left menu and copy the values.

| Variable | Where to find it |
|----------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project home → URL shown below the project name (`https://xxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key |
| `SUPABASE_SERVICE_SECRET_KEY` | Secret key (⚠️ Never share this key publicly) |

> **Register localhost in Supabase** — Go to Supabase Dashboard → Auth → URL Configuration:
> - **Site URL**: `http://localhost:3000`
> - **Redirect URLs**: add all sub-paths (enter: `http://localhost:3000/**`)
>
> Without this, login won't work locally.

**2. Site URL** — For local development, use the value below as-is.

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` |

**3. Push notification keys** — Run this command in your terminal to generate 2 keys. Copy and paste them as-is.

```bash
npx web-push generate-vapid-keys
```

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | The Public Key from the output |
| `VAPID_PRIVATE_KEY` | The Private Key from the output |

**4. Cron secret** — Make up any password. You can change it to a new value anytime. (e.g. `my-secret-123`)

| Variable | Value |
|----------|-------|
| `CRON_SECRET` | Any secret string you choose |

> Once configured, run `npm run dev` to start locally.
> To publish on the internet, follow the "Deploy to Vercel" section below.

#### Optional (defaults in `.env.example` — safe to leave as-is)

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_APP_NAME` | `DOOOZ` | App display name |
| `NEXT_PUBLIC_APP_DESCRIPTION` | `Family tasks, points...` | App description |
| `NEXT_PUBLIC_THEME_COLOR` | `#7c3aed` | App theme color |
| `NEXT_PUBLIC_DEFAULT_LOCALE` | `en` | Default language |
| `NEXT_PUBLIC_LOCALE_COOKIE` | `doooz_locale` | Language setting cookie name |
| `NEXT_PUBLIC_SYNTHETIC_EMAIL_DOMAIN` | `dooooz.invalid` | Fake email domain for child accounts (no real email sent). Not required to match your site domain, but recommended for consistency. |
| `VAPID_CONTACT_EMAIL` | `mailto:noreply@dooooz.invalid` | Push service contact URI. Same as above — matching your domain is recommended but optional. |
| `NEXT_PUBLIC_FAMILY_STORAGE_KEY` | `doooz_family_name` | localStorage key for family name |

## Build Your Family's Online Service 🚀🔥

### Internet deploy setup (Vercel)

This setup only needs to be done once.

1. Sign up free at [vercel.com](https://vercel.com), then go to the dashboard and click **Add New → Project** to create a new project. Choose your desired project name — this becomes your `https://my-project.vercel.app` URL.

2. Install the Vercel CLI:
   ```bash
   npm i -g vercel
   ```

3. Navigate to the doooz folder in your terminal: `cd ~/Desktop/doooz` (adjust to your download path)

4. Run `vercel link`. After logging in, select **Y** for "Link to existing project?" and choose the project you just created.

5. Add the same environment variables to Vercel. Run each command **one at a time** — after running the command, you'll be prompted to enter the value. Paste it and press Enter.

   ```bash
   vercel env add NEXT_PUBLIC_SITE_URL production              # ⚠️ Enter your Vercel deploy URL (e.g. https://my-project.vercel.app)
   vercel env add NEXT_PUBLIC_SUPABASE_URL production
   vercel env add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY production
   vercel env add SUPABASE_SERVICE_SECRET_KEY production
   vercel env add NEXT_PUBLIC_VAPID_PUBLIC_KEY production
   vercel env add VAPID_PRIVATE_KEY production
   vercel env add CRON_SECRET production
   ```

   > Only `NEXT_PUBLIC_SITE_URL` needs to change to your Vercel deploy URL. All other values stay the same as local (`.env.local`).

6. **Register your Vercel URL in Supabase** — Dashboard → Auth → URL Configuration:
   - **Site URL**: your Vercel URL (e.g. `https://my-project.vercel.app`)
   - **Redirect URLs**: add all sub-paths for your Vercel URL (enter: `https://my-project.vercel.app/**`) — keep the `localhost:3000` entry from the local setup

### Deploy 🥳

Run the following command in your terminal and wait — your DOOOZ source will be deployed to Vercel's servers.

```bash
vercel --prod
```

Once deployed, you and your family can access `https://my-project.vercel.app` from any computer or mobile device!

Whenever you modify the source code, run `vercel --prod` again to update the live service.

### Setting up a dev environment

This guide has the local computer and internet deployment pointing to the same environment. If you plan to modify the source code yourself, we recommend setting up a separate dev environment.

## 🎩 Magic Prompts — Build It With Your Kids

Want to build a similar app yourself? We've prepared prompt guides that let you paste prompts into any AI assistant (Claude, ChatGPT, Gemini, etc.) and build a similar app from scratch.

### Prerequisites

If you're using an AI coding tool (like Claude Code), connecting Supabase MCP lets the AI create and manage your database directly — very convenient. Especially if you ask it to "follow Supabase best practices," it can help you build a solid database environment even if you're not familiar with databases. Vercel CLI is already installed from the "Internet deploy setup" step above.

### Prompts

- **[One-shot prompt](./guides/magic-prompt-one-shot.md)** — Copy the entire prompt into an AI chat and get a working app in one go.
- **[Step-by-step prompts](./guides/magic-prompt-steps.md)** — Follow a guided sequence of prompts, one at a time, to build the app incrementally.

These guides are written in Korean but work with any AI regardless of language settings. Build your own app with your kids!

## 📜 Key Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Run dev server on your computer (`http://localhost:3000`) |
| `npm run build` | Check for build errors before deploying |
| `npm run typecheck` | Check for type errors |
| `npm run lint` | Check code style |
| `vercel --prod` | Deploy to the internet |

## 📂 Folder Structure

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

## 💰 Free Tier Operations Guide

DOOOZ runs entirely on Supabase + Vercel free tiers. Since there are no image/file uploads and only text data is stored, resource usage is very low.

### How many families can use it?

Based on 1 family = 1 parent + 2-3 kids, 10-15 task checks per day:

| Resource | Free Limit | Per Family/Month | Max Families |
|----------|-----------|-----------------|-------------|
| Supabase bandwidth | 5GB/mo | ~6MB | ~800 |
| Supabase DB storage | 500MB | ~230KB/mo (cumulative) | ~180 (1 year) |
| Vercel bandwidth | 100GB/mo | ~5MB | ~18,000 |

- **Single family use**: only 1-2% of free limits.
- **100-200 families** can run for a year within free tier.

### What to monitor

- **Supabase Dashboard → Settings → Billing**: bandwidth, DB storage
- **Vercel Dashboard → Usage**: bandwidth, function execution time

### If DB storage runs low

DB storage (500MB) will be the first limit reached with long-term use:
- Clean up old task instances (completed past records)
- Upgrade to Supabase Pro ($25/mo, 8GB DB)

## 🤝 Contributing

DOOOZ is an open-source project and we welcome contributions from everyone!

- 🎨 **Designers** — We're looking for designers to help improve the UI/UX.
- 🌍 **Multilingual & Global** — New language translations and adaptations for different countries are welcome.
- 👨‍👩‍👧‍👦 **Test Families** — We welcome families who will use the app daily and actively test it. We can provide access to a pre-built service.

Feel free to open an Issue or Pull Request!

## 📄 License

[Apache License 2.0](./LICENSE)
