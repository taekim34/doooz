-- Add 'penalty' to task_instances status constraint
ALTER TABLE public.task_instances
  DROP CONSTRAINT task_instances_status_check,
  ADD CONSTRAINT task_instances_status_check
    CHECK (status = ANY (ARRAY[
      'pending'::text, 'completed'::text, 'pardoned'::text,
      'overdue'::text, 'requested'::text, 'rejected'::text,
      'penalty'::text
    ]));
