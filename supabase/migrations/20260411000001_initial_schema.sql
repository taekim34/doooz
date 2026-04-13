-- dooooz initial schema
-- Implements spec Section 3.1 + invariants I1-I10

set search_path = public;

-- ============================================================
-- Helper: calculate_level(lifetime int) returns int
-- Thresholds from spec Section 5.1
-- ============================================================
create or replace function calculate_level(lifetime int)
returns int
language sql
immutable
as $$
  select case
    when lifetime >= 562000 then 30
    when lifetime >= 516000 then 29
    when lifetime >= 472000 then 28
    when lifetime >= 430000 then 27
    when lifetime >= 390000 then 26
    when lifetime >= 352000 then 25
    when lifetime >= 316000 then 24
    when lifetime >= 282000 then 23
    when lifetime >= 250000 then 22
    when lifetime >= 220000 then 21
    when lifetime >= 192000 then 20
    when lifetime >= 166000 then 19
    when lifetime >= 142000 then 18
    when lifetime >= 120000 then 17
    when lifetime >= 100000 then 16
    when lifetime >= 82000  then 15
    when lifetime >= 66000  then 14
    when lifetime >= 52000  then 13
    when lifetime >= 40000  then 12
    when lifetime >= 30000  then 11
    when lifetime >= 22000  then 10
    when lifetime >= 16000  then 9
    when lifetime >= 11000  then 8
    when lifetime >= 7000   then 7
    when lifetime >= 4000   then 6
    when lifetime >= 2000   then 5
    when lifetime >= 1000   then 4
    when lifetime >= 500    then 3
    when lifetime >= 200    then 2
    else 1
  end;
$$;

-- ============================================================
-- Tables
-- ============================================================

-- Characters (global seed)
create table if not exists characters (
  id              text primary key,
  name            text not null,
  unlock_level    int not null default 0,
  asset_base_path text not null
);

-- Badges (global seed)
create table if not exists badges (
  id           text primary key,
  name         text not null,
  description  text,
  icon         text,
  rule_type    text not null check (rule_type in (
    'total_count','streak','lifetime_points','redemption',
    'goal_count','anniversary','perfect_day','perfect_week',
    'time_condition','hard_worker'
  )),
  rule_value   int not null default 0
);

-- Families
create table if not exists families (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  invite_code text unique not null check (char_length(invite_code) = 8),
  timezone    text not null default 'Asia/Seoul',
  created_at  timestamptz not null default now()
);

-- Users (extends auth.users)
create table if not exists users (
  id              uuid primary key references auth.users(id) on delete cascade,
  family_id       uuid not null references families(id) on delete cascade,
  role            text not null check (role in ('parent','child')),
  display_name    text not null,
  birth_date      date,
  character_id    text references characters(id),
  current_balance int not null default 0,
  lifetime_earned int not null default 0 check (lifetime_earned >= 0),
  level           int not null default 1 check (level between 1 and 30),
  created_at      timestamptz not null default now()
);
create index if not exists users_family_id_idx on users(family_id);

-- Chore templates
create table if not exists chore_templates (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references families(id) on delete cascade,
  assignee_id uuid not null references users(id) on delete cascade,
  title       text not null,
  description text,
  points      int not null check (points between 1 and 1000),
  recurrence  text not null,
  start_date  date not null,
  end_date    date,
  active      boolean not null default true,
  created_by  uuid not null references users(id),
  created_at  timestamptz not null default now()
);
create index if not exists chore_templates_family_idx on chore_templates(family_id);
create index if not exists chore_templates_assignee_idx on chore_templates(assignee_id);

