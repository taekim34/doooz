-- Migration 11: add 'overdue' + 'pardoned' statuses, pardon_chore function
-- Spec §1 (#4).
set search_path = public, pg_temp;

alter table public.chore_instances
  drop constraint chore_instances_status_check,
  add  constraint chore_instances_status_check
    check (status in ('pending','completed','skipped','pardoned','overdue'));

-- Relax prevent_completed_chore_update — pending->pardoned and overdue->pardoned are allowed
-- (trigger still blocks snapshot mutations on already-completed rows).
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

-- pardon_chore: parent-only. If pardoning an 'overdue' instance that has a penalty row,
-- insert a compensating +50 adjustment (kind='adjustment', reason='pardon_reversal').
create or replace function public.pardon_chore(p_instance_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor public.users%rowtype;
  v_instance public.chore_instances%rowtype;
  v_had_penalty boolean;
begin
  select * into v_actor from public.users where id = (select auth.uid());
  if v_actor.id is null or v_actor.role <> 'parent' then
    raise exception 'FORBIDDEN: parent only' using errcode = '42501';
  end if;

  select * into v_instance from public.chore_instances where id = p_instance_id for update;
  if v_instance.id is null then
    raise exception 'NOT_FOUND: chore_instance' using errcode = 'P0002';
  end if;

  if v_instance.family_id <> v_actor.family_id then
    raise exception 'FORBIDDEN: cross-family' using errcode = '42501';
  end if;

  if v_instance.status not in ('pending','overdue') then
    raise exception 'INVALID_STATE: chore must be pending or overdue' using errcode = '22023';
  end if;

  if v_instance.status = 'overdue' then
    select exists(
      select 1 from public.point_transactions
       where related_chore_id = v_instance.id and kind = 'penalty'
    ) into v_had_penalty;

    if v_had_penalty then
      insert into public.point_transactions
        (family_id, user_id, amount, kind, reason, related_chore_id, actor_id)
      values
        (v_instance.family_id, v_instance.assignee_id, 50,
         'adjustment', 'pardon_reversal', v_instance.id, v_actor.id);
    end if;
  end if;

  update public.chore_instances
     set status = 'pardoned', completed_at = now()
   where id = p_instance_id;
end;
$$;

revoke all on function public.pardon_chore(uuid) from public;
grant  execute on function public.pardon_chore(uuid) to authenticated;
