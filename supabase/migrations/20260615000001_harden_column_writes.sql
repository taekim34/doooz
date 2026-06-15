-- Harden write protection that ROW-level RLS structurally misses.
--
-- Postgres RLS gates WHICH ROW an authenticated user may write, never WHICH
-- COLUMN. Combined with the default `GRANT ALL ... TO authenticated`, this left
-- sensitive columns and tables writable by any logged-in family member
-- (including children) despite "correct-looking" row policies. The real abuse
-- motive in a kids' point-gamification app is a child editing their own data.
--
-- Closes three holes found in a full sweep:
--   1. users  : a child's own session could UPDATE users SET role='parent'
--               (privilege escalation -> self-approve rewards, pardon own tasks)
--               or set current_balance / lifetime_earned / level directly
--               (point & level cheat). users_update_self gated the row, not the
--               columns.
--   2. families: families_update had no parent check -> a child could change
--               invite_code, name, timezone (shifts task rollover), locale.
--   3. user_badges: the INSERT policy let any member self-grant achievement
--               badges for themselves or siblings.

-- 1. users -------------------------------------------------------------------
-- Only profile columns stay client-writable. role, family_id, and the
-- trigger-computed ledger caches (current_balance, lifetime_earned, level) may
-- change ONLY via service_role (admin client) or the SECURITY DEFINER ledger
-- functions/triggers (update_user_point_cache, unpardon_task, ...). Those run as
-- the function owner, so this column GRANT does not affect point recomputation.
-- Applied defensively (grant only columns that exist) so this migration is valid
-- on BOTH main's schema and prod's: tone/color_mode were added on the unmerged
-- visual-redesign branch and are already live in prod, but are absent from main's
-- migration history. The existence check grants them where present (prod, and a
-- future merged main) and skips them where absent (current main) without error.
revoke update on public.users from authenticated, anon;
do $$
declare
  col text;
  writable text[] := array['display_name','character_id','birth_date','tone','color_mode'];
begin
  foreach col in array writable loop
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'users' and column_name = col
    ) then
      execute format('grant update (%I) on public.users to authenticated', col);
    end if;
  end loop;
end $$;

-- 2. families ----------------------------------------------------------------
-- Family settings are parent-only. The settings server action already enforces
-- role='parent'; this makes the database agree (defense in depth).
drop policy if exists "families_update" on public.families;
create policy "families_update" on public.families
  for update to authenticated
  using (id = public.auth_family_id() and public.auth_is_parent())
  with check (id = public.auth_family_id() and public.auth_is_parent());

-- 3. user_badges -------------------------------------------------------------
-- Badges are awarded only by evaluate_badges() (SECURITY DEFINER -> bypasses
-- RLS). No client code inserts badges (all app reads are SELECT), so removing
-- the self-grant INSERT policy closes the hole without breaking earning. The
-- SELECT policy is left intact.
drop policy if exists "user_badges_insert" on public.user_badges;
