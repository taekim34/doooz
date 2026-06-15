-- PostgREST 14+ parses 'mode' as the PostgreSQL ordered-set aggregate function.
ALTER TABLE public.users RENAME COLUMN mode TO color_mode;
