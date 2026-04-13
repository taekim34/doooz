-- Reverse a pardon: pardoned → pending (parent only).
-- If the pardon had reversed a penalty (+50 adjustment), re-apply the penalty (-50).
create or replace function unpardon_chore(p_instance_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_inst record;
  v_caller_id uuid := (select auth.uid());
  v_caller_role text;
  v_had_reversal boolean;
begin
  select role into v_caller_role
    from users
    where id = v_caller_id;
  if v_caller_role is null or v_caller_role <> 'parent' then
    raise exception 'FORBIDDEN: parent only';
  end if;

  select id, family_id, assignee_id, status
    into v_inst
    from chore_instances
    where id = p_instance_id;
  if not found then
    raise exception 'NOT_FOUND';
  end if;

  if v_inst.family_id <> (select family_id from users where id = v_caller_id) then
    raise exception 'FORBIDDEN: wrong family';
  end if;

  if v_inst.status <> 'pardoned' then
    raise exception 'INVALID_STATE: not pardoned';
  end if;

  select exists(
    select 1 from point_transactions
    where related_chore_id = p_instance_id
      and kind = 'adjustment'
      and reason = 'pardon_reversal'
  ) into v_had_reversal;

  if v_had_reversal then
    insert into point_transactions (family_id, user_id, amount, kind, reason, related_chore_id, actor_id)
    values (v_inst.family_id, v_inst.assignee_id, -50, 'penalty', 'unpardon_penalty', p_instance_id, v_caller_id);

    delete from point_transactions
    where related_chore_id = p_instance_id
      and kind = 'adjustment'
      and reason = 'pardon_reversal';

    update users set current_balance = (
      select coalesce(sum(amount), 0) from point_transactions where user_id = v_inst.assignee_id
    ) where id = v_inst.assignee_id;
  end if;

  update chore_instances
    set status = 'pending', completed_at = null
    where id = p_instance_id;
end;
$$;

grant execute on function unpardon_chore(uuid) to authenticated;
