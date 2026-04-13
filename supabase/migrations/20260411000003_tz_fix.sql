-- dooooz migration 3: family-timezone fix for evaluate_goals period_points window.
--
-- Gap closed: invariant I10 had one remaining edge. The original evaluate_goals
-- (migration 2) compared point_transactions.created_at against
-- start_date::timestamptz / (end_date+1)::timestamptz, which anchors the window
-- to UTC midnight rather than the family's local-day start. For a family in
-- Asia/Seoul (+09:00), that skewed the edge-day boundary by up to 9 hours —
-- transactions from the user's real "last day" of the goal could fall outside
-- the window or transactions from the day before start could leak in.
--
-- This migration replaces evaluate_goals with a version that loads the family's
-- timezone and computes window bounds via `AT TIME ZONE <tz>` so that
-- start_date 00:00 local and (end_date + 1 day) 00:00 local become the exact
-- half-open bounds for the `created_at` comparison. Everything else about the
-- function is identical to the previous version.
--
-- I10 ("Date comparisons use families.timezone") is now fully enforced.

set search_path = public;

create or replace function evaluate_goals(p_user_id uuid)
returns jsonb
language plpgsql
security definer
as $$
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
      -- period_points: sum chore_reward + goal_reward + bonus within window.
      -- Window bounds are computed in the family's local timezone so that the
      -- comparison matches the user's lived "day" rather than UTC midnight.
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
$$;

grant execute on function evaluate_goals(uuid) to authenticated;
