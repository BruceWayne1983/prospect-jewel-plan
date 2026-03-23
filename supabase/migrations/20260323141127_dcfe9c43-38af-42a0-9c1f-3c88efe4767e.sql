ALTER TABLE public.discovered_prospects ADD COLUMN IF NOT EXISTS phone text DEFAULT NULL;
ALTER TABLE public.discovered_prospects ADD COLUMN IF NOT EXISTS email text DEFAULT NULL;