-- ============================================================
-- Badges: permanent (never auto-revoke) + monotonic evaluation
-- ============================================================
-- WHY: evaluate_badges() re-evaluated all 58 badges on every call and
-- DELETEd any whose condition was not "true right now". Combined with
-- narrow time windows (perfect_day = today/yesterday only, perfect_quarter
-- = current year only, perfect_year = last year only, streak = current run
-- only), children silently LOST badges they had legitimately earned
-- (esp. "완벽한 하루"/perfect_day, which vanishes after 2 days).
--
-- FIX (two parts, both in the redefined function below):
--   1. Remove the `else ... delete` branch -> a badge, once earned, is kept
--      forever (append-only, on conflict do nothing).
--   2. Make every windowed check MONOTONIC (evaluate over the full history
--      / all-time best), so re-running evaluate_badges re-awards past
--      achievements that the old windows had dropped:
--        - streak         : current run  -> all-time longest run
--        - perfect_day     : today/yest  -> any day in history
--        - perfect_quarter : this year    -> any year since join
--        - perfect_year    : last year    -> any full year since join
--   (perfect_week / perfect_month / early_bird / cumulative counts were
--    already whole-history or monotonic and are unchanged in logic.)
--
-- DATA SAFETY: this migration only CREATE OR REPLACEs a function and then
-- INSERTs missing user_badges rows (on conflict do nothing). It never
-- DROPs or DELETEs any row. The prior destructive DELETE is removed.
-- Touched tables read: users, families, task_instances, point_transactions,
-- badges. Written table: user_badges (insert-only).

CREATE OR REPLACE FUNCTION "public"."evaluate_badges"("p_user_id" "uuid") RETURNS "text"[]
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_family_tz        text;
  v_family_id        uuid;
  v_created_at       timestamptz;
  v_join_year        int;
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
  v_join_year := extract(year from (v_created_at at time zone v_family_tz))::int;

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

  -- streak = ALL-TIME longest run of consecutive completed days
  -- (was: current run only). A gap-and-island grouping: days that stay on
  -- the same (date - row_number) island are consecutive; the longest island
  -- is the best streak the child ever achieved. Badges are "earned once".
  with days as (
    select distinct (completed_at at time zone v_family_tz)::date as d
      from public.task_instances
     where assignee_id = p_user_id and status = 'completed' and completed_at is not null
       and template_id is not null
  ),
  grp as (
    select d, (d - (row_number() over (order by d))::int) as island
      from days
  ),
  runs as (
    select count(*) as run_len from grp group by island
  )
  select coalesce(max(run_len), 0) into v_streak from runs;

  v_days_since_join := greatest(0, (v_today - (v_created_at at time zone v_family_tz)::date));

  -- early_bird: any day in history with >=3 completed tasks all before 2pm
  -- (already whole-history; unchanged).
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

      -- perfect_day: ANY day in history where every assigned task was completed
      -- (was: only today or yesterday -> badge vanished after 2 days).
      when 'perfect_day' then
        v_awarded := exists(
          select 1 from (
            select due_date
            from public.task_instances
            where assignee_id = p_user_id
              and template_id is not null
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

      -- perfect_quarter: rule_value = quarter number (1..4). Award if that
      -- quarter was completed perfectly in ANY year since join (was: current
      -- year only -> badge vanished when the year rolled over).
      when 'perfect_quarter' then
        declare
          v_q_start date; v_q_end date; v_q_days int; v_yr int;
        begin
          v_awarded := false;
          for v_yr in v_join_year .. v_cur_year loop
            v_q_start := make_date(v_yr, (r.rule_value - 1) * 3 + 1, 1);
            v_q_end := (v_q_start + interval '3 months' - interval '1 day')::date;
            v_q_days := v_q_end - v_q_start + 1;
            if v_q_end < v_today then
              if (
                select count(distinct due_date) >= (v_q_days - 2)
                  and count(distinct due_date) >= 5
                  and count(*) = count(*) filter (where status = 'completed')
                  from public.task_instances
                 where assignee_id = p_user_id and template_id is not null
                   and due_date >= v_q_start and due_date <= v_q_end
                   and status in ('pending','completed','overdue')
              ) then
                v_awarded := true;
              end if;
            end if;
          end loop;
        end;

      -- perfect_year: award if ANY full year since join was completed
      -- perfectly (was: last calendar year only).
      when 'perfect_year' then
        declare
          v_y_days int; v_yr int;
        begin
          v_awarded := false;
          for v_yr in v_join_year .. (v_cur_year - 1) loop
            v_y_days := make_date(v_yr, 12, 31) - make_date(v_yr, 1, 1) + 1;
            if (
              select count(distinct due_date) >= (v_y_days - 2)
                and count(distinct due_date) >= 5
                and count(*) = count(*) filter (where status = 'completed')
                from public.task_instances
               where assignee_id = p_user_id and template_id is not null
                 and due_date >= make_date(v_yr, 1, 1)
                 and due_date <= make_date(v_yr, 12, 31)
                 and status in ('pending','completed','overdue')
            ) then
              v_awarded := true;
            end if;
          end loop;
        end;

      else
        v_awarded := false;
    end case;

    -- Badges are PERMANENT: award if earned, never revoke.
    if v_awarded then
      insert into public.user_badges (user_id, badge_id)
        values (p_user_id, r.id)
        on conflict do nothing;
      if found then
        v_new_badges := array_append(v_new_badges, r.id);
      end if;
    end if;
    -- (no else branch: the destructive DELETE is intentionally removed)
  end loop;

  return v_new_badges;
end;
$$;

-- ------------------------------------------------------------
-- Backfill: re-award every badge each user has ever earned.
-- Insert-only (evaluate_badges no longer deletes), so this cannot remove
-- any existing badge. Runs for all users; non-child users simply match no
-- completion-based badges.
-- ------------------------------------------------------------
do $$
declare
  u record;
begin
  for u in select id from public.users loop
    perform public.evaluate_badges(u.id);
  end loop;
end $$;
