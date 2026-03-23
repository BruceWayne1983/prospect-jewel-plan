
-- Add store imagery, follower data, website traffic, and review enrichment to retailers
ALTER TABLE public.retailers
  ADD COLUMN IF NOT EXISTS store_images text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS follower_counts jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS estimated_monthly_traffic integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS google_review_summary text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS google_review_highlights jsonb DEFAULT '[]'::jsonb;

-- Add same columns to discovered_prospects
ALTER TABLE public.discovered_prospects
  ADD COLUMN IF NOT EXISTS store_images text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS follower_counts jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS estimated_monthly_traffic integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS google_review_summary text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS google_review_highlights jsonb DEFAULT '[]'::jsonb;
