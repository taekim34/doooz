ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS mode text NOT NULL DEFAULT 'light'
  CHECK (mode IN ('light', 'dark'));
