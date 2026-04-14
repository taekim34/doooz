-- Allow created_by to be NULL for rewards and task_templates
-- Needed when the creating user is deleted (member hard delete)
ALTER TABLE rewards ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE task_templates ALTER COLUMN created_by DROP NOT NULL;
