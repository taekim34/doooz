-- =============================================================
-- Family count + 10 most recently joined families
-- =============================================================
-- Usage: Run via Supabase SQL Editor or MCP execute_sql.
-- Read-only. Safe to run anytime.
-- =============================================================

-- 1. Total family count
SELECT COUNT(*) AS total_families FROM families;

-- 2. 10 most recently joined families (with member count)
SELECT
  f.id,
  f.name,
  f.locale,
  f.timezone,
  f.created_at,
  COALESCE(u.member_count, 0) AS members
FROM families f
LEFT JOIN (
  SELECT family_id, COUNT(*) AS member_count
  FROM users
  GROUP BY family_id
) u ON u.family_id = f.id
ORDER BY f.created_at DESC
LIMIT 10;
