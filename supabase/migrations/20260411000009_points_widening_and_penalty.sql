-- Migration 9: widen points cap, add 'penalty' ledger kind, pg_cron midnight rollover
-- Spec §1 (#1, #3), invariant I2 relaxation (negative balance allowed).
set search_path = public, pg_temp;

-- 1. Widen points cap on chore_templates and chore_instances
alter table public.chore_templates
  drop constraint chore_templates_points_check,
  add  constraint chore_templates_points_check check (points between 1 and 10000);

alter table public.chore_instances
  drop constraint chore_instances_points_check,
  add  constraint chore_instances_points_check check (points between 1 and 10000);

-- 2. Extend point_transactions.kind to include 'penalty'
alter table public.point_transactions
  drop constraint point_transactions_kind_check,
  add  constraint point_transactions_kind_check
    check (kind in ('chore_reward','redemption','adjustment','bonus','goal_reward','penalty'));

-- 3. pg_cron extension
create extension if not exists pg_cron with schema extensions;

-- 4. family_rollover_log for idempotency (service role / definer only)
create table if not exists public.family_rollover_log (
  family_id  uuid not null references public.families(id) on delete cascade,
  local_date date not null,
  ran_at     timestamptz not null default now(),
  primary key (family_id, local_date)
);

alter table public.family_rollover_log enable row level security;
-- Deny by default: no policies, no grants for anon/authenticated.
revoke all on public.family_rollover_log from anon, authenticated;

-- 5. Unique index: at most one penalty per chore instance (guarantees idempotent rollover)
create unique index if not exists point_tx_unique_penalty
  on public.point_transactions(related_chore_id)
  where kind = 'penalty';

-- 6. dooooz_midnight_rollover function
-- Self-guards against running before migration 10 (recurrence column type is text),
-- so deploying 9 -> 10 separately is safe.
create or replace function public.dooooz_midnight_rollover()
returns int
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  f record;
  v_local_today date;
  v_yesterday date;
  v_processed int := 0;
  v_inst record;
  v_recurrence_is_jsonb boolean;
begin
  select (data_type = 'jsonb')
    into v_recurrence_is_jsonb
    from information_schema.columns
   where table_schema = 'public'
     and table_name   = 'chore_templates'
     and column_name  = 'recurrence';

  if not coalesce(v_recurrence_is_jsonb, false) then
    return 0;
  end if;

  for f in select id, timezone from public.families loop
    v_local_today := (now() at time zone f.timezone)::date;
    v_yesterday   := v_local_today - 1;

    if exists (
      select 1 from public.family_rollover_log
       where family_id = f.id and local_date = v_yesterday
    ) then
      continue;
    end if;

    -- A) Weekly (recurring) chores due yesterday, still pending
    for v_inst in
      execute $q$
        select ci.*
          from public.chore_instances ci
          join public.chore_templates ct on ct.id = ci.template_id
         where ci.family_id = $1
           and ci.due_date  = $2
           and ci.status    = 'pending'
           and (ct.recurrence ->> 'kind') = 'weekly'
      $q$ using f.id, v_yesterday
    loop
      update public.chore_instances set status = 'overdue' where id = v_inst.id;
      insert into public.point_transactions
        (family_id, user_id, amount, kind, reason, related_chore_id, actor_id)
      values
        (v_inst.family_id, v_inst.assignee_id, -50, 'penalty',
         'missed_chore', v_inst.id, v_inst.assignee_id)
      on conflict (related_chore_id) where kind = 'penalty' do nothing;
      v_processed := v_processed + 1;
    end loop;

    -- B) One-off chores with due_date strictly past local_today, still pending
    for v_inst in
      execute $q$
        select ci.*
          from public.chore_instances ci
          join public.chore_templates ct on ct.id = ci.template_id
         where ci.family_id = $1
           and ci.due_date  < $2
           and ci.status    = 'pending'
           and (ct.recurrence ->> 'kind') = 'once'
      $q$ using f.id, v_local_today
    loop
      update public.chore_instances set status = 'overdue' where id = v_inst.id;
      insert into public.point_transactions
        (family_id, user_id, amount, kind, reason, related_chore_id, actor_id)
      values
        (v_inst.family_id, v_inst.assignee_id, -50, 'penalty',
         'missed_chore', v_inst.id, v_inst.assignee_id)
      on conflict (related_chore_id) where kind = 'penalty' do nothing;
      v_processed := v_processed + 1;
    end loop;

    insert into public.family_rollover_log (family_id, local_date, ran_at)
    values (f.id, v_yesterday, now())
    on conflict do nothing;
  end loop;

  return v_processed;
end;
$$;

revoke all on function public.dooooz_midnight_rollover() from public;
-- Not granted to authenticated; cron runs as postgres (function owner).

-- 7. Schedule hourly via pg_cron
do $$
begin
  perform cron.unschedule('dooooz_midnight_rollover')
    where exists (select 1 from cron.job where jobname = 'dooooz_midnight_rollover');
exception when others then null;
end$$;

select cron.schedule('dooooz_midnight_rollover', '0 * * * *', $cron$select public.dooooz_midnight_rollover();$cron$);
