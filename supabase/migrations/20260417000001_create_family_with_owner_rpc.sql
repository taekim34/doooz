-- Atomic family + owner creation RPC
-- Solves RLS chicken-and-egg: families_select requires auth_family_id()
-- which needs a users row that doesn't exist yet during family creation.
CREATE OR REPLACE FUNCTION create_family_with_owner(
  p_name TEXT,
  p_timezone TEXT,
  p_locale TEXT,
  p_invite_code TEXT,
  p_display_name TEXT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_family_id UUID;
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Idempotency: if user already has a row, return their family_id
  SELECT family_id INTO v_family_id FROM users WHERE id = v_uid;
  IF v_family_id IS NOT NULL THEN
    RETURN v_family_id;
  END IF;

  INSERT INTO families (name, timezone, locale, invite_code)
  VALUES (p_name, p_timezone, p_locale, p_invite_code)
  RETURNING id INTO v_family_id;

  INSERT INTO users (id, family_id, role, display_name)
  VALUES (v_uid, v_family_id, 'parent', p_display_name);

  RETURN v_family_id;
END;
$$;
