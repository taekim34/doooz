-- RLS infinite recursion fix via SECURITY DEFINER helper
-- Applied 2026-04-11 via Supabase MCP. See docs/superpowers/specs.

create or replace function public.auth_family_id()
returns uuid language sql stable security definer
set search_path = public, pg_temp
as $$ select family_id from public.users where id = auth.uid(); $$;

revoke all on function public.auth_family_id() from public;
grant execute on function public.auth_family_id() to authenticated;

-- users
drop policy if exists users_select on public.users;
create policy users_select on public.users for select to authenticated
  using (family_id = public.auth_family_id());
drop policy if exists users_update on public.users;
create policy users_update on public.users for update to authenticated
  using (family_id = public.auth_family_id()) with check (family_id = public.auth_family_id());
drop policy if exists users_delete on public.users;
create policy users_delete on public.users for delete to authenticated
  using (family_id = public.auth_family_id());

-- families
drop policy if exists families_select on public.families;
create policy families_select on public.families for select to authenticated
  using (id = public.auth_family_id());
drop policy if exists families_update on public.families;
create policy families_update on public.families for update to authenticated
  using (id = public.auth_family_id()) with check (id = public.auth_family_id());

-- chore_templates, chore_instances, point_transactions, rewards, goals
do $$
declare t text;
begin
  foreach t in array array['chore_templates','chore_instances','rewards','goals'] loop
    execute format('drop policy if exists %1$I_select on public.%1$I', t);
    execute format('create policy %1$I_select on public.%1$I for select to authenticated using (family_id = public.auth_family_id())', t);
    execute format('drop policy if exists %1$I_insert on public.%1$I', t);
    execute format('create policy %1$I_insert on public.%1$I for insert to authenticated with check (family_id = public.auth_family_id())', t);
    execute format('drop policy if exists %1$I_update on public.%1$I', t);
    execute format('create policy %1$I_update on public.%1$I for update to authenticated using (family_id = public.auth_family_id()) with check (family_id = public.auth_family_id())', t);
    execute format('drop policy if exists %1$I_delete on public.%1$I', t);
    execute format('create policy %1$I_delete on public.%1$I for delete to authenticated using (family_id = public.auth_family_id())', t);
  end loop;
end $$;

drop policy if exists point_transactions_select on public.point_transactions;
create policy point_transactions_select on public.point_transactions for select to authenticated
  using (family_id = public.auth_family_id());
drop policy if exists point_transactions_insert on public.point_transactions;
create policy point_transactions_insert on public.point_transactions for insert to authenticated
  with check (family_id = public.auth_family_id());

-- user_badges (scoped by user_id)
drop policy if exists user_badges_select on public.user_badges;
create policy user_badges_select on public.user_badges for select to authenticated
  using (user_id in (select id from public.users where family_id = public.auth_family_id()));
drop policy if exists user_badges_insert on public.user_badges;
create policy user_badges_insert on public.user_badges for insert to authenticated
  with check (user_id in (select id from public.users where family_id = public.auth_family_id()));
drop policy if exists user_badges_delete on public.user_badges;
create policy user_badges_delete on public.user_badges for delete to authenticated
  using (user_id in (select id from public.users where family_id = public.auth_family_id()));
