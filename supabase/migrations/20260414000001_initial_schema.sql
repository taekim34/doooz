SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."approve_reward_request"("p_request_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
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

  -- Defensive re-check
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


ALTER FUNCTION "public"."approve_reward_request"("p_request_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auth_family_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
  select family_id from public.users where id = auth.uid();
$$;


ALTER FUNCTION "public"."auth_family_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auth_is_parent"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'parent'
  );
$$;


ALTER FUNCTION "public"."auth_is_parent"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_level"("lifetime" integer) RETURNS integer
    LANGUAGE "sql" IMMUTABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select public.calculate_level(lifetime::bigint);
$$;


ALTER FUNCTION "public"."calculate_level"("lifetime" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_level"("lifetime" bigint) RETURNS integer
    LANGUAGE "plpgsql" IMMUTABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  thresholds int[] := array[
    0,         -- L1
    150,       -- L2
    400,       -- L3
    800,       -- L4
    1500,      -- L5
    2500,      -- L6
    4500,      -- L7
    7000,      -- L8
    10000,     -- L9
    15000,     -- L10
    22000,     -- L11
    32000,     -- L12
    45000,     -- L13
    60000,     -- L14
    80000,     -- L15
    100000,    -- L16
    130000,    -- L17
    160000,    -- L18
    190000,    -- L19
    220000,    -- L20
    280000,    -- L21
    340000,    -- L22
    400000,    -- L23
    470000,    -- L24
    540000,    -- L25
    620000,    -- L26
    700000,    -- L27
    800000,    -- L28
    900000,    -- L29
    1000000    -- L30
  ];
  lvl integer := 1;
begin
  for i in 1..array_length(thresholds, 1) loop
    if lifetime >= thresholds[i] then
      lvl := i;
    else
      exit;
    end if;
  end loop;
  return lvl;
end;
$$;


ALTER FUNCTION "public"."calculate_level"("lifetime" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cancel_reward_request"("p_request_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
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


ALTER FUNCTION "public"."cancel_reward_request"("p_request_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."complete_task"("p_instance_id" "uuid", "p_actor_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  v_instance public.task_instances%rowtype;
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

  select * into v_instance from public.task_instances where id = p_instance_id for update;
  if v_instance.id is null then
    raise exception 'NOT_FOUND: task_instance %', p_instance_id using errcode = 'P0002';
  end if;

  if v_instance.family_id <> v_actor.family_id then
    raise exception 'FORBIDDEN: cross-family access' using errcode = '42501';
  end if;

  if v_actor.role <> 'parent' and v_instance.assignee_id <> p_actor_id then
    raise exception 'FORBIDDEN: not assignee or parent' using errcode = '42501';
  end if;

  select * into v_owner from public.users where id = v_instance.assignee_id;
  if v_owner.role <> 'child' then
    raise exception 'ROLE_GATE: only child assignees can complete tasks' using errcode = '42501';
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

  update public.task_instances
     set status = 'completed', completed_at = now()
   where id = p_instance_id;

  select exists(
    select 1 from public.point_transactions
     where related_task_id = v_instance.id and kind = 'task_reward'
  ) into v_has_prior_reward;

  if v_has_prior_reward then
    insert into public.point_transactions
      (family_id, user_id, amount, kind, reason, related_task_id, actor_id)
    values
      (v_instance.family_id, v_instance.assignee_id, v_instance.points,
       'adjustment', '재체크: ' || v_instance.title, v_instance.id, p_actor_id);
  else
    insert into public.point_transactions
      (family_id, user_id, amount, kind, reason, related_task_id, actor_id)
    values
      (v_instance.family_id, v_instance.assignee_id, v_instance.points,
       'task_reward', '할일 완료: ' || v_instance.title, v_instance.id, p_actor_id);
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
$$;


ALTER FUNCTION "public"."complete_task"("p_instance_id" "uuid", "p_actor_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."dooooz_midnight_rollover"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_processed int := 0;
  v_count int;
  f record;
  v_local_today date;
  v_yesterday date;
begin
  for f in select id, timezone from public.families loop
    v_local_today := (now() at time zone f.timezone)::date;
    v_yesterday   := v_local_today - 1;

    if exists (
      select 1 from public.family_rollover_log
       where family_id = f.id and local_date = v_yesterday
    ) then
      continue;
    end if;

    with overdue_weekly as (
      update public.task_instances ci
         set status = 'overdue'
        from public.task_templates ct
       where ci.template_id = ct.id
         and ci.family_id = f.id
         and ci.due_date = v_yesterday
         and ci.status = 'pending'
         and (ct.recurrence ->> 'kind') = 'weekly'
      returning ci.id, ci.family_id, ci.assignee_id
    ),
    inserted as (
      insert into public.point_transactions
        (family_id, user_id, amount, kind, reason, related_task_id, actor_id)
      select family_id, assignee_id, -50, 'penalty', 'missed_task', id, assignee_id
        from overdue_weekly
      on conflict (related_task_id) where kind = 'penalty' do nothing
      returning 1
    )
    select count(*) into v_count from inserted;
    v_processed := v_processed + v_count;

    with overdue_once as (
      update public.task_instances ci
         set status = 'overdue'
        from public.task_templates ct
       where ci.template_id = ct.id
         and ci.family_id = f.id
         and ci.due_date < v_local_today
         and ci.status = 'pending'
         and (ct.recurrence ->> 'kind') = 'once'
      returning ci.id, ci.family_id, ci.assignee_id
    ),
    inserted2 as (
      insert into public.point_transactions
        (family_id, user_id, amount, kind, reason, related_task_id, actor_id)
      select family_id, assignee_id, -50, 'penalty', 'missed_task', id, assignee_id
        from overdue_once
      on conflict (related_task_id) where kind = 'penalty' do nothing
      returning 1
    )
    select count(*) into v_count from inserted2;
    v_processed := v_processed + v_count;

    insert into public.family_rollover_log (family_id, local_date, ran_at)
    values (f.id, v_yesterday, now())
    on conflict do nothing;
  end loop;

  return v_processed;
end;
$$;


ALTER FUNCTION "public"."dooooz_midnight_rollover"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ensure_all_today_instances"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  f record;
  v_tz text;
  v_today date;
  v_dow int;
  v_count int := 0;
  t record;
  v_kind text;
  v_days jsonb;
  v_due date;
begin
  for f in select id, timezone from public.families loop
    v_tz    := f.timezone;
    v_today := (now() at time zone v_tz)::date;
    v_dow   := extract(dow from (now() at time zone v_tz))::int;

    for t in
      select * from public.task_templates
       where family_id = f.id
         and active = true
         and start_date <= v_today
         and (end_date is null or end_date >= v_today)
    loop
      v_kind := t.recurrence ->> 'kind';
      if v_kind = 'weekly' then
        v_days := t.recurrence -> 'days';
        if v_days is not null and v_days @> to_jsonb(v_dow) then
          insert into public.task_instances
            (family_id, template_id, assignee_id, title, points, due_date)
          values
            (t.family_id, t.id, t.assignee_id, t.title, t.points, v_today)
          on conflict (template_id, assignee_id, due_date) do nothing;
          if found then v_count := v_count + 1; end if;
        end if;
      elsif v_kind = 'once' then
        v_due := (t.recurrence ->> 'due_date')::date;
        if v_due is not null and v_today <= v_due then
          insert into public.task_instances
            (family_id, template_id, assignee_id, title, points, due_date)
          values
            (t.family_id, t.id, t.assignee_id, t.title, t.points, v_due)
          on conflict (template_id, assignee_id, due_date) do nothing;
          if found then v_count := v_count + 1; end if;
        end if;
      end if;
    end loop;
  end loop;

  return v_count;
end;
$$;


ALTER FUNCTION "public"."ensure_all_today_instances"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ensure_today_instances"("p_user_id" "uuid", "p_family_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
declare
  v_tz text;
  v_today date;
  v_dow int;
  v_count int := 0;
  t record;
  v_kind text;
  v_days jsonb;
  v_due date;
begin
  perform p_user_id;
  select timezone into v_tz from public.families where id = p_family_id;
  if v_tz is null then return 0; end if;

  v_today := (now() at time zone v_tz)::date;
  v_dow   := extract(dow from (now() at time zone v_tz))::int;

  for t in
    select * from public.task_templates
     where family_id = p_family_id
       and active = true
       and start_date <= v_today
       and (end_date is null or end_date >= v_today)
  loop
    v_kind := t.recurrence ->> 'kind';
    if v_kind = 'weekly' then
      v_days := t.recurrence -> 'days';
      if v_days is not null and v_days @> to_jsonb(v_dow) then
        insert into public.task_instances
          (family_id, template_id, assignee_id, title, points, due_date)
        values
          (t.family_id, t.id, t.assignee_id, t.title, t.points, v_today)
        on conflict (template_id, assignee_id, due_date) do nothing;
        if found then v_count := v_count + 1; end if;
      end if;
    elsif v_kind = 'once' then
      v_due := (t.recurrence ->> 'due_date')::date;
      if v_due is not null and v_today <= v_due then
        insert into public.task_instances
          (family_id, template_id, assignee_id, title, points, due_date)
        values
          (t.family_id, t.id, t.assignee_id, t.title, t.points, v_due)
        on conflict (template_id, assignee_id, due_date) do nothing;
        if found then v_count := v_count + 1; end if;
      end if;
    end if;
  end loop;

  return v_count;
end;
$$;


ALTER FUNCTION "public"."ensure_today_instances"("p_user_id" "uuid", "p_family_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."evaluate_badges"("p_user_id" "uuid") RETURNS "text"[]
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
  v_big_task_count   int;
  v_new_badges       text[] := '{}';
  v_today            date;
  v_cur_year         int;
  r                  record;
  v_awarded          boolean;
begin
  select u.family_id, u.lifetime_earned, u.created_at, f.timezone
    into v_family_id, v_lifetime, v_created_at, v_family_tz
  from public.users u
  join public.families f on f.id = u.family_id
  where u.id = p_user_id;

  if v_family_id is null then return '{}'; end if;

  v_today := (now() at time zone v_family_tz)::date;
  v_cur_year := extract(year from v_today)::int;

  select count(*) into v_total_count
    from public.task_instances
   where assignee_id = p_user_id and status = 'completed' and template_id is not null;

  select count(*) into v_hard_count
    from public.task_instances
   where assignee_id = p_user_id and status = 'completed' and points >= 150 and template_id is not null;

  select count(*) into v_big_task_count
    from public.task_instances ci
   where ci.assignee_id = p_user_id and ci.status = 'completed'
     and ci.points >= 1000 and ci.template_id is null;

  select count(*), coalesce(max(-amount), 0)
    into v_redemption_count, v_big_redemption
    from public.point_transactions
   where user_id = p_user_id and kind = 'redemption';

  with days as (
    select distinct (completed_at at time zone v_family_tz)::date as d
      from public.task_instances
     where assignee_id = p_user_id and status = 'completed' and completed_at is not null
       and template_id is not null
  ),
  ordered as (
    select d, row_number() over (order by d desc)::int as rn from days
  ),
  anchor as (
    select case
             when exists (select 1 from days where d = v_today) then v_today
             when exists (select 1 from days where d = v_today - 1) then v_today - 1
             else null
           end as start_day
  ),
  run as (
    select d, (select start_day from anchor) - (rn - 1) as expected from ordered
  )
  select count(*) into v_streak
    from run
   where expected = d and d <= (select start_day from anchor)
     and (select start_day from anchor) is not null;
  if v_streak is null then v_streak := 0; end if;

  v_days_since_join := greatest(0, (v_today - (v_created_at at time zone v_family_tz)::date));

  select exists(
    select 1 from (
      select due_date,
        count(*) as total,
        count(*) filter (where completed_at is not null
          and extract(hour from (completed_at at time zone v_family_tz)) < 14) as before_2pm
      from public.task_instances
      where assignee_id = p_user_id and status = 'completed' and template_id is not null
      group by due_date
      having count(*) >= 3
    ) d where d.total = d.before_2pm
  ) into v_early_bird_hit;

  for r in select * from public.badges loop
    v_awarded := false;
    case r.rule_type
      when 'total_count' then v_awarded := v_total_count >= r.rule_value;
      when 'hard_worker' then v_awarded := v_hard_count >= r.rule_value;
      when 'lifetime_points' then v_awarded := v_lifetime >= r.rule_value;
      when 'big_task' then v_awarded := v_big_task_count >= r.rule_value;
      when 'redemption' then v_awarded := v_big_redemption >= r.rule_value;
      when 'redemption_count' then v_awarded := v_redemption_count >= r.rule_value;
      when 'streak' then v_awarded := v_streak >= r.rule_value;
      when 'anniversary' then v_awarded := v_days_since_join >= r.rule_value;
      when 'time_condition' then v_awarded := v_early_bird_hit;

      when 'perfect_day' then
        v_awarded := exists(
          select 1 from (
            select due_date
            from public.task_instances
            where assignee_id = p_user_id
              and template_id is not null
              and due_date in (v_today, v_today - 1)
              and status in ('pending','completed','overdue')
            group by due_date
            having count(*) > 0 and count(*) = count(*) filter (where status = 'completed')
          ) perfect_days
        );

      when 'perfect_week' then
        v_awarded := exists(
          with weeks as (
            select distinct (due_date - ((extract(isodow from due_date)::int - 1)))::date as wk_start
              from public.task_instances
             where assignee_id = p_user_id and template_id is not null
               and (due_date - ((extract(isodow from due_date)::int - 1)))::date + 6 < v_today
          )
          select 1 from weeks w
           where (
             select count(distinct due_date) = 7
               and count(*) = count(*) filter (where status = 'completed')
               from public.task_instances
              where assignee_id = p_user_id and template_id is not null
                and due_date >= w.wk_start and due_date <= w.wk_start + 6
                and status in ('pending','completed','overdue')
           )
        );

      when 'perfect_month' then
        v_awarded := exists(
          with months as (
            select distinct date_trunc('month', due_date)::date as m_start
              from public.task_instances
             where assignee_id = p_user_id and template_id is not null
               and (date_trunc('month', due_date) + interval '1 month' - interval '1 day')::date < v_today
          )
          select 1 from months m
           where (
             select count(distinct due_date) >= (((m.m_start + interval '1 month' - interval '1 day')::date - m.m_start + 1) - 2)
               and count(distinct due_date) >= 5
               and count(*) = count(*) filter (where status = 'completed')
               from public.task_instances
              where assignee_id = p_user_id and template_id is not null
                and due_date >= m.m_start
                and due_date <= (m.m_start + interval '1 month' - interval '1 day')::date
                and status in ('pending','completed','overdue')
           )
        );

      when 'perfect_quarter' then
        declare
          v_q_start date; v_q_end date; v_q_days int;
        begin
          v_q_start := make_date(v_cur_year, (r.rule_value - 1) * 3 + 1, 1);
          v_q_end := (v_q_start + interval '3 months' - interval '1 day')::date;
          v_q_days := v_q_end - v_q_start + 1;
          if v_q_end < v_today then
            v_awarded := (
              select count(distinct due_date) >= (v_q_days - 2)
                and count(distinct due_date) >= 5
                and count(*) = count(*) filter (where status = 'completed')
                from public.task_instances
               where assignee_id = p_user_id and template_id is not null
                 and due_date >= v_q_start and due_date <= v_q_end
                 and status in ('pending','completed','overdue')
            );
          end if;
        end;

      when 'perfect_year' then
        declare
          v_check_year int; v_y_days int;
        begin
          v_check_year := v_cur_year - 1;
          v_y_days := make_date(v_check_year, 12, 31) - make_date(v_check_year, 1, 1) + 1;
          if v_check_year >= extract(year from v_created_at)::int then
            v_awarded := (
              select count(distinct due_date) >= (v_y_days - 2)
                and count(distinct due_date) >= 5
                and count(*) = count(*) filter (where status = 'completed')
                from public.task_instances
               where assignee_id = p_user_id and template_id is not null
                 and due_date >= make_date(v_check_year, 1, 1)
                 and due_date <= make_date(v_check_year, 12, 31)
                 and status in ('pending','completed','overdue')
            );
          end if;
        end;

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
    else
      delete from public.user_badges where user_id = p_user_id and badge_id = r.id;
    end if;
  end loop;

  return v_new_badges;
end;
$$;


ALTER FUNCTION "public"."evaluate_badges"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."pardon_task"("p_instance_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
declare
  v_actor public.users%rowtype;
  v_instance public.task_instances%rowtype;
  v_had_penalty boolean;
begin
  select * into v_actor from public.users where id = (select auth.uid());
  if v_actor.id is null or v_actor.role <> 'parent' then
    raise exception 'FORBIDDEN: parent only' using errcode = '42501';
  end if;

  select * into v_instance from public.task_instances where id = p_instance_id for update;
  if v_instance.id is null then
    raise exception 'NOT_FOUND: task_instance' using errcode = 'P0002';
  end if;

  if v_instance.family_id <> v_actor.family_id then
    raise exception 'FORBIDDEN: cross-family' using errcode = '42501';
  end if;

  if v_instance.status not in ('pending','overdue') then
    raise exception 'INVALID_STATE: task must be pending or overdue' using errcode = '22023';
  end if;

  if v_instance.status = 'overdue' then
    select exists(
      select 1 from public.point_transactions
       where related_task_id = v_instance.id and kind = 'penalty'
    ) into v_had_penalty;

    if v_had_penalty then
      insert into public.point_transactions
        (family_id, user_id, amount, kind, reason, related_task_id, actor_id)
      values
        (v_instance.family_id, v_instance.assignee_id, 50,
         'adjustment', 'pardon_reversal', v_instance.id, v_actor.id);
    end if;
  end if;

  update public.task_instances
     set status = 'pardoned', completed_at = now()
   where id = p_instance_id;
end;
$$;


ALTER FUNCTION "public"."pardon_task"("p_instance_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."prevent_completed_task_update"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
begin
  if OLD.status = 'completed' then
    if NEW.title is distinct from OLD.title
       or NEW.points is distinct from OLD.points
       or NEW.assignee_id is distinct from OLD.assignee_id
       or NEW.due_date is distinct from OLD.due_date
       or NEW.family_id is distinct from OLD.family_id then
      raise exception 'cannot modify snapshot fields of completed task instance';
    end if;
  end if;
  return NEW;
end;
$$;


ALTER FUNCTION "public"."prevent_completed_task_update"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."redeem_points"("p_user_id" "uuid", "p_amount" integer, "p_reason" "text", "p_actor_id" "uuid", "p_reward_id" "uuid" DEFAULT NULL::"uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
declare
  v_actor users%rowtype;
  v_owner users%rowtype;
  v_new_badges text[];
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'INVALID: amount must be positive' using errcode = '22023';
  end if;

  select * into v_actor from users where id = p_actor_id;
  if v_actor.id is null or v_actor.role <> 'parent' then
    raise exception 'FORBIDDEN: parent only' using errcode = '42501';
  end if;

  select * into v_owner from users where id = p_user_id for update;
  if v_owner.id is null then
    raise exception 'NOT_FOUND: user' using errcode = 'P0002';
  end if;

  if v_owner.family_id <> v_actor.family_id then
    raise exception 'FORBIDDEN: cross-family' using errcode = '42501';
  end if;

  if v_owner.current_balance < p_amount then
    raise exception 'UNDERFLOW: insufficient balance' using errcode = '22003';
  end if;

  insert into point_transactions
    (family_id, user_id, amount, kind, reason, actor_id)
  values
    (v_owner.family_id, p_user_id, -p_amount, 'redemption', p_reason, p_actor_id);

  select * into v_owner from users where id = p_user_id;

  begin
    v_new_badges := evaluate_badges(p_user_id);
  exception when others then
    v_new_badges := '{}';
  end;

  return jsonb_build_object(
    'balance', v_owner.current_balance,
    'newBadges', to_jsonb(v_new_badges)
  );
end;
$$;


ALTER FUNCTION "public"."redeem_points"("p_user_id" "uuid", "p_amount" integer, "p_reason" "text", "p_actor_id" "uuid", "p_reward_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reject_reward_request"("p_request_id" "uuid", "p_note" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
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


ALTER FUNCTION "public"."reject_reward_request"("p_request_id" "uuid", "p_note" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."request_reward"("p_reward_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
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


ALTER FUNCTION "public"."request_reward"("p_reward_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."task_templates_assignee_role_check"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
declare
  v_role text;
begin
  select role into v_role from public.users where id = NEW.assignee_id;
  if v_role is null then
    raise exception 'INVALID: assignee not found' using errcode = '22023';
  end if;
  if v_role <> 'child' then
    raise exception 'ROLE_GATE: task_templates.assignee_id must reference a child' using errcode = '42501';
  end if;
  return NEW;
end;
$$;


ALTER FUNCTION "public"."task_templates_assignee_role_check"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."uncomplete_task"("p_instance_id" "uuid", "p_actor_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  v_instance public.task_instances%rowtype;
  v_actor    public.users%rowtype;
  v_owner    public.users%rowtype;
  v_balance int;
  v_level int;
begin
  select * into v_instance from public.task_instances where id = p_instance_id for update;
  if not found then
    raise exception 'TASK_NOT_FOUND' using errcode = 'P0001';
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
    (family_id, user_id, amount, kind, reason, related_task_id, actor_id)
  values
    (v_instance.family_id, v_instance.assignee_id, -v_instance.points,
     'adjustment', '취소: ' || v_instance.title, v_instance.id, p_actor_id);

  update public.task_instances
     set status = 'pending', completed_at = null
   where id = v_instance.id;

  perform public.evaluate_badges(v_instance.assignee_id);

  select current_balance, level into v_balance, v_level
    from public.users where id = v_instance.assignee_id;

  return jsonb_build_object(
    'balance', v_balance,
    'level', v_level,
    'uncompleted', true
  );
end;
$$;


ALTER FUNCTION "public"."uncomplete_task"("p_instance_id" "uuid", "p_actor_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."unpardon_task"("p_instance_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  v_inst record;
  v_caller_id uuid := (select auth.uid());
  v_caller_role text;
begin
  select role into v_caller_role from users where id = v_caller_id;
  if v_caller_role is null or v_caller_role <> 'parent' then
    raise exception 'FORBIDDEN: parent only';
  end if;

  select id, family_id, assignee_id, status
    into v_inst from task_instances where id = p_instance_id;
  if not found then raise exception 'NOT_FOUND'; end if;

  if v_inst.family_id <> (select family_id from users where id = v_caller_id) then
    raise exception 'FORBIDDEN: wrong family';
  end if;

  if v_inst.status <> 'pardoned' then
    raise exception 'INVALID_STATE: not pardoned';
  end if;

  delete from point_transactions
    where related_task_id = p_instance_id
      and kind = 'adjustment'
      and reason = 'pardon_reversal';

  update users set current_balance = (
    select coalesce(sum(amount), 0) from point_transactions where user_id = v_inst.assignee_id
  ) where id = v_inst.assignee_id;

  update task_instances
    set status = 'overdue', completed_at = null
    where id = p_instance_id;
end;
$$;


ALTER FUNCTION "public"."unpardon_task"("p_instance_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_point_cache"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  new_lifetime int;
begin
  -- Always update balance
  update public.users
     set current_balance = current_balance + NEW.amount
   where id = NEW.user_id;

  -- Increase lifetime_earned on positive rewards
  if NEW.amount > 0 and NEW.kind in ('task_reward','bonus') then
    update public.users
       set lifetime_earned = lifetime_earned + NEW.amount
     where id = NEW.user_id;
  end if;

  -- Decrease lifetime_earned on cancellation/adjustment (negative amount)
  if NEW.amount < 0 and NEW.kind = 'adjustment' then
    update public.users
       set lifetime_earned = greatest(0, lifetime_earned + NEW.amount)
     where id = NEW.user_id;
  end if;

  -- Recalculate level
  select lifetime_earned into new_lifetime
    from public.users where id = NEW.user_id;
  update public.users
     set level = public.calculate_level(new_lifetime)
   where id = NEW.user_id;

  return NEW;
end;
$$;


ALTER FUNCTION "public"."update_user_point_cache"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."badges" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "icon" "text",
    "rule_type" "text" NOT NULL,
    "rule_value" integer DEFAULT 0 NOT NULL,
    "sort_order" integer DEFAULT 999,
    CONSTRAINT "badges_rule_type_check" CHECK (("rule_type" = ANY (ARRAY['total_count'::"text", 'streak'::"text", 'lifetime_points'::"text", 'redemption'::"text", 'anniversary'::"text", 'perfect_day'::"text", 'perfect_week'::"text", 'perfect_month'::"text", 'perfect_quarter'::"text", 'perfect_year'::"text", 'time_condition'::"text", 'hard_worker'::"text", 'big_task'::"text", 'redemption_count'::"text"])))
);


ALTER TABLE "public"."badges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."characters" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "unlock_level" integer DEFAULT 0 NOT NULL,
    "asset_base_path" "text" NOT NULL
);


ALTER TABLE "public"."characters" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."families" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "invite_code" "text" NOT NULL,
    "timezone" "text" DEFAULT 'Asia/Seoul'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "locale" "text" DEFAULT 'ko'::"text",
    CONSTRAINT "families_invite_code_check" CHECK ((("char_length"("invite_code") >= 4) AND ("char_length"("invite_code") <= 20)))
);


ALTER TABLE "public"."families" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."family_rollover_log" (
    "family_id" "uuid" NOT NULL,
    "local_date" "date" NOT NULL,
    "ran_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."family_rollover_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."point_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "family_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "amount" integer NOT NULL,
    "kind" "text" NOT NULL,
    "reason" "text" NOT NULL,
    "related_task_id" "uuid",
    "actor_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "point_transactions_kind_check" CHECK (("kind" = ANY (ARRAY['task_reward'::"text", 'redemption'::"text", 'adjustment'::"text", 'bonus'::"text", 'penalty'::"text"])))
);


ALTER TABLE "public"."point_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."push_subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "endpoint" "text" NOT NULL,
    "keys_p256dh" "text" NOT NULL,
    "keys_auth" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."push_subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reward_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "family_id" "uuid" NOT NULL,
    "reward_id" "uuid" NOT NULL,
    "requested_by" "uuid" NOT NULL,
    "reward_title_snapshot" "text" NOT NULL,
    "cost_snapshot" integer NOT NULL,
    "status" "text" NOT NULL,
    "requested_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "decided_by" "uuid",
    "decided_at" timestamp with time zone,
    "decision_note" "text",
    "related_transaction_id" "uuid",
    CONSTRAINT "reward_requests_cost_snapshot_check" CHECK (("cost_snapshot" >= 1)),
    CONSTRAINT "reward_requests_status_check" CHECK (("status" = ANY (ARRAY['requested'::"text", 'approved'::"text", 'rejected'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."reward_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rewards" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "family_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "cost" integer NOT NULL,
    "icon" "text",
    "active" boolean DEFAULT true NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "rewards_cost_check" CHECK ((("cost" >= 1) AND ("cost" <= 1000000)))
);


ALTER TABLE "public"."rewards" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."task_instances" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "family_id" "uuid" NOT NULL,
    "template_id" "uuid",
    "assignee_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "points" integer NOT NULL,
    "due_date" "date" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "task_instances_points_check" CHECK (("points" >= 0)),
    CONSTRAINT "task_instances_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'completed'::"text", 'pardoned'::"text", 'overdue'::"text", 'requested'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."task_instances" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."task_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "family_id" "uuid" NOT NULL,
    "assignee_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "points" integer NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date",
    "active" boolean DEFAULT true NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "recurrence" "jsonb" NOT NULL,
    CONSTRAINT "task_templates_points_check" CHECK ((("points" >= 1) AND ("points" <= 10000)))
);


ALTER TABLE "public"."task_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_badges" (
    "user_id" "uuid" NOT NULL,
    "badge_id" "text" NOT NULL,
    "earned_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_badges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "family_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "display_name" "text" NOT NULL,
    "birth_date" "date",
    "character_id" "text",
    "current_balance" integer DEFAULT 0 NOT NULL,
    "lifetime_earned" integer DEFAULT 0 NOT NULL,
    "level" integer DEFAULT 1 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "users_level_check" CHECK ((("level" >= 1) AND ("level" <= 30))),
    CONSTRAINT "users_lifetime_earned_check" CHECK (("lifetime_earned" >= 0)),
    CONSTRAINT "users_role_check" CHECK (("role" = ANY (ARRAY['parent'::"text", 'child'::"text"])))
);


ALTER TABLE "public"."users" OWNER TO "postgres";


ALTER TABLE ONLY "public"."badges"
    ADD CONSTRAINT "badges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."characters"
    ADD CONSTRAINT "characters_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."families"
    ADD CONSTRAINT "families_invite_code_key" UNIQUE ("invite_code");



ALTER TABLE ONLY "public"."families"
    ADD CONSTRAINT "families_name_unique" UNIQUE ("name");



ALTER TABLE ONLY "public"."families"
    ADD CONSTRAINT "families_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."family_rollover_log"
    ADD CONSTRAINT "family_rollover_log_pkey" PRIMARY KEY ("family_id", "local_date");



ALTER TABLE ONLY "public"."point_transactions"
    ADD CONSTRAINT "point_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."push_subscriptions"
    ADD CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."push_subscriptions"
    ADD CONSTRAINT "push_subscriptions_user_id_endpoint_key" UNIQUE ("user_id", "endpoint");



ALTER TABLE ONLY "public"."reward_requests"
    ADD CONSTRAINT "reward_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rewards"
    ADD CONSTRAINT "rewards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."task_instances"
    ADD CONSTRAINT "task_instances_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."task_instances"
    ADD CONSTRAINT "task_instances_template_id_assignee_id_due_date_key" UNIQUE ("template_id", "assignee_id", "due_date");



ALTER TABLE ONLY "public"."task_templates"
    ADD CONSTRAINT "task_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_badges"
    ADD CONSTRAINT "user_badges_pkey" PRIMARY KEY ("user_id", "badge_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE INDEX "point_tx_family_idx" ON "public"."point_transactions" USING "btree" ("family_id", "created_at" DESC);



CREATE UNIQUE INDEX "point_tx_unique_penalty" ON "public"."point_transactions" USING "btree" ("related_task_id") WHERE ("kind" = 'penalty'::"text");



CREATE UNIQUE INDEX "point_tx_unique_task_reward" ON "public"."point_transactions" USING "btree" ("related_task_id") WHERE ("kind" = 'task_reward'::"text");



CREATE INDEX "point_tx_user_idx" ON "public"."point_transactions" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "reward_requests_decided_by_idx" ON "public"."reward_requests" USING "btree" ("decided_by");



CREATE INDEX "reward_requests_family_status_idx" ON "public"."reward_requests" USING "btree" ("family_id", "status", "requested_at" DESC);



CREATE INDEX "reward_requests_related_tx_idx" ON "public"."reward_requests" USING "btree" ("related_transaction_id");



CREATE INDEX "reward_requests_requested_by_idx" ON "public"."reward_requests" USING "btree" ("requested_by");



CREATE INDEX "reward_requests_reward_id_idx" ON "public"."reward_requests" USING "btree" ("reward_id");



CREATE INDEX "rewards_family_idx" ON "public"."rewards" USING "btree" ("family_id");



CREATE INDEX "task_instances_assignee_due_idx" ON "public"."task_instances" USING "btree" ("assignee_id", "due_date");



CREATE INDEX "task_instances_family_idx" ON "public"."task_instances" USING "btree" ("family_id");



CREATE INDEX "task_templates_assignee_idx" ON "public"."task_templates" USING "btree" ("assignee_id");



CREATE INDEX "task_templates_family_idx" ON "public"."task_templates" USING "btree" ("family_id");



CREATE INDEX "users_family_id_idx" ON "public"."users" USING "btree" ("family_id");



CREATE OR REPLACE TRIGGER "trg_prevent_completed_task_update" BEFORE UPDATE ON "public"."task_instances" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_completed_task_update"();



CREATE OR REPLACE TRIGGER "trg_task_templates_assignee_role" BEFORE INSERT OR UPDATE ON "public"."task_templates" FOR EACH ROW EXECUTE FUNCTION "public"."task_templates_assignee_role_check"();



CREATE OR REPLACE TRIGGER "trg_update_user_point_cache" AFTER INSERT ON "public"."point_transactions" FOR EACH ROW EXECUTE FUNCTION "public"."update_user_point_cache"();



ALTER TABLE ONLY "public"."family_rollover_log"
    ADD CONSTRAINT "family_rollover_log_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."point_transactions"
    ADD CONSTRAINT "point_transactions_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."point_transactions"
    ADD CONSTRAINT "point_transactions_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."point_transactions"
    ADD CONSTRAINT "point_transactions_related_task_id_fkey" FOREIGN KEY ("related_task_id") REFERENCES "public"."task_instances"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."point_transactions"
    ADD CONSTRAINT "point_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."push_subscriptions"
    ADD CONSTRAINT "push_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reward_requests"
    ADD CONSTRAINT "reward_requests_decided_by_fkey" FOREIGN KEY ("decided_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."reward_requests"
    ADD CONSTRAINT "reward_requests_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reward_requests"
    ADD CONSTRAINT "reward_requests_related_transaction_id_fkey" FOREIGN KEY ("related_transaction_id") REFERENCES "public"."point_transactions"("id");



ALTER TABLE ONLY "public"."reward_requests"
    ADD CONSTRAINT "reward_requests_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."reward_requests"
    ADD CONSTRAINT "reward_requests_reward_id_fkey" FOREIGN KEY ("reward_id") REFERENCES "public"."rewards"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."rewards"
    ADD CONSTRAINT "rewards_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."rewards"
    ADD CONSTRAINT "rewards_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_instances"
    ADD CONSTRAINT "task_instances_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_instances"
    ADD CONSTRAINT "task_instances_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_instances"
    ADD CONSTRAINT "task_instances_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."task_templates"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."task_templates"
    ADD CONSTRAINT "task_templates_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_templates"
    ADD CONSTRAINT "task_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."task_templates"
    ADD CONSTRAINT "task_templates_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_badges"
    ADD CONSTRAINT "user_badges_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "public"."badges"("id");



ALTER TABLE ONLY "public"."user_badges"
    ADD CONSTRAINT "user_badges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE "public"."badges" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "badges_select" ON "public"."badges" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."characters" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "characters_select" ON "public"."characters" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."families" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "families_insert" ON "public"."families" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "families_select" ON "public"."families" FOR SELECT TO "authenticated" USING (("id" = "public"."auth_family_id"()));



CREATE POLICY "families_update" ON "public"."families" FOR UPDATE TO "authenticated" USING (("id" = "public"."auth_family_id"())) WITH CHECK (("id" = "public"."auth_family_id"()));



ALTER TABLE "public"."family_rollover_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."point_transactions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "point_transactions_insert" ON "public"."point_transactions" FOR INSERT TO "authenticated" WITH CHECK ((("family_id" = "public"."auth_family_id"()) AND "public"."auth_is_parent"()));



CREATE POLICY "point_transactions_select" ON "public"."point_transactions" FOR SELECT TO "authenticated" USING (("family_id" = "public"."auth_family_id"()));



CREATE POLICY "push_sub_delete" ON "public"."push_subscriptions" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "push_sub_insert" ON "public"."push_subscriptions" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "push_sub_select" ON "public"."push_subscriptions" FOR SELECT USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."push_subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reward_requests" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "reward_requests_insert" ON "public"."reward_requests" FOR INSERT TO "authenticated" WITH CHECK (("family_id" = "public"."auth_family_id"()));



CREATE POLICY "reward_requests_select" ON "public"."reward_requests" FOR SELECT TO "authenticated" USING (("family_id" = "public"."auth_family_id"()));



CREATE POLICY "reward_requests_update" ON "public"."reward_requests" FOR UPDATE TO "authenticated" USING ((("family_id" = "public"."auth_family_id"()) AND "public"."auth_is_parent"())) WITH CHECK ((("family_id" = "public"."auth_family_id"()) AND "public"."auth_is_parent"()));



ALTER TABLE "public"."rewards" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "rewards_delete" ON "public"."rewards" FOR DELETE TO "authenticated" USING ((("family_id" = "public"."auth_family_id"()) AND "public"."auth_is_parent"()));



CREATE POLICY "rewards_insert" ON "public"."rewards" FOR INSERT TO "authenticated" WITH CHECK ((("family_id" = "public"."auth_family_id"()) AND "public"."auth_is_parent"()));



CREATE POLICY "rewards_select" ON "public"."rewards" FOR SELECT TO "authenticated" USING (("family_id" = "public"."auth_family_id"()));



CREATE POLICY "rewards_update" ON "public"."rewards" FOR UPDATE TO "authenticated" USING ((("family_id" = "public"."auth_family_id"()) AND "public"."auth_is_parent"())) WITH CHECK ((("family_id" = "public"."auth_family_id"()) AND "public"."auth_is_parent"()));



ALTER TABLE "public"."task_instances" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "task_instances_delete_child_beg" ON "public"."task_instances" FOR DELETE TO "authenticated" USING ((("family_id" = "public"."auth_family_id"()) AND (NOT "public"."auth_is_parent"()) AND ("status" = 'requested'::"text") AND ("assignee_id" = "auth"."uid"())));



CREATE POLICY "task_instances_delete_parent" ON "public"."task_instances" FOR DELETE TO "authenticated" USING ((("family_id" = "public"."auth_family_id"()) AND "public"."auth_is_parent"()));



CREATE POLICY "task_instances_insert_child_beg" ON "public"."task_instances" FOR INSERT TO "authenticated" WITH CHECK ((("family_id" = "public"."auth_family_id"()) AND (NOT "public"."auth_is_parent"()) AND ("status" = 'requested'::"text") AND ("assignee_id" = "auth"."uid"())));



CREATE POLICY "task_instances_insert_parent" ON "public"."task_instances" FOR INSERT TO "authenticated" WITH CHECK ((("family_id" = "public"."auth_family_id"()) AND "public"."auth_is_parent"()));



CREATE POLICY "task_instances_select" ON "public"."task_instances" FOR SELECT TO "authenticated" USING (("family_id" = "public"."auth_family_id"()));



CREATE POLICY "task_instances_update" ON "public"."task_instances" FOR UPDATE TO "authenticated" USING ((("family_id" = "public"."auth_family_id"()) AND "public"."auth_is_parent"())) WITH CHECK ((("family_id" = "public"."auth_family_id"()) AND "public"."auth_is_parent"()));



ALTER TABLE "public"."task_templates" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "task_templates_delete" ON "public"."task_templates" FOR DELETE TO "authenticated" USING ((("family_id" = "public"."auth_family_id"()) AND "public"."auth_is_parent"()));



CREATE POLICY "task_templates_insert" ON "public"."task_templates" FOR INSERT TO "authenticated" WITH CHECK ((("family_id" = "public"."auth_family_id"()) AND "public"."auth_is_parent"()));



CREATE POLICY "task_templates_select" ON "public"."task_templates" FOR SELECT TO "authenticated" USING (("family_id" = "public"."auth_family_id"()));



CREATE POLICY "task_templates_update" ON "public"."task_templates" FOR UPDATE TO "authenticated" USING ((("family_id" = "public"."auth_family_id"()) AND "public"."auth_is_parent"())) WITH CHECK ((("family_id" = "public"."auth_family_id"()) AND "public"."auth_is_parent"()));



ALTER TABLE "public"."user_badges" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_badges_delete" ON "public"."user_badges" FOR DELETE TO "authenticated" USING (("user_id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."family_id" = "public"."auth_family_id"()))));



CREATE POLICY "user_badges_insert" ON "public"."user_badges" FOR INSERT TO "authenticated" WITH CHECK (("user_id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."family_id" = "public"."auth_family_id"()))));



CREATE POLICY "user_badges_select" ON "public"."user_badges" FOR SELECT TO "authenticated" USING (("user_id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."family_id" = "public"."auth_family_id"()))));



ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users_delete" ON "public"."users" FOR DELETE TO "authenticated" USING ((("family_id" = "public"."auth_family_id"()) AND "public"."auth_is_parent"()));



CREATE POLICY "users_insert" ON "public"."users" FOR INSERT TO "authenticated" WITH CHECK (("id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "users_select" ON "public"."users" FOR SELECT TO "authenticated" USING (("family_id" = "public"."auth_family_id"()));



CREATE POLICY "users_select_self" ON "public"."users" FOR SELECT TO "authenticated" USING (("id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "users_update" ON "public"."users" FOR UPDATE TO "authenticated" USING (("family_id" = "public"."auth_family_id"())) WITH CHECK (("family_id" = "public"."auth_family_id"()));



CREATE POLICY "users_update_self" ON "public"."users" FOR UPDATE TO "authenticated" USING (("id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("id" = ( SELECT "auth"."uid"() AS "uid")));



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



REVOKE ALL ON FUNCTION "public"."approve_reward_request"("p_request_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."approve_reward_request"("p_request_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."approve_reward_request"("p_request_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."approve_reward_request"("p_request_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."auth_family_id"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."auth_family_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."auth_family_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auth_family_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."auth_is_parent"() TO "anon";
GRANT ALL ON FUNCTION "public"."auth_is_parent"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auth_is_parent"() TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_level"("lifetime" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_level"("lifetime" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_level"("lifetime" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_level"("lifetime" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_level"("lifetime" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_level"("lifetime" bigint) TO "service_role";



REVOKE ALL ON FUNCTION "public"."cancel_reward_request"("p_request_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."cancel_reward_request"("p_request_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."cancel_reward_request"("p_request_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cancel_reward_request"("p_request_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."complete_task"("p_instance_id" "uuid", "p_actor_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."complete_task"("p_instance_id" "uuid", "p_actor_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."complete_task"("p_instance_id" "uuid", "p_actor_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."dooooz_midnight_rollover"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."dooooz_midnight_rollover"() TO "anon";
GRANT ALL ON FUNCTION "public"."dooooz_midnight_rollover"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."dooooz_midnight_rollover"() TO "service_role";



GRANT ALL ON FUNCTION "public"."ensure_all_today_instances"() TO "anon";
GRANT ALL ON FUNCTION "public"."ensure_all_today_instances"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_all_today_instances"() TO "service_role";



GRANT ALL ON FUNCTION "public"."ensure_today_instances"("p_user_id" "uuid", "p_family_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."ensure_today_instances"("p_user_id" "uuid", "p_family_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_today_instances"("p_user_id" "uuid", "p_family_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."evaluate_badges"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."evaluate_badges"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."evaluate_badges"("p_user_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."pardon_task"("p_instance_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."pardon_task"("p_instance_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."pardon_task"("p_instance_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."pardon_task"("p_instance_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."prevent_completed_task_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."prevent_completed_task_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."prevent_completed_task_update"() TO "service_role";



GRANT ALL ON FUNCTION "public"."redeem_points"("p_user_id" "uuid", "p_amount" integer, "p_reason" "text", "p_actor_id" "uuid", "p_reward_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."redeem_points"("p_user_id" "uuid", "p_amount" integer, "p_reason" "text", "p_actor_id" "uuid", "p_reward_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."redeem_points"("p_user_id" "uuid", "p_amount" integer, "p_reason" "text", "p_actor_id" "uuid", "p_reward_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."reject_reward_request"("p_request_id" "uuid", "p_note" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."reject_reward_request"("p_request_id" "uuid", "p_note" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."reject_reward_request"("p_request_id" "uuid", "p_note" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."reject_reward_request"("p_request_id" "uuid", "p_note" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."request_reward"("p_reward_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."request_reward"("p_reward_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."request_reward"("p_reward_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."request_reward"("p_reward_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";



GRANT ALL ON FUNCTION "public"."task_templates_assignee_role_check"() TO "anon";
GRANT ALL ON FUNCTION "public"."task_templates_assignee_role_check"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."task_templates_assignee_role_check"() TO "service_role";



GRANT ALL ON FUNCTION "public"."uncomplete_task"("p_instance_id" "uuid", "p_actor_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."uncomplete_task"("p_instance_id" "uuid", "p_actor_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."uncomplete_task"("p_instance_id" "uuid", "p_actor_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."unpardon_task"("p_instance_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."unpardon_task"("p_instance_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."unpardon_task"("p_instance_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_point_cache"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_point_cache"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_point_cache"() TO "service_role";



GRANT ALL ON TABLE "public"."badges" TO "anon";
GRANT ALL ON TABLE "public"."badges" TO "authenticated";
GRANT ALL ON TABLE "public"."badges" TO "service_role";



GRANT ALL ON TABLE "public"."characters" TO "anon";
GRANT ALL ON TABLE "public"."characters" TO "authenticated";
GRANT ALL ON TABLE "public"."characters" TO "service_role";



GRANT ALL ON TABLE "public"."families" TO "anon";
GRANT ALL ON TABLE "public"."families" TO "authenticated";
GRANT ALL ON TABLE "public"."families" TO "service_role";



GRANT ALL ON TABLE "public"."family_rollover_log" TO "service_role";



GRANT ALL ON TABLE "public"."point_transactions" TO "service_role";
GRANT SELECT,INSERT ON TABLE "public"."point_transactions" TO "authenticated";



GRANT ALL ON TABLE "public"."push_subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."push_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."push_subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."reward_requests" TO "service_role";
GRANT SELECT,INSERT,UPDATE ON TABLE "public"."reward_requests" TO "authenticated";



GRANT ALL ON TABLE "public"."rewards" TO "anon";
GRANT ALL ON TABLE "public"."rewards" TO "authenticated";
GRANT ALL ON TABLE "public"."rewards" TO "service_role";



GRANT ALL ON TABLE "public"."task_instances" TO "anon";
GRANT ALL ON TABLE "public"."task_instances" TO "authenticated";
GRANT ALL ON TABLE "public"."task_instances" TO "service_role";



GRANT ALL ON TABLE "public"."task_templates" TO "anon";
GRANT ALL ON TABLE "public"."task_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."task_templates" TO "service_role";



GRANT ALL ON TABLE "public"."user_badges" TO "anon";
GRANT ALL ON TABLE "public"."user_badges" TO "authenticated";
GRANT ALL ON TABLE "public"."user_badges" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







