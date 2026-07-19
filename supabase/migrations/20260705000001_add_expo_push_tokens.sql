-- Native (Expo) push tokens for the child mobile app.
--
-- Separate from public.push_subscriptions (web-push / VAPID) because an Expo
-- token is a single opaque "ExponentPushToken[...]" string, not an endpoint +
-- p256dh/auth keys. Fan-out mirrors push_subscriptions: no family_id column —
-- the sender joins on users. The evening-reminder cron + beg push reach native
-- users automatically because sendPushToUsers() now also calls the Expo sender.
--
-- PURELY ADDITIVE: new table + policies only. No DML, no destructive DDL, so
-- there is no data-loss surface. RLS scopes every row to its owner (auth.uid());
-- the cron reads via the service_role admin client (RLS-bypass), so no SELECT
-- policy for the service role is needed. Grants mirror push_subscriptions
-- (GRANT ALL + RLS gates real access; anon has no auth.uid() so it is blocked).
--
-- STOP / safety (repo CLAUDE.md + migration-safety-review): drift checked clean
-- (all migrations local==remote as of authoring). Confirm the table is absent in
-- the prod dump and re-check drift immediately BEFORE applying. NOT applied by
-- this sprint run — apply is user-gated (local test first, then prod).

create table if not exists public.expo_push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  token text not null,
  platform text,
  created_at timestamptz not null default now(),
  constraint expo_push_tokens_user_id_token_key unique (user_id, token)
);

alter table public.expo_push_tokens enable row level security;

create policy "expo_push_select" on public.expo_push_tokens
  for select using (user_id = auth.uid());
create policy "expo_push_insert" on public.expo_push_tokens
  for insert with check (user_id = auth.uid());
create policy "expo_push_update" on public.expo_push_tokens
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "expo_push_delete" on public.expo_push_tokens
  for delete using (user_id = auth.uid());

grant all on table public.expo_push_tokens to anon;
grant all on table public.expo_push_tokens to authenticated;
grant all on table public.expo_push_tokens to service_role;
