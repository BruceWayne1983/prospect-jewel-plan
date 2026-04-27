UPDATE public.discovered_prospects SET
  ai_reason = NULL,
  google_review_summary = NULL,
  google_review_highlights = '[]'::jsonb,
  location_context = NULL,
  estimated_monthly_traffic = NULL,
  follower_counts = '{}'::jsonb;

UPDATE public.retailers SET
  ai_notes = NULL,
  google_review_summary = NULL,
  google_review_highlights = '[]'::jsonb,
  location_context = NULL,
  estimated_monthly_traffic = NULL,
  follower_counts = '{}'::jsonb,
  ai_intelligence = '{}'::jsonb
WHERE pipeline_stage IN ('new_lead','research_needed','qualified');