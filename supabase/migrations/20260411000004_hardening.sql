-- Hardening migration: fix all WARN-level advisor findings.
-- 1) SET search_path on all functions.
-- 2) Rewrite RLS policies to use (select auth.uid()) for initplan optimization.
-- 3) Tighten families_insert WITH CHECK.
-- 4) Defense-in-depth REVOKE/GRANT on point_transactions.

-- ============================================================================
-- Part 1: Function search_path hardening
-- ============================================================================

-- calculate_level: IMMUTABLE pure SQL, only needs pg_catalog + pg_temp.
CREATE OR REPLACE FUNCTION public.calculate_level(lifetime integer)
 RETURNS integer
 LANGUAGE sql
 IMMUTABLE
 SET search_path = pg_catalog, pg_temp
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.complete_chore(p_instance_id uuid, p_actor_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $function$
declare
  v_instance chore_instances%rowtype;
  v_actor    users%rowtype;
  v_owner    users%rowtype;
  v_old_level int;
  v_new_level int;
  v_balance  int;
  v_new_badges   text[];
  v_completed_goals jsonb := '[]'::jsonb;
begin
  select * into v_actor from users where id = p_actor_id;
  if v_actor.id is null then
    raise exception 'AUTH: actor not found' using errcode = '42501';
  end if;

  select * into v_instance from chore_instances where id = p_instance_id for update;
  if v_instance.id is null then
    raise exception 'NOT_FOUND: chore_instance %', p_instance_id using errcode = 'P0002';
  end if;

  if v_instance.family_id <> v_actor.family_id then
    raise exception 'FORBIDDEN: cross-family access' using errcode = '42501';
  end if;

  if v_actor.role <> 'parent' and v_instance.assignee_id <> p_actor_id then
    raise exception 'FORBIDDEN: not assignee or parent' using errcode = '42501';
  end if;

  if v_instance.status = 'completed' then
    select * into v_owner from users where id = v_instance.assignee_id;
    return jsonb_build_object(
      'balance', v_owner.current_balance,
      'leveledUp', false,
      'newBadges', '[]'::jsonb,
      'completedGoals', '[]'::jsonb,
      'idempotent', true
    );
  end if;

  select * into v_owner from users where id = v_instance.assignee_id for update;
  v_old_level := v_owner.level;

  update chore_instances
     set status = 'completed', completed_at = now()
   where id = p_instance_id;

  insert into point_transactions
    (family_id, user_id, amount, kind, reason, related_chore_id, actor_id)
  values
    (v_instance.family_id, v_instance.assignee_id, v_instance.points,
     'chore_reward', '집안일 완료: ' || v_instance.title,
     v_instance.id, p_actor_id);

  select * into v_owner from users where id = v_instance.assignee_id;
  v_balance := v_owner.current_balance;
  v_new_level := v_owner.level;

  begin
    v_completed_goals := evaluate_goals(v_instance.assignee_id);
  exception when others then
    v_completed_goals := '[]'::jsonb;
    raise warning 'evaluate_goals failed: %', sqlerrm;
  end;

  begin
    v_new_badges := evaluate_badges(v_instance.assignee_id);
  exception when others then
    v_new_badges := '{}';
    raise warning 'evaluate_badges failed: %', sqlerrm;
  end;

  select * into v_owner from users where id = v_instance.assignee_id;
  v_balance := v_owner.current_balance;
  v_new_level := v_owner.level;

  return jsonb_build_object(
    'balance', v_balance,
    'level', v_new_level,
    'leveledUp', v_new_level > v_old_level,
    'newBadges', to_jsonb(v_new_badges),
    'completedGoals', v_completed_goals
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.complete_manual_goal(p_goal_id uuid, p_actor_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $function$
declare
  v_actor users%rowtype;
  v_goal goals%rowtype;
begin
  select * into v_actor from users where id = p_actor_id;
  if v_actor.id is null or v_actor.role <> 'parent' then
    raise exception 'FORBIDDEN: parent only' using errcode = '42501';
  end if;

  select * into v_goal from goals where id = p_goal_id for update;
  if v_goal.id is null then
    raise exception 'NOT_FOUND: goal' using errcode = 'P0002';
  end if;

  if v_goal.family_id <> v_actor.family_id then
    raise exception 'FORBIDDEN: cross-family' using errcode = '42501';
  end if;

  if v_goal.goal_type <> 'manual' then
    raise exception 'INVALID: only manual goals' using errcode = '22023';
  end if;

  if v_goal.status <> 'active' then
    return jsonb_build_object('status', v_goal.status, 'idempotent', true);
  end if;

  update goals
     set status = 'completed', completed_at = now(), progress = 1
   where id = p_goal_id;

  if coalesce(v_goal.reward_points, 0) > 0 then
    insert into point_transactions
      (family_id, user_id, amount, kind, reason, related_goal_id, actor_id)
    values
      (v_goal.family_id, v_goal.assignee_id, v_goal.reward_points,
       'goal_reward', '목표 달성: ' || v_goal.title, v_goal.id, p_actor_id);
  end if;

  begin
    perform evaluate_badges(v_goal.assignee_id);
  exception when others then null;
  end;

  return jsonb_build_object('status', 'completed');
end;
$function$;

CREATE OR REPLACE FUNCTION public.ensure_today_instances(p_user_id uuid, p_family_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $function$
declare
  v_tz text;
  v_today date;
  v_dow int;
  v_dow_token text;
  v_count int := 0;
  t chore_templates%rowtype;
begin
  select timezone into v_tz from families where id = p_family_id;
  if v_tz is null then return 0; end if;

  v_today := (now() at time zone v_tz)::date;
  v_dow := extract(isodow from v_today);
  v_dow_token := case v_dow
    when 1 then 'mon' when 2 then 'tue' when 3 then 'wed' when 4 then 'thu'
    when 5 then 'fri' when 6 then 'sat' when 7 then 'sun' end;

  for t in
    select * from chore_templates
     where family_id = p_family_id
       and assignee_id = p_user_id
       and active = true
       and start_date <= v_today
       and (end_date is null or end_date >= v_today)
  loop
    if
      t.recurrence = 'daily'
      or (t.recurrence = 'weekdays' and v_dow between 1 and 5)
      or (t.recurrence like 'weekly:%' and position(v_dow_token in substring(t.recurrence from 8)) > 0)
      or (t.recurrence = 'once' and t.start_date = v_today)
    then
      insert into chore_instances
        (family_id, template_id, assignee_id, title, points, due_date)
      values
        (t.family_id, t.id, t.assignee_id, t.title, t.points, v_today)
      on conflict (template_id, assignee_id, due_date) do nothing;
      if found then v_count := v_count + 1; end if;
    end if;
  end loop;

  return v_count;
end;
$function$;

CREATE OR REPLACE FUNCTION public.evaluate_badges(p_user_id uuid)
 RETURNS text[]
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $function$
declare
  v_family_tz        text;
  v_family_id        uuid;
  v_created_at       timestamptz;
  v_total_count      int;
  v_hard_count       int;
  v_lifetime         int;
  v_redemption_count int;
  v_big_redemption   int;
  v_goal_count       int;
  v_streak           int;
  v_days_since_join  int;
  v_early_bird_hit   boolean;
  v_new_badges       text[] := '{}';
  r                  record;
  v_awarded          boolean;
begin
  select u.family_id, u.lifetime_earned, u.created_at, f.timezone
    into v_family_id, v_lifetime, v_created_at, v_family_tz
  from users u
  join families f on f.id = u.family_id
  where u.id = p_user_id;

  if v_family_id is null then
    return '{}';
  end if;

  select count(*) into v_total_count
    from chore_instances
   where assignee_id = p_user_id and status = 'completed';

  select count(*) into v_hard_count
    from chore_instances
   where assignee_id = p_user_id and status = 'completed' and points >= 30;

  select count(*), coalesce(max(-amount), 0)
    into v_redemption_count, v_big_redemption
    from point_transactions
   where user_id = p_user_id and kind = 'redemption';

  select count(*) into v_goal_count
    from goals
   where assignee_id = p_user_id and status = 'completed';

  with days as (
    select distinct (completed_at at time zone v_family_tz)::date as d
      from chore_instances
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
    select 1 from chore_instances
     where assignee_id = p_user_id
       and status = 'completed'
       and completed_at is not null
       and extract(hour from (completed_at at time zone v_family_tz)) < 8
  ) into v_early_bird_hit;

  for r in select * from badges loop
    v_awarded := false;
    case r.rule_type
      when 'total_count' then
        v_awarded := v_total_count >= r.rule_value;
      when 'hard_worker' then
        v_awarded := v_hard_count >= r.rule_value;
      when 'lifetime_points' then
        v_awarded := v_lifetime >= r.rule_value;
      when 'redemption' then
        if r.rule_value <= 1 then
          v_awarded := v_redemption_count >= 1;
        else
          v_awarded := v_big_redemption >= r.rule_value;
        end if;
      when 'goal_count' then
        v_awarded := v_goal_count >= r.rule_value;
      when 'streak' then
        v_awarded := v_streak >= r.rule_value;
      when 'anniversary' then
        v_awarded := v_days_since_join >= r.rule_value;
      when 'time_condition' then
        v_awarded := v_early_bird_hit;
      when 'perfect_day' then
        v_awarded := exists(
          select 1
            from chore_instances
           where assignee_id = p_user_id
             and due_date = (now() at time zone v_family_tz)::date
          group by due_date
          having count(*) > 0
             and count(*) filter (where status = 'completed') = count(*)
        );
      when 'perfect_week' then
        v_awarded := (
          select bool_or(all_done) from (
            select count(*) filter (where status = 'completed') = count(*) as all_done
              from chore_instances
             where assignee_id = p_user_id
               and due_date >= (now() at time zone v_family_tz)::date - 6
               and due_date <= (now() at time zone v_family_tz)::date
          ) s
        );
      else
        v_awarded := false;
    end case;

    if v_awarded then
      insert into user_badges (user_id, badge_id)
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

CREATE OR REPLACE FUNCTION public.evaluate_goals(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $function$
declare
  v_family_id uuid;
  v_family_tz text;
  g record;
  v_progress int;
  v_window_start timestamptz;
  v_window_end   timestamptz;
  v_completed jsonb := '[]'::jsonb;
begin
  select u.family_id, f.timezone
    into v_family_id, v_family_tz
    from users u
    join families f on f.id = u.family_id
   where u.id = p_user_id;

  if v_family_id is null then return '[]'::jsonb; end if;
  if v_family_tz is null then v_family_tz := 'UTC'; end if;

  for g in
    select * from goals
     where assignee_id = p_user_id
       and status = 'active'
       and goal_type in ('period_chore_count', 'period_points')
     for update
  loop
    if g.goal_type = 'period_chore_count' then
      select count(*) into v_progress
        from chore_instances
       where assignee_id = p_user_id
         and status = 'completed'
         and (g.target_chore_template_id is null or template_id = g.target_chore_template_id)
         and (g.start_date is null or due_date >= g.start_date)
         and (g.end_date   is null or due_date <= g.end_date);
    else
      if g.start_date is null then
        v_window_start := null;
      else
        v_window_start := (g.start_date::timestamp at time zone v_family_tz);
      end if;

      if g.end_date is null then
        v_window_end := null;
      else
        v_window_end := ((g.end_date + 1)::timestamp at time zone v_family_tz);
      end if;

      select coalesce(sum(amount), 0) into v_progress
        from point_transactions
       where user_id = p_user_id
         and amount > 0
         and kind in ('chore_reward','bonus','goal_reward')
         and (v_window_start is null or created_at >= v_window_start)
         and (v_window_end   is null or created_at <  v_window_end);
    end if;

    update goals set progress = v_progress where id = g.id;

    if (g.goal_type = 'period_chore_count' and v_progress >= coalesce(g.target_count, 2147483647))
       or (g.goal_type = 'period_points' and v_progress >= coalesce(g.target_points, 2147483647))
    then
      update goals
         set status = 'completed',
             completed_at = now(),
             progress = v_progress
       where id = g.id;

      if coalesce(g.reward_points, 0) > 0 then
        insert into point_transactions
          (family_id, user_id, amount, kind, reason, related_goal_id, actor_id)
        values
          (v_family_id, p_user_id, g.reward_points, 'goal_reward',
           '목표 달성 보상: ' || g.title, g.id, p_user_id);
      end if;

      v_completed := v_completed || jsonb_build_object(
        'id', g.id,
        'title', g.title,
        'reward_points', g.reward_points
      );
    end if;
  end loop;

  return v_completed;
end;
$function$;

CREATE OR REPLACE FUNCTION public.redeem_points(p_user_id uuid, p_amount integer, p_reason text, p_actor_id uuid, p_reward_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.update_user_point_cache()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public, pg_temp
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.prevent_completed_chore_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public, pg_temp
AS $function$
begin
  if OLD.status = 'completed' then
    raise exception 'chore_instance is immutable once completed (I7)';
  end if;
  return NEW;
end;
$function$;

-- ============================================================================
-- Part 2: RLS initplan optimization — rewrap auth.uid() as (select auth.uid())
-- ============================================================================

-- families
DROP POLICY "families_select" ON public.families;
CREATE POLICY "families_select" ON public.families
  FOR SELECT TO authenticated
  USING (id = (SELECT users.family_id FROM public.users WHERE users.id = (select auth.uid())));

DROP POLICY "families_update" ON public.families;
CREATE POLICY "families_update" ON public.families
  FOR UPDATE TO authenticated
  USING (id = (SELECT users.family_id FROM public.users WHERE users.id = (select auth.uid())))
  WITH CHECK (id = (SELECT users.family_id FROM public.users WHERE users.id = (select auth.uid())));

-- Part 3: families_insert tightening (also covers rls_policy_always_true WARN)
DROP POLICY "families_insert" ON public.families;
CREATE POLICY "families_insert" ON public.families
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

-- users
DROP POLICY "users_select" ON public.users;
CREATE POLICY "users_select" ON public.users
  FOR SELECT TO authenticated
  USING (family_id = (SELECT u.family_id FROM public.users u WHERE u.id = (select auth.uid())));

DROP POLICY "users_insert" ON public.users;
CREATE POLICY "users_insert" ON public.users
  FOR INSERT TO authenticated
  WITH CHECK (id = (select auth.uid()));

DROP POLICY "users_update" ON public.users;
CREATE POLICY "users_update" ON public.users
  FOR UPDATE TO authenticated
  USING (family_id = (SELECT u.family_id FROM public.users u WHERE u.id = (select auth.uid())))
  WITH CHECK (family_id = (SELECT u.family_id FROM public.users u WHERE u.id = (select auth.uid())));

DROP POLICY "users_delete" ON public.users;
CREATE POLICY "users_delete" ON public.users
  FOR DELETE TO authenticated
  USING (family_id = (SELECT u.family_id FROM public.users u WHERE u.id = (select auth.uid())));

-- chore_templates
DROP POLICY "chore_templates_select" ON public.chore_templates;
CREATE POLICY "chore_templates_select" ON public.chore_templates
  FOR SELECT TO authenticated
  USING (family_id = (SELECT users.family_id FROM public.users WHERE users.id = (select auth.uid())));

DROP POLICY "chore_templates_insert" ON public.chore_templates;
CREATE POLICY "chore_templates_insert" ON public.chore_templates
  FOR INSERT TO authenticated
  WITH CHECK (family_id = (SELECT users.family_id FROM public.users WHERE users.id = (select auth.uid())));

DROP POLICY "chore_templates_update" ON public.chore_templates;
CREATE POLICY "chore_templates_update" ON public.chore_templates
  FOR UPDATE TO authenticated
  USING (family_id = (SELECT users.family_id FROM public.users WHERE users.id = (select auth.uid())))
  WITH CHECK (family_id = (SELECT users.family_id FROM public.users WHERE users.id = (select auth.uid())));

DROP POLICY "chore_templates_delete" ON public.chore_templates;
CREATE POLICY "chore_templates_delete" ON public.chore_templates
  FOR DELETE TO authenticated
  USING (family_id = (SELECT users.family_id FROM public.users WHERE users.id = (select auth.uid())));

-- chore_instances
DROP POLICY "chore_instances_select" ON public.chore_instances;
CREATE POLICY "chore_instances_select" ON public.chore_instances
  FOR SELECT TO authenticated
  USING (family_id = (SELECT users.family_id FROM public.users WHERE users.id = (select auth.uid())));

DROP POLICY "chore_instances_insert" ON public.chore_instances;
CREATE POLICY "chore_instances_insert" ON public.chore_instances
  FOR INSERT TO authenticated
  WITH CHECK (family_id = (SELECT users.family_id FROM public.users WHERE users.id = (select auth.uid())));

DROP POLICY "chore_instances_update" ON public.chore_instances;
CREATE POLICY "chore_instances_update" ON public.chore_instances
  FOR UPDATE TO authenticated
  USING (family_id = (SELECT users.family_id FROM public.users WHERE users.id = (select auth.uid())))
  WITH CHECK (family_id = (SELECT users.family_id FROM public.users WHERE users.id = (select auth.uid())));

DROP POLICY "chore_instances_delete" ON public.chore_instances;
CREATE POLICY "chore_instances_delete" ON public.chore_instances
  FOR DELETE TO authenticated
  USING (family_id = (SELECT users.family_id FROM public.users WHERE users.id = (select auth.uid())));

-- rewards
DROP POLICY "rewards_select" ON public.rewards;
CREATE POLICY "rewards_select" ON public.rewards
  FOR SELECT TO authenticated
  USING (family_id = (SELECT users.family_id FROM public.users WHERE users.id = (select auth.uid())));

DROP POLICY "rewards_insert" ON public.rewards;
CREATE POLICY "rewards_insert" ON public.rewards
  FOR INSERT TO authenticated
  WITH CHECK (family_id = (SELECT users.family_id FROM public.users WHERE users.id = (select auth.uid())));

DROP POLICY "rewards_update" ON public.rewards;
CREATE POLICY "rewards_update" ON public.rewards
  FOR UPDATE TO authenticated
  USING (family_id = (SELECT users.family_id FROM public.users WHERE users.id = (select auth.uid())))
  WITH CHECK (family_id = (SELECT users.family_id FROM public.users WHERE users.id = (select auth.uid())));

DROP POLICY "rewards_delete" ON public.rewards;
CREATE POLICY "rewards_delete" ON public.rewards
  FOR DELETE TO authenticated
  USING (family_id = (SELECT users.family_id FROM public.users WHERE users.id = (select auth.uid())));

-- goals
DROP POLICY "goals_select" ON public.goals;
CREATE POLICY "goals_select" ON public.goals
  FOR SELECT TO authenticated
  USING (family_id = (SELECT users.family_id FROM public.users WHERE users.id = (select auth.uid())));

DROP POLICY "goals_insert" ON public.goals;
CREATE POLICY "goals_insert" ON public.goals
  FOR INSERT TO authenticated
  WITH CHECK (family_id = (SELECT users.family_id FROM public.users WHERE users.id = (select auth.uid())));

DROP POLICY "goals_update" ON public.goals;
CREATE POLICY "goals_update" ON public.goals
  FOR UPDATE TO authenticated
  USING (family_id = (SELECT users.family_id FROM public.users WHERE users.id = (select auth.uid())))
  WITH CHECK (family_id = (SELECT users.family_id FROM public.users WHERE users.id = (select auth.uid())));

DROP POLICY "goals_delete" ON public.goals;
CREATE POLICY "goals_delete" ON public.goals
  FOR DELETE TO authenticated
  USING (family_id = (SELECT users.family_id FROM public.users WHERE users.id = (select auth.uid())));

-- user_badges
DROP POLICY "user_badges_select" ON public.user_badges;
CREATE POLICY "user_badges_select" ON public.user_badges
  FOR SELECT TO authenticated
  USING (user_id IN (SELECT users.id FROM public.users WHERE users.family_id = (SELECT users_1.family_id FROM public.users users_1 WHERE users_1.id = (select auth.uid()))));

DROP POLICY "user_badges_insert" ON public.user_badges;
CREATE POLICY "user_badges_insert" ON public.user_badges
  FOR INSERT TO authenticated
  WITH CHECK (user_id IN (SELECT users.id FROM public.users WHERE users.family_id = (SELECT users_1.family_id FROM public.users users_1 WHERE users_1.id = (select auth.uid()))));

DROP POLICY "user_badges_delete" ON public.user_badges;
CREATE POLICY "user_badges_delete" ON public.user_badges
  FOR DELETE TO authenticated
  USING (user_id IN (SELECT users.id FROM public.users WHERE users.family_id = (SELECT users_1.family_id FROM public.users users_1 WHERE users_1.id = (select auth.uid()))));

-- point_transactions
DROP POLICY "point_transactions_select" ON public.point_transactions;
CREATE POLICY "point_transactions_select" ON public.point_transactions
  FOR SELECT TO authenticated
  USING (family_id = (SELECT users.family_id FROM public.users WHERE users.id = (select auth.uid())));

DROP POLICY "point_transactions_insert" ON public.point_transactions;
CREATE POLICY "point_transactions_insert" ON public.point_transactions
  FOR INSERT TO authenticated
  WITH CHECK (family_id = (SELECT users.family_id FROM public.users WHERE users.id = (select auth.uid())));

-- ============================================================================
-- Part 4: Defense-in-depth REVOKE/GRANT on point_transactions.
-- SECURITY DEFINER functions (complete_chore, redeem_points, etc.) run as
-- function owner (postgres), so revoking INSERT from authenticated is safe —
-- clients should never directly INSERT into the ledger.
-- ============================================================================

REVOKE ALL ON public.point_transactions FROM anon, authenticated;
GRANT SELECT ON public.point_transactions TO authenticated;
