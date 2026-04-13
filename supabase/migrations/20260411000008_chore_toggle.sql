-- 20260411000008_chore_toggle.sql
-- Toggleable chore completion: allow status/completed_at transitions back to pending
-- while preserving I6 (append-only point_transactions) and I7 (snapshot immutability).

-- 1a. Relax prevent_completed_chore_update to only block snapshot field edits.
create or replace function public.prevent_completed_chore_update()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if OLD.status = 'completed' then
    if NEW.title is distinct from OLD.title
       or NEW.points is distinct from OLD.points
       or NEW.assignee_id is distinct from OLD.assignee_id
       or NEW.due_date is distinct from OLD.due_date
       or NEW.family_id is distinct from OLD.family_id then
      raise exception 'cannot modify snapshot fields of completed chore instance';
    end if;
  end if;
  return NEW;
end;
$$;

-- 1b. complete_chore: on re-completion (chore_reward already exists), insert adjustment instead.
create or replace function public.complete_chore(p_instance_id uuid, p_actor_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_instance chore_instances%rowtype;
  v_actor    users%rowtype;
  v_owner    users%rowtype;
  v_old_level int;
  v_new_level int;
  v_balance  int;
  v_new_badges   text[];
  v_completed_goals jsonb := '[]'::jsonb;
  v_has_prior_reward boolean;
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

  -- Determine whether a chore_reward has ever been recorded for this instance.
  select exists(
    select 1 from point_transactions
     where related_chore_id = v_instance.id
       and kind = 'chore_reward'
  ) into v_has_prior_reward;

  if v_has_prior_reward then
    -- Re-completion after a previous uncheck. Unique index on chore_reward still holds.
    insert into point_transactions
      (family_id, user_id, amount, kind, reason, related_chore_id, actor_id)
    values
      (v_instance.family_id, v_instance.assignee_id, v_instance.points,
       'adjustment', '재체크: ' || v_instance.title,
       v_instance.id, p_actor_id);
  else
    -- First completion: normal chore_reward path.
    insert into point_transactions
      (family_id, user_id, amount, kind, reason, related_chore_id, actor_id)
    values
      (v_instance.family_id, v_instance.assignee_id, v_instance.points,
       'chore_reward', '집안일 완료: ' || v_instance.title,
       v_instance.id, p_actor_id);
  end if;

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

-- 1c. uncomplete_chore: reverse a completion via append-only adjustment and revert status.
create or replace function public.uncomplete_chore(p_instance_id uuid, p_actor_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_instance chore_instances%rowtype;
  v_actor users%rowtype;
  v_balance int;
  v_level int;
begin
  select * into v_instance from chore_instances where id = p_instance_id for update;
  if not found then
    raise exception 'CHORE_NOT_FOUND' using errcode = 'P0001';
  end if;

  select * into v_actor from users where id = p_actor_id;
  if not found or v_actor.family_id <> v_instance.family_id then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;
  if v_actor.role <> 'parent' and v_actor.id <> v_instance.assignee_id then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;

  if v_instance.status <> 'completed' then
    raise exception 'NOT_COMPLETED' using errcode = 'P0001';
  end if;

  -- Append reversing adjustment (I6 preserved)
  insert into point_transactions
    (family_id, user_id, amount, kind, reason, related_chore_id, actor_id)
  values
    (v_instance.family_id, v_instance.assignee_id, -v_instance.points,
     'adjustment', '취소: ' || v_instance.title, v_instance.id, p_actor_id);

  -- Revert status (trigger now permits this)
  update chore_instances
     set status = 'pending', completed_at = null
   where id = v_instance.id;

  select current_balance, level into v_balance, v_level
    from users where id = v_instance.assignee_id;

  return jsonb_build_object(
    'balance', v_balance,
    'level', v_level,
    'uncompleted', true
  );
end;
$$;

grant execute on function public.uncomplete_chore(uuid, uuid) to authenticated;
