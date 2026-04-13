-- Fix circular RLS on users table.
-- Users must be able to read their own row before any family-scoped policy can resolve.
-- Postgres ORs multiple SELECT policies, so adding a self-read policy unblocks the rest.

create policy users_select_self on public.users
  for select to authenticated
  using (id = (select auth.uid()));

-- Also need UPDATE self: allow a user to update their own row
-- (e.g. character selection, display name change). Previously blocked by
-- users_update policy which required reading family_id first (circular).
create policy users_update_self on public.users
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Comment: families_select, chore_*_select etc. will now work because
-- their inner subqueries `(select family_id from users where id = auth.uid())`
-- can finally resolve via the new users_select_self policy.
