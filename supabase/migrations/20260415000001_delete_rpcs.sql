-- RPC: Atomically delete a non-admin member
-- Admin guard + NO ACTION FK cleanup + CASCADE delete in one transaction.
CREATE OR REPLACE FUNCTION public.delete_member(p_user_id uuid, p_family_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Admin guard: earliest parent cannot delete themselves via this RPC
  IF p_user_id = (
    SELECT id FROM users
    WHERE family_id = p_family_id AND role = 'parent'
    ORDER BY created_at ASC LIMIT 1
  ) THEN
    RAISE EXCEPTION 'IS_ADMIN';
  END IF;

  -- Nullify NO ACTION FK references
  UPDATE point_transactions SET actor_id = NULL WHERE actor_id = p_user_id;
  UPDATE reward_requests SET decided_by = NULL WHERE decided_by = p_user_id;
  DELETE FROM reward_requests WHERE requested_by = p_user_id;
  UPDATE rewards SET created_by = NULL WHERE created_by = p_user_id AND family_id = p_family_id;
  UPDATE task_templates SET created_by = NULL WHERE created_by = p_user_id AND family_id = p_family_id;

  -- Delete user row (CASCADE handles task_instances, user_badges, push_subscriptions, point_transactions by user_id)
  DELETE FROM users WHERE id = p_user_id AND family_id = p_family_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'USER_NOT_FOUND';
  END IF;
END;
$$;

-- RPC: Atomically delete an entire family (admin only)
-- Admin check + NO ACTION FK cleanup + CASCADE delete in one transaction.
-- Returns user IDs for auth cleanup.
CREATE OR REPLACE FUNCTION public.delete_family(p_family_id uuid, p_admin_id uuid)
RETURNS uuid[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_earliest_parent_id uuid;
  v_user_ids uuid[];
BEGIN
  -- Verify admin is the earliest parent
  SELECT id INTO v_earliest_parent_id
  FROM users
  WHERE family_id = p_family_id AND role = 'parent'
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_earliest_parent_id IS NULL OR v_earliest_parent_id != p_admin_id THEN
    RAISE EXCEPTION 'NOT_ADMIN';
  END IF;

  -- Collect user IDs for auth cleanup (returned to caller)
  SELECT array_agg(id) INTO v_user_ids FROM users WHERE family_id = p_family_id;

  -- Nullify NO ACTION FK references
  UPDATE point_transactions SET actor_id = NULL WHERE family_id = p_family_id;
  DELETE FROM reward_requests WHERE family_id = p_family_id;
  UPDATE rewards SET created_by = NULL WHERE family_id = p_family_id;
  UPDATE task_templates SET created_by = NULL WHERE family_id = p_family_id;

  -- Delete family row (CASCADE handles users, task_instances, point_transactions, rewards, family_rollover_log)
  DELETE FROM families WHERE id = p_family_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'FAMILY_NOT_FOUND';
  END IF;

  RETURN v_user_ids;
END;
$$;

-- Grant access
GRANT EXECUTE ON FUNCTION public.delete_member(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_family(uuid, uuid) TO service_role;
