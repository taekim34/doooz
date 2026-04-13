-- Migration 12: drop goals, add role gates, rewrite complete_chore/uncomplete_chore/evaluate_badges
-- Spec §1 (#7, #9), invariants I6 + I9.
set search_path = public, pg_temp;

-- ================================================================
-- Part A: Rewrite functions that reference goals to remove the dep
-- ================================================================

-- complete_chore: no longer calls evaluate_goals. Rejects non-child assignees.
create or replace function public.complete_chore(p_instance_id uuid, p_actor_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_instance public.chore_instances%rowtype;
  v_actor    public.users%rowtype;
  v_owner    public.users%rowtype;
  v_old_level int;
  v_new_level int;
  v_balance  int;
  v_new_badges   text[];
  v_has_prior_reward boolean;
begin
  select * into v_actor from public.users where id = p_actor_id;
  if v_actor.id is null then
    raise exception 'AUTH: actor not found' using errcode = '42501';
  end if;

  select * into v_instance from public.chore_instances where id = p_instance_id for update;
  if v_instance.id is null then
    raise exception 'NOT_FOUND: chore_instance %', p_instance_id using errcode = 'P0002';
  end if;

  if v_instance.family_id <> v_actor.family_id then
    raise exception 'FORBIDDEN: cross-family access' using errcode = '42501';
  end if;

  if v_actor.role <> 'parent' and v_instance.assignee_id <> p_actor_id then
    raise exception 'FORBIDDEN: not assignee or parent' using errcode = '42501';
  end if;

  -- Role gate: assignee must be a child
  select * into v_owner from public.users where id = v_instance.assignee_id;
  if v_owner.role <> 'child' then
    raise exception 'ROLE_GATE: only child assignees can complete chores' using errcode = '42501';
  end if;

  if v_instance.status = 'completed' then
    return jsonb_build_object(
      'balance', v_owner.current_balance,
      'leveledUp', false,
      'newBadges', '[]'::jsonb,
      'completedGoals', '[]'::jsonb,
      'idempotent', true
    );
  end if;

  select * into v_owner from public.users where id = v_instance.assignee_id for update;
  v_old_level := v_owner.level;

  update public.chore_instances
     set status = 'completed', completed_at = now()
   where id = p_instance_id;

  select exists(
    select 1 from public.point_transactions
     where related_chore_id = v_instance.id and kind = 'chore_reward'
  ) into v_has_prior_reward;

  if v_has_prior_reward then
    insert into public.point_transactions
      (family_id, user_id, amount, kind, reason, related_chore_id, actor_id)
    values
      (v_instance.family_id, v_instance.assignee_id, v_instance.points,
       'adjustment', '재체크: ' || v_instance.title, v_instance.id, p_actor_id);
  else
    insert into public.point_transactions
      (family_id, user_id, amount, kind, reason, related_chore_id, actor_id)
    values
      (v_instance.family_id, v_instance.assignee_id, v_instance.points,
       'chore_reward', '집안일 완료: ' || v_instance.title, v_instance.id, p_actor_id);
  end if;

  begin
    v_new_badges := public.evaluate_badges(v_instance.assignee_id);
  exception when others then
    v_new_badges := '{}';
    raise warning 'evaluate_badges failed: %', sqlerrm;
  end;

  select * into v_owner from public.users where id = v_instance.assignee_id;
  v_balance := v_owner.current_balance;
  v_new_level := v_owner.level;

  return jsonb_build_object(
    'balance', v_balance,
    'level', v_new_level,
    'leveledUp', v_new_level > v_old_level,
    'newBadges', to_jsonb(v_new_badges),
    'completedGoals', '[]'::jsonb
  );
end;
$function$;

-- uncomplete_chore: defensive role gate
create or replace function public.uncomplete_chore(p_instance_id uuid, p_actor_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_instance public.chore_instances%rowtype;
  v_actor    public.users%rowtype;
  v_owner    public.users%rowtype;
  v_balance int;
  v_level int;
begin
  select * into v_instance from public.chore_instances where id = p_instance_id for update;
  if not found then
    raise exception 'CHORE_NOT_FOUND' using errcode = 'P0001';
  end if;

  select * into v_actor from public.users where id = p_actor_id;
  if not found or v_actor.family_id <> v_instance.family_id then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;
  if v_actor.role <> 'parent' and v_actor.id <> v_instance.assignee_id then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;

  select * into v_owner from public.users where id = v_instance.assignee_id;
  if v_owner.role <> 'child' then
    raise exception 'ROLE_GATE: only child assignees' using errcode = '42501';
  end if;

  if v_instance.status <> 'completed' then
    raise exception 'NOT_COMPLETED' using errcode = 'P0001';
  end if;

  insert into public.point_transactions
    (family_id, user_id, amount, kind, reason, related_chore_id, actor_id)
  values
    (v_instance.family_id, v_instance.assignee_id, -v_instance.points,
     'adjustment', '취소: ' || v_instance.title, v_instance.id, p_actor_id);

  update public.chore_instances
     set status = 'pending', completed_at = null
   where id = v_instance.id;

  select current_balance, level into v_balance, v_level
    from public.users where id = v_instance.assignee_id;

  return jsonb_build_object(
    'balance', v_balance,
    'level', v_level,
    'uncompleted', true
  );
end;
$$;

-- evaluate_badges: drop goal_count dependency
create or replace function public.evaluate_badges(p_user_id uuid)
returns text[]
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_family_tz        text;
  v_family_id        uuid;
  v_created_at       timestamptz;
  v_total_count      int;
  v_hard_count       int;
  v_lifetime         int;
  v_redemption_count int;
  v_big_redemption   int;
  v_streak           int;
  v_days_since_join  int;
  v_early_bird_hit   boolean;
  v_new_badges       text[] := '{}';
  r                  record;
  v_awarded          boolean;
begin
  select u.family_id, u.lifetime_earned, u.created_at, f.timezone
    into v_family_id, v_lifetime, v_created_at, v_family_tz
  from public.users u
  join public.families f on f.id = u.family_id
  where u.id = p_user_id;

  if v_family_id is null then
    return '{}';
  end if;

  select count(*) into v_total_count
    from public.chore_instances
   where assignee_id = p_user_id and status = 'completed';

  select count(*) into v_hard_count
    from public.chore_instances
   where assignee_id = p_user_id and status = 'completed' and points >= 30;

  select count(*), coalesce(max(-amount), 0)
    into v_redemption_count, v_big_redemption
    from public.point_transactions
   where user_id = p_user_id and kind = 'redemption';

  with days as (
    select distinct (completed_at at time zone v_family_tz)::date as d
      from public.chore_instances
     where assignee_id = p_user_id
       and status = 'completed'
       and completed_at is not null
  ),
  ordered as (
    select d, row_number() over (order by d desc) as rn from days
  ),
  anchor as (
    select case
             when exists (select 1 from days where d = (now() at time zone v_family_tz)::date)
               then (now() at time zone v_family_tz)::date
             when exists (select 1 from days where d = ((now() at time zone v_family_tz)::date - 1))
               then ((now() at time zone v_family_tz)::date - 1)
             else null
           end as start_day
  ),
  run as (
    select d, (select start_day from anchor) - (rn - 1) as expected
      from ordered
  )
  select count(*) into v_streak
    from run
   where expected = d
     and d <= (select start_day from anchor)
     and (select start_day from anchor) is not null;

  if v_streak is null then v_streak := 0; end if;

  v_days_since_join := greatest(0, ((now() at time zone v_family_tz)::date - (v_created_at at time zone v_family_tz)::date));

  select exists(
    select 1 from public.chore_instances
     where assignee_id = p_user_id
       and status = 'completed'
       and completed_at is not null
       and extract(hour from (completed_at at time zone v_family_tz)) < 8
  ) into v_early_bird_hit;

  for r in select * from public.badges loop
    v_awarded := false;
    case r.rule_type
      when 'total_count' then       v_awarded := v_total_count >= r.rule_value;
      when 'hard_worker' then       v_awarded := v_hard_count >= r.rule_value;
      when 'lifetime_points' then   v_awarded := v_lifetime >= r.rule_value;
      when 'redemption' then
        if r.rule_value <= 1 then
          v_awarded := v_redemption_count >= 1;
        else
          v_awarded := v_big_redemption >= r.rule_value;
        end if;
      when 'goal_count' then        v_awarded := false; -- goals removed
      when 'streak' then            v_awarded := v_streak >= r.rule_value;
      when 'anniversary' then       v_awarded := v_days_since_join >= r.rule_value;
      when 'time_condition' then    v_awarded := v_early_bird_hit;
      when 'perfect_day' then
        v_awarded := exists(
          select 1 from public.chore_instances
           where assignee_id = p_user_id
             and due_date = (now() at time zone v_family_tz)::date
          group by due_date
          having count(*) > 0 and count(*) filter (where status = 'completed') = count(*)
        );
      when 'perfect_week' then
        v_awarded := (
          select bool_or(all_done) from (
            select count(*) filter (where status = 'completed') = count(*) as all_done
              from public.chore_instances
             where assignee_id = p_user_id
               and due_date >= (now() at time zone v_family_tz)::date - 6
               and due_date <= (now() at time zone v_family_tz)::date
          ) s
        );
      else
        v_awarded := false;
    end case;

    if v_awarded then
      insert into public.user_badges (user_id, badge_id)
        values (p_user_id, r.id)
        on conflict do nothing;
      if found then
        v_new_badges := array_append(v_new_badges, r.id);
      end if;
    end if;
  end loop;

  return v_new_badges;
end;
$function$;

-- ================================================================
-- Part B: Drop goals-related objects
-- ================================================================

drop function if exists public.evaluate_goals(uuid) cascade;
drop function if exists public.complete_manual_goal(uuid, uuid) cascade;

-- Migrate any goal_reward rows to bonus (with prefix)
update public.point_transactions
   set kind = 'bonus',
       reason = '[legacy goal] ' || reason
 where kind = 'goal_reward';

-- Update kind check: drop goal_reward, keep penalty
alter table public.point_transactions
  drop constraint point_transactions_kind_check,
  add  constraint point_transactions_kind_check
    check (kind in ('chore_reward','redemption','adjustment','bonus','penalty'));

-- Drop related_goal_id column
alter table public.point_transactions drop column if exists related_goal_id;

-- update_user_point_cache no longer references goal_reward
create or replace function public.update_user_point_cache()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $function$
declare
  new_lifetime int;
begin
  update public.users
     set current_balance = current_balance + NEW.amount
   where id = NEW.user_id;

  if NEW.amount > 0 and NEW.kind in ('chore_reward','bonus') then
    update public.users
       set lifetime_earned = lifetime_earned + NEW.amount
     where id = NEW.user_id
     returning lifetime_earned into new_lifetime;

    update public.users
       set level = public.calculate_level(new_lifetime)
     where id = NEW.user_id;
  end if;

  return NEW;
end;
$function$;

-- Drop goals table last (other dependencies are gone)
drop table if exists public.goals cascade;

-- ================================================================
-- Part C: Role gate on chore_templates.assignee_id
-- (trigger form — CHECK cannot do subqueries)
-- ================================================================

create or replace function public.chore_templates_assignee_role_check()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_role text;
begin
  select role into v_role from public.users where id = NEW.assignee_id;
  if v_role is null then
    raise exception 'INVALID: assignee not found' using errcode = '22023';
  end if;
  if v_role <> 'child' then
    raise exception 'ROLE_GATE: chore_templates.assignee_id must reference a child' using errcode = '42501';
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_chore_templates_assignee_role on public.chore_templates;
create trigger trg_chore_templates_assignee_role
  before insert or update of assignee_id on public.chore_templates
  for each row execute function public.chore_templates_assignee_role_check();