-- Chore instances
create table if not exists chore_instances (
  id           uuid primary key default gen_random_uuid(),
  family_id    uuid not null references families(id) on delete cascade,
  template_id  uuid references chore_templates(id) on delete set null,
  assignee_id  uuid not null references users(id) on delete cascade,
  title        text not null,
  points       int not null check (points between 1 and 1000),
  due_date     date not null,
  status       text not null default 'pending' check (status in ('pending','completed','skipped')),
  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  unique (template_id, assignee_id, due_date)
);
create index if not exists chore_instances_family_idx on chore_instances(family_id);
create index if not exists chore_instances_assignee_due_idx on chore_instances(assignee_id, due_date);

-- Goals
create table if not exists goals (
  id                         uuid primary key default gen_random_uuid(),
  family_id                  uuid not null references families(id) on delete cascade,
  assignee_id                uuid not null references users(id) on delete cascade,
  parent_goal_id             uuid references goals(id) on delete set null,
  title                      text not null,
  description                text,
  goal_type                  text not null check (goal_type in ('period_chore_count','period_points','manual')),
  target_chore_template_id   uuid references chore_templates(id) on delete set null,
  target_count               int,
  target_points              int,
  start_date                 date,
  end_date                   date,
  reward_points              int not null default 100,
  reward_badge_id            text references badges(id),
  status                     text not null default 'active' check (status in ('active','completed','failed','cancelled')),
  progress                   int not null default 0,
  checkpoint_interval        text check (checkpoint_interval in ('monthly','quarterly') or checkpoint_interval is null),
  completed_at               timestamptz,
  created_by                 uuid not null references users(id),
  created_at                 timestamptz not null default now()
);
create index if not exists goals_family_idx on goals(family_id);
create index if not exists goals_assignee_idx on goals(assignee_id);

-- Point transactions (append-only ledger)
create table if not exists point_transactions (
  id               uuid primary key default gen_random_uuid(),
  family_id        uuid not null references families(id) on delete cascade,
  user_id          uuid not null references users(id) on delete cascade,
  amount           int not null,
  kind             text not null check (kind in ('chore_reward','redemption','adjustment','bonus','goal_reward')),
  reason           text not null,
  related_chore_id uuid references chore_instances(id) on delete set null,
  related_goal_id  uuid references goals(id) on delete set null,
  actor_id         uuid not null references users(id),
  created_at       timestamptz not null default now()
);
create index if not exists point_tx_user_idx on point_transactions(user_id, created_at desc);
create index if not exists point_tx_family_idx on point_transactions(family_id, created_at desc);

-- I4: one chore_reward per chore_instance
create unique index if not exists point_tx_unique_chore_reward
  on point_transactions(related_chore_id)
  where kind = 'chore_reward';

-- Rewards catalog
create table if not exists rewards (
  id         uuid primary key default gen_random_uuid(),
  family_id  uuid not null references families(id) on delete cascade,
  title      text not null,
  cost       int not null check (cost between 1 and 1000000),
  icon       text,
  active     boolean not null default true,
  created_by uuid not null references users(id),
  created_at timestamptz not null default now()
);
create index if not exists rewards_family_idx on rewards(family_id);

