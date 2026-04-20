-- Add tone column to users table (warm/cool kid theme)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS tone text NOT NULL DEFAULT 'warm'
  CHECK (tone IN ('warm', 'cool'));
