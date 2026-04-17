-- =============================================================
-- Delete a test family and all associated data
-- =============================================================
-- Usage: Replace 'TARGET_FAMILY_NAME' with the family name to delete.
--        Run via Supabase SQL Editor or MCP execute_sql.
--
-- Safety: Wrapped in a transaction. Prints summary before COMMIT.
--         Change COMMIT to ROLLBACK to dry-run.
--
-- Deletion order (respects FK constraints):
--   1. user_badges        (user_id → users)
--   2. point_transactions  (user_id → users)
--   3. task_instances      (template_id → task_templates)
--   4. task_templates      (family_id → families)
--   5. reward_requests     (family_id → families)
--   6. rewards             (family_id → families)
--   7. push_subscriptions  (user_id → users)
--   8. family_rollover_log (family_id → families)
--   9. users               (family_id → families)
--  10. families            (id)
--  11. auth.users          (id)
-- =============================================================

BEGIN;

-- >>> SET TARGET HERE <<<
DO $$
DECLARE
  v_family_name TEXT := 'TARGET_FAMILY_NAME';  -- <-- change this
  v_family_id   UUID;
  v_user_ids    UUID[];
  v_count       INT;
BEGIN
  -- Resolve family
  SELECT id INTO v_family_id FROM families WHERE name = v_family_name;
  IF v_family_id IS NULL THEN
    RAISE EXCEPTION 'Family "%" not found', v_family_name;
  END IF;

  -- Collect user IDs
  SELECT array_agg(id) INTO v_user_ids FROM users WHERE family_id = v_family_id;
  IF v_user_ids IS NULL THEN
    v_user_ids := '{}';
  END IF;

  RAISE NOTICE '=== Deleting family: % (%) ===', v_family_name, v_family_id;
  RAISE NOTICE 'Users to delete: %', v_user_ids;

  -- 1. user_badges
  DELETE FROM user_badges WHERE user_id = ANY(v_user_ids);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'user_badges: % rows deleted', v_count;

  -- 2. point_transactions
  DELETE FROM point_transactions WHERE user_id = ANY(v_user_ids);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'point_transactions: % rows deleted', v_count;

  -- 3. task_instances (via task_templates)
  DELETE FROM task_instances WHERE template_id IN (
    SELECT id FROM task_templates WHERE family_id = v_family_id
  );
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'task_instances: % rows deleted', v_count;

  -- 4. task_templates
  DELETE FROM task_templates WHERE family_id = v_family_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'task_templates: % rows deleted', v_count;

  -- 5. reward_requests
  DELETE FROM reward_requests WHERE family_id = v_family_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'reward_requests: % rows deleted', v_count;

  -- 6. rewards
  DELETE FROM rewards WHERE family_id = v_family_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'rewards: % rows deleted', v_count;

  -- 7. push_subscriptions
  DELETE FROM push_subscriptions WHERE user_id = ANY(v_user_ids);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'push_subscriptions: % rows deleted', v_count;

  -- 8. family_rollover_log
  DELETE FROM family_rollover_log WHERE family_id = v_family_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'family_rollover_log: % rows deleted', v_count;

  -- 9. users
  DELETE FROM users WHERE family_id = v_family_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'users: % rows deleted', v_count;

  -- 10. families
  DELETE FROM families WHERE id = v_family_id;
  RAISE NOTICE 'families: 1 row deleted';

  -- 11. auth.users
  DELETE FROM auth.users WHERE id = ANY(v_user_ids);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'auth.users: % rows deleted', v_count;

  RAISE NOTICE '=== Done. Review output above. ===';
END $$;

-- >>> CHANGE TO ROLLBACK FOR DRY-RUN <<<
COMMIT;
