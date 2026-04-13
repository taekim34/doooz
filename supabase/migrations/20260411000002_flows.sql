-- dooooz flows: plpgsql functions that implement the transactional core
-- Spec Section 6. Everything mutating points / chores / goals goes through these.
-- All called via supabase.rpc() from Next.js API routes.

set search_path = public;

-- ============================================================
-- evaluate_badges(p_user_id)
-- Evaluates every badge rule and inserts newly earned rows into user_badges.
-- Returns text[] of badge ids that were newly awarded this call.
-- Spec 5.3. Isolated from main transaction in calling function via exception handler.
-- ============================================================
create or replace function evaluate_badges(p_user_id uuid)
returns text[]
language plpgsql
security definer
as $$
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
  -- Load user + family context
  select u.family_id, u.lifetime_earned, u.created_at, f.timezone
    into v_family_id, v_lifetime, v_created_at, v_family_tz
  from users u
  join families f on f.id = u.family_id
  where u.id = p_user_id;

  if v_family_id is null then
    return '{}';
  end if;

  -- Completion counts
  select count(*) into v_total_count
    from chore_instances
   where assignee_id = p_user_id and status = 'completed';

  -- Hard chore count (>= 30 points as per spec economy)
  select count(*) into v_hard_count
    from chore_instances
   where assignee_id = p_user_id and status = 'completed' and points >= 30;

  -- Redemption stats
  select count(*), coalesce(max(-amount), 0)
    into v_redemption_count, v_big_redemption
    from point_transactions
   where user_id = p_user_id and kind = 'redemption';

  -- Goal completion count
  select count(*) into v_goal_count
    from goals
   where assignee_id = p_user_id and status = 'completed';

  -- Streak — consecutive family-local days with at least one completion ending today (or yesterday if today empty)
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

  -- Days since user created (anniversary)
  v_days_since_join := greatest(0, ((now() at time zone v_family_tz)::date - (v_created_at at time zone v_family_tz)::date));

  -- Early bird — any completion before 8am local
  select exists(
    select 1 from chore_instances
     where assignee_id = p_user_id
       and status = 'completed'
       and completed_at is not null
       and extract(hour from (completed_at at time zone v_family_tz)) < 8
  ) into v_early_bird_hit;

  -- Iterate each badge rule and upsert
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
        -- rule_value=1 means any redemption; > 1 means single redemption >= rule_value
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
$$;

-- ============================================================
-- evaluate_goals(p_user_id)
-- Updates progress for all active goals belonging to user.
-- For any that reach target: mark completed, issue goal_reward transaction.
-- Returns jsonb array of newly-completed goal records.
-- ============================================================
create or replace function evaluate_goals(p_user_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_family_id uuid;
  g record;
  v_progress int;
  v_completed jsonb := '[]'::jsonb;
begin
  select family_id into v_family_id from users where id = p_user_id;
  if v_family_id is null then return '[]'::jsonb; end if;

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
      -- period_points: sum chore_reward + goal_reward + bonus within window.
      -- NOTE: window bounds compare created_at (timestamptz) against start_date/end_date
      -- cast to timestamptz, which uses UTC midnight. For families in non-UTC zones this
      -- can include/exclude transactions from the edge day by up to |tz offset| hours.
      -- TODO(MVP+): rewrite as ((created_at at time zone family.timezone)::date between
      -- g.start_date and g.end_date) once evaluate_goals loads family tz.
      select coalesce(sum(amount), 0) into v_progress
        from point_transactions
       where user_id = p_user_id
         and amount > 0
         and kind in ('chore_reward','bonus','goal_reward')
         and (g.start_date is null or created_at >= g.start_date::timestamptz)
         and (g.end_date   is null or created_at <  (g.end_date + 1)::timestamptz);
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
$$;

-- ============================================================
-- complete_chore(p_instance_id, p_actor_id)
-- Atomic chore completion. Spec 6.1.
-- ============================================================
create or replace function complete_chore(p_instance_id uuid, p_actor_id uuid)
returns jsonb
language plpgsql
security definer
as $$
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

  -- Lock the chore instance row
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

  -- Idempotent: already completed returns current state
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

  -- Insert point reward (trigger updates balance/lifetime/level)
  insert into point_transactions
    (family_id, user_id, amount, kind, reason, related_chore_id, actor_id)
  values
    (v_instance.family_id, v_instance.assignee_id, v_instance.points,
     'chore_reward', '집안일 완료: ' || v_instance.title,
     v_instance.id, p_actor_id);

  -- Refresh owner (cache updated by trigger)
  select * into v_owner from users where id = v_instance.assignee_id;
  v_balance := v_owner.current_balance;
  v_new_level := v_owner.level;

  -- Evaluate goals (isolated)
  begin
    v_completed_goals := evaluate_goals(v_instance.assignee_id);
  exception when others then
    v_completed_goals := '[]'::jsonb;
    raise warning 'evaluate_goals failed: %', sqlerrm;
  end;

  -- Evaluate badges (isolated)
  begin
    v_new_badges := evaluate_badges(v_instance.assignee_id);
  exception when others then
    v_new_badges := '{}';
    raise warning 'evaluate_badges failed: %', sqlerrm;
  end;

  -- Reload for any goal-reward level bumps
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
$$;

-- ============================================================
-- redeem_points(p_user_id, p_amount, p_reason, p_actor_id, p_reward_id)
-- Parent-driven redemption. Spec 6.2.
-- ============================================================
create or replace function redeem_points(
  p_user_id uuid,
  p_amount int,
  p_reason text,
  p_actor_id uuid,
  p_reward_id uuid default null
)
returns jsonb
language plpgsql
security definer
as $$
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

  -- Reload
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

-- ============================================================
-- ensure_today_instances(p_user_id, p_family_id)
-- Lazy generates today's chore_instances from active templates. Spec 6.3.
-- Returns count of newly created instances.
-- ============================================================
create or replace function ensure_today_instances(p_user_id uuid, p_family_id uuid)
returns int
language plpgsql
security definer
as $$
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
  v_dow := extract(isodow from v_today);  -- 1=Mon..7=Sun
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
$$;

-- ============================================================
-- complete_manual_goal(p_goal_id, p_actor_id)
-- Parent-only. Marks a manual goal completed and issues its reward.
-- ============================================================
create or replace function complete_manual_goal(p_goal_id uuid, p_actor_id uuid)
returns jsonb
language plpgsql
security definer
as $$
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
$$;

-- Grants so authenticated users can invoke via PostgREST rpc.
grant execute on function evaluate_badges(uuid) to authenticated;
grant execute on function evaluate_goals(uuid) to authenticated;
grant execute on function complete_chore(uuid, uuid) to authenticated;
grant execute on function redeem_points(uuid, int, text, uuid, uuid) to authenticated;
grant execute on function ensure_today_instances(uuid, uuid) to authenticated;
grant execute on function complete_manual_goal(uuid, uuid) to authenticated;
