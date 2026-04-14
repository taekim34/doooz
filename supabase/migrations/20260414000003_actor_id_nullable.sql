-- Allow actor_id to be NULL in point_transactions.
-- When a user is hard-deleted, their actor_id references are set to NULL
-- rather than blocking the deletion (NO ACTION FK).
ALTER TABLE point_transactions ALTER COLUMN actor_id DROP NOT NULL;
