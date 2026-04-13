-- Migration 13: reward request flow (request -> approve/reject/cancel)
-- Spec §1 (#10), invariant I7 (reward approval is atomic).
set search_path = public, pg_temp;

create table if not exists public.reward_requests (
  id                     uuid primary key default gen_random_uuid(),
  family_id              uuid not null references public.families(id) on delete cascade,
  reward_id              uuid not null references public.rewards(id) on delete restrict,
  requested_by           uuid not null references public.users(id),
  reward_title_snapshot  text not null,
  cost_snapshot          int  not null check (cost_snapshot >= 1),
  status                 text not null check (status in ('requested','approved','rejected','cancelled')),
  requested_at           timestamptz not null default now(),
  decided_by             uuid references public.users(id),
  decided_at             timestamptz,
  decision_note          text,
  related_transaction_id uuid references public.point_transactions(id)
);

create index if not exists reward_requests_family_status_idx
  on public.reward_requests (family_id, status, requested_at desc);
create index if not exists reward_requests_requested_by_idx on public.reward_requests (requested_by);
create index if not exists reward_requests_decided_by_idx   on public.reward_requests (decided_by);
create index if not exists reward_requests_reward_id_idx    on public.reward_requests (reward_id);
create index if not exists reward_requests_related_tx_idx   on public.reward_requests (related_transaction_id);

alter table public.reward_requests enable row level security;

-- SELECT: family members only
create policy reward_requests_select on public.reward_requests
  for select to authenticated
  using (family_id = public.auth_family_id());

-- No direct INSERT/UPDATE/DELETE — all mutations go through definer functions
revoke all on public.reward_requests from anon, authenticated;
grant  select on public.reward_requests to authenticated;

-- ================================================================
-- request_reward: child-only, insufficient balance rejected
-- ================================================================
create or replace function public.request_reward(p_reward_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_caller public.users%rowtype;
  v_reward public.rewards%rowtype;
  v_balance int;
  v_request_id uuid;
begin
  select * into v_caller from public.users where id = (select auth.uid());
  if v_caller.id is null or v_caller.role <> 'child' then
    raise exception 'FORBIDDEN: child only' using errcode = '42501';
  end if;

  select * into v_reward from public.rewards where id = p_reward_id;
  if v_reward.id is null then
    raise exception 'NOT_FOUND: reward' using errcode = 'P0002';
  end if;
  if v_reward.family_id <> v_caller.family_id then
    raise exception 'FORBIDDEN: cross-family' using errcode = '42501';
  end if;
  if not v_reward.active then
    raise exception 'INVALID: reward inactive' using errcode = '22023';
  end if;

  select coalesce(sum(amount), 0) into v_balance
    from public.point_transactions
   where user_id = v_caller.id;

  if v_balance < v_reward.cost then
    raise exception 'INSUFFICIENT_BALANCE: have %, need %', v_balance, v_reward.cost
      using errcode = '22003';
  end if;

  insert into public.reward_requests
    (family_id, reward_id, requested_by, reward_title_snapshot, cost_snapshot, status)
  values
    (v_caller.family_id, v_reward.id, v_caller.id, v_reward.title, v_reward.cost, 'requested')
  returning id into v_request_id;

  return v_request_id;
end;
$$;

-- ================================================================
-- approve_reward_request: parent-only, defensive balance re-check,
-- atomic ledger insert + status flip
-- ================================================================
create or replace function public.approve_reward_request(p_request_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_caller public.users%rowtype;
  v_req public.reward_requests%rowtype;
  v_balance int;
  v_tx_id uuid;
begin
  select * into v_caller from public.users where id = (select auth.uid());
  if v_caller.id is null or v_caller.role <> 'parent' then
    raise exception 'FORBIDDEN: parent only' using errcode = '42501';
  end if;

  select * into v_req from public.reward_requests where id = p_request_id for update;
  if v_req.id is null then
    raise exception 'NOT_FOUND: reward_request' using errcode = 'P0002';
  end if;
  if v_req.family_id <> v_caller.family_id then
    raise exception 'FORBIDDEN: cross-family' using errcode = '42501';
  end if;
  if v_req.status <> 'requested' then
    raise exception 'INVALID_STATE: request is %', v_req.status using errcode = '22023';
  end if;

  select coalesce(sum(amount), 0) into v_balance
    from public.point_transactions
   where user_id = v_req.requested_by;
  if v_balance < v_req.cost_snapshot then
    raise exception 'INSUFFICIENT_BALANCE' using errcode = '22003';
  end if;

  insert into public.point_transactions
    (family_id, user_id, amount, kind, reason, actor_id)
  values
    (v_req.family_id, v_req.requested_by, -v_req.cost_snapshot,
     'redemption', 'reward:' || v_req.reward_title_snapshot, v_caller.id)
  returning id into v_tx_id;

  update public.reward_requests
     set status = 'approved',
         decided_by = v_caller.id,
         decided_at = now(),
         related_transaction_id = v_tx_id
   where id = v_req.id;

  return v_tx_id;
end;
$$;

-- ================================================================
-- reject_reward_request: parent-only, with note
-- ================================================================
create or replace function public.reject_reward_request(p_request_id uuid, p_note text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_caller public.users%rowtype;
  v_req public.reward_requests%rowtype;
begin
  select * into v_caller from public.users where id = (select auth.uid());
  if v_caller.id is null or v_caller.role <> 'parent' then
    raise exception 'FORBIDDEN: parent only' using errcode = '42501';
  end if;

  select * into v_req from public.reward_requests where id = p_request_id for update;
  if v_req.id is null then
    raise exception 'NOT_FOUND: reward_request' using errcode = 'P0002';
  end if;
  if v_req.family_id <> v_caller.family_id then
    raise exception 'FORBIDDEN: cross-family' using errcode = '42501';
  end if;
  if v_req.status <> 'requested' then
    raise exception 'INVALID_STATE' using errcode = '22023';
  end if;

  update public.reward_requests
     set status = 'rejected',
         decided_by = v_caller.id,
         decided_at = now(),
         decision_note = p_note
   where id = v_req.id;
end;
$$;

-- ================================================================
-- cancel_reward_request: child-only (requester), only on 'requested'
-- ================================================================
create or replace function public.cancel_reward_request(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_caller public.users%rowtype;
  v_req public.reward_requests%rowtype;
begin
  select * into v_caller from public.users where id = (select auth.uid());
  if v_caller.id is null then
    raise exception 'AUTH' using errcode = '42501';
  end if;

  select * into v_req from public.reward_requests where id = p_request_id for update;
  if v_req.id is null then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;
  if v_req.requested_by <> v_caller.id then
    raise exception 'FORBIDDEN: not requester' using errcode = '42501';
  end if;
  if v_req.status <> 'requested' then
    raise exception 'INVALID_STATE' using errcode = '22023';
  end if;

  update public.reward_requests
     set status = 'cancelled',
         decided_at = now()
   where id = v_req.id;
end;
$$;

revoke all on function public.request_reward(uuid)              from public;
revoke all on function public.approve_reward_request(uuid)      from public;
revoke all on function public.reject_reward_request(uuid, text) from public;
revoke all on function public.cancel_reward_request(uuid)       from public;

grant execute on function public.request_reward(uuid)              to authenticated;
grant execute on function public.approve_reward_request(uuid)      to authenticated;
grant execute on function public.reject_reward_request(uuid, text) to authenticated;
grant execute on function public.cancel_reward_request(uuid)       to authenticated;
