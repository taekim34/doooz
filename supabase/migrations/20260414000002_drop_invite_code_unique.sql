-- Remove UNIQUE constraint on invite_code.
-- invite_code is a family "password" for joining, not a global identifier.
-- Family name (already UNIQUE) + invite_code combination is sufficient for authentication.
-- Having UNIQUE on invite_code leaks information: attackers can probe whether a code exists.
ALTER TABLE families DROP CONSTRAINT IF EXISTS families_invite_code_key;