-- User badges
create table if not exists user_badges (
  user_id   uuid not null references users(id) on delete cascade,
  badge_id  text not null references badges(id),
  earned_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

-- ============================================================
-- Triggers
-- ============================================================

-- I1 + I2: update cached balance and lifetime on ledger insert
create or replace function update_user_point_cache()
returns trigger
language plpgsql
as $$
declare
  new_lifetime int;
begin
  update users
     set current_balance = current_balance + NEW.amount
   where id = NEW.user_id;

  if NEW.amount > 0 and NEW.kind in ('chore_reward','bonus','goal_reward') then
    update users
       set lifetime_earned = lifetime_earned + NEW.amount
     where id = NEW.user_id
     returning lifetime_earned into new_lifetime;

    update users
       set level = calculate_level(new_lifetime)
     where id = NEW.user_id;
  end if;

  return NEW;
end;
$$;

drop trigger if exists trg_update_user_point_cache on point_transactions;
create trigger trg_update_user_point_cache
  after insert on point_transactions
  for each row execute function update_user_point_cache();

-- I7: completed chore_instances are immutable
create or replace function prevent_completed_chore_update()
returns trigger
language plpgsql
as $$
begin
  if OLD.status = 'completed' then
    raise exception 'chore_instance is immutable once completed (I7)';
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_prevent_completed_chore_update on chore_instances;
create trigger trg_prevent_completed_chore_update
  before update on chore_instances
  for each row execute function prevent_completed_chore_update();

-- ============================================================
-- Row Level Security
-- ============================================================

alter table families           enable row level security;
alter table users              enable row level security;
alter table chore_templates    enable row level security;
alter table chore_instances    enable row level security;
alter table point_transactions enable row level security;
alter table rewards            enable row level security;
alter table goals              enable row level security;
alter table user_badges        enable row level security;
alter table characters         enable row level security;
alter table badges             enable row level security;

-- Characters and badges are global read-only to authenticated users
create policy characters_select on characters for select to authenticated using (true);
create policy badges_select     on badges     for select to authenticated using (true);

-- Helper: current user's family_id
-- Inlined via subquery for simplicity.

-- families policies
create policy families_select on families
  for select to authenticated
  using (id = (select family_id from users where id = auth.uid()));

create policy families_insert on families
  for insert to authenticated
  with check (true);

create policy families_update on families
  for update to authenticated
  using (id = (select family_id from users where id = auth.uid()))
  with check (id = (select family_id from users where id = auth.uid()));

-- users policies
create policy users_select on users
  for select to authenticated
  using (family_id = (select family_id from users u where u.id = auth.uid()));

create policy users_insert on users
  for insert to authenticated
  with check (id = auth.uid());

create policy users_update on users
  for update to authenticated
  using (family_id = (select family_id from users u where u.id = auth.uid()))
  with check (family_id = (select family_id from users u where u.id = auth.uid()));

create policy users_delete on users
  for delete to authenticated
  using (family_id = (select family_id from users u where u.id = auth.uid()));

-- generic family-scoped policy generator for remaining tables
do $$
declare
  t text;
  tbls text[] := array[
    'chore_templates',
    'chore_instances',
    'rewards',
    'goals'
  ];
begin
  foreach t in array tbls loop
    execute format($f$
      create policy %1$s_select on %1$I
        for select to authenticated
        using (family_id = (select family_id from users where id = auth.uid()));
    $f$, t);
    execute format($f$
      create policy %1$s_insert on %1$I
        for insert to authenticated
        with check (family_id = (select family_id from users where id = auth.uid()));
    $f$, t);
    execute format($f$
      create policy %1$s_update on %1$I
        for update to authenticated
        using (family_id = (select family_id from users where id = auth.uid()))
        with check (family_id = (select family_id from users where id = auth.uid()));
    $f$, t);
    execute format($f$
      create policy %1$s_delete on %1$I
        for delete to authenticated
        using (family_id = (select family_id from users where id = auth.uid()));
    $f$, t);
  end loop;
end$$;

-- point_transactions: SELECT + INSERT only (I6 append-only)
create policy point_transactions_select on point_transactions
  for select to authenticated
  using (family_id = (select family_id from users where id = auth.uid()));

create policy point_transactions_insert on point_transactions
  for insert to authenticated
  with check (family_id = (select family_id from users where id = auth.uid()));

-- I6: enforce append-only by revoking UPDATE/DELETE from authenticated
revoke update, delete on point_transactions from authenticated;

-- user_badges policies
create policy user_badges_select on user_badges
  for select to authenticated
  using (user_id in (select id from users where family_id = (select family_id from users where id = auth.uid())));

create policy user_badges_insert on user_badges
  for insert to authenticated
  with check (user_id in (select id from users where family_id = (select family_id from users where id = auth.uid())));

create policy user_badges_delete on user_badges
  for delete to authenticated
  using (user_id in (select id from users where family_id = (select family_id from users where id = auth.uid())));
