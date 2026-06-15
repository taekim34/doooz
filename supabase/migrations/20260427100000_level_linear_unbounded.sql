-- Level system: linear after L9 (delta 5000), unbounded.
--
-- L1..L9 keep the original gentle curve. From L10 onwards, every 5,000 lifetime
-- points is one level. Titles (i18n) stay capped at title_30 (=1,000,000pt) but
-- level numbers continue to climb forever.
--
-- Mirrors src/lib/level.ts — change both or neither.

create or replace function public.calculate_level(lifetime bigint)
returns integer
language plpgsql
immutable
security definer
set search_path to 'public'
as $$
declare
  table_thresholds int[] := array[
    0,      -- L1
    150,    -- L2
    400,    -- L3
    800,    -- L4
    1500,   -- L5
    2500,   -- L6
    4500,   -- L7
    7000,   -- L8
    10000   -- L9
  ];
  anchor_level constant int := 9;
  anchor_lifetime constant bigint := 10000;
  linear_delta constant bigint := 5000;
  lvl int := 1;
begin
  if lifetime is null or lifetime < 0 then
    return 1;
  end if;

  if lifetime >= anchor_lifetime then
    return anchor_level + ((lifetime - anchor_lifetime) / linear_delta)::int;
  end if;

  for i in 1..array_length(table_thresholds, 1) loop
    if lifetime >= table_thresholds[i] then
      lvl := i;
    else
      exit;
    end if;
  end loop;
  return lvl;
end;
$$;

-- Recompute cached level for everyone (no rows currently exceed L9, so no-op
-- for now; safe to run regardless and avoids drift after future point gains).
update public.users
set level = public.calculate_level(lifetime_earned)
where level <> public.calculate_level(lifetime_earned);
