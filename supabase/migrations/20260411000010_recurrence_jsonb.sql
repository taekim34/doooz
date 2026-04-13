-- Migration 10: recurrence text -> jsonb, ensure_today_instances rewrite
-- Spec §1 (#5), recurrence redesign (once / weekly).
set search_path = public, pg_temp;

alter table public.chore_templates add column if not exists recurrence_json jsonb;

update public.chore_templates set recurrence_json =
  case recurrence
    when 'daily'    then '{"kind":"weekly","days":[0,1,2,3,4,5,6]}'::jsonb
    when 'weekdays' then '{"kind":"weekly","days":[1,2,3,4,5]}'::jsonb
    when 'weekends' then '{"kind":"weekly","days":[0,6]}'::jsonb
    when 'once'     then jsonb_build_object('kind','once','due_date', coalesce(end_date, start_date))
    else case
      when recurrence like 'weekly:%' then
        jsonb_build_object('kind','weekly','days',
          (select coalesce(jsonb_agg(case tok
              when 'sun' then 0 when 'mon' then 1 when 'tue' then 2 when 'wed' then 3
              when 'thu' then 4 when 'fri' then 5 when 'sat' then 6 end), '[]'::jsonb)
             from regexp_split_to_table(substring(recurrence from 8), ',') as tok))
      else '{"kind":"weekly","days":[]}'::jsonb
    end
  end
where recurrence_json is null;

alter table public.chore_templates alter column recurrence_json set not null;
alter table public.chore_templates drop column recurrence;
alter table public.chore_templates rename column recurrence_json to recurrence;

-- Rewrite ensure_today_instances for jsonb recurrence, family-scoped.
-- Weekly instances use today's date; one-off instances use the jsonb due_date
-- (so the unique (template_id, assignee_id, due_date) index makes daily insertion idempotent).
create or replace function public.ensure_today_instances(p_user_id uuid, p_family_id uuid)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
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
  perform p_user_id; -- signature kept for backward compat
  select timezone into v_tz from public.families where id = p_family_id;
  if v_tz is null then return 0; end if;

  v_today := (now() at time zone v_tz)::date;
  v_dow   := extract(dow from (now() at time zone v_tz))::int; -- 0=Sun..6=Sat

  for t in
    select * from public.chore_templates
     where family_id = p_family_id
       and active = true
       and start_date <= v_today
       and (end_date is null or end_date >= v_today)
  loop
    v_kind := t.recurrence ->> 'kind';

    if v_kind = 'weekly' then
      v_days := t.recurrence -> 'days';
      if v_days is not null and v_days @> to_jsonb(v_dow) then
        insert into public.chore_instances
          (family_id, template_id, assignee_id, title, points, due_date)
        values
          (t.family_id, t.id, t.assignee_id, t.title, t.points, v_today)
        on conflict (template_id, assignee_id, due_date) do nothing;
        if found then v_count := v_count + 1; end if;
      end if;

    elsif v_kind = 'once' then
      v_due := (t.recurrence ->> 'due_date')::date;
      if v_due is not null and v_today <= v_due then
        insert into public.chore_instances
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
$function$;

grant execute on function public.ensure_today_instances(uuid, uuid) to authenticated;
