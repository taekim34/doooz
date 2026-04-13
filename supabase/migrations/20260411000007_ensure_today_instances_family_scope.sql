-- Fix: ensure_today_instances must create instances for the whole family,
-- not just the caller. Kept the function signature for backwards compat.

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
  v_dow_token text;
  v_count int := 0;
  t chore_templates%rowtype;
begin
  perform p_user_id;
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
      insert into chore_instances (family_id, template_id, assignee_id, title, points, due_date)
      values (t.family_id, t.id, t.assignee_id, t.title, t.points, v_today)
      on conflict (template_id, assignee_id, due_date) do nothing;
      if found then v_count := v_count + 1; end if;
    end if;
  end loop;
  return v_count;
end;
$function$;
