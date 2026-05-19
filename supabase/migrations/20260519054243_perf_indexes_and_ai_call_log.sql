-- Performance & cost-control: composite indexes for the hot per-user queries,
-- plus an ai_call_log table that edge functions can write to so AI spend is
-- observable rather than a mystery.

-- ────────────────────────────────────────────────────────────────────────────
-- Composite indexes for the hottest per-user queries
-- ────────────────────────────────────────────────────────────────────────────

-- Dashboard "upcoming events" filters by user_id + completed + date.
-- Composite covers all three so the planner doesn't fall back to a bitmap
-- scan across the two single-column indexes.
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_completed_date
  ON public.calendar_events (user_id, completed, date);

-- Generic per-user calendar queries (week / month range).
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_date
  ON public.calendar_events (user_id, date);

-- ProspectFinder / Pipeline / Dashboard all filter prospects by
-- (user_id, status). Existing indexes are single-column on each.
CREATE INDEX IF NOT EXISTS idx_prospects_user_status
  ON public.discovered_prospects (user_id, status);

-- Retailer kanban needs (user_id, pipeline_stage) for column queries.
CREATE INDEX IF NOT EXISTS idx_retailers_user_stage
  ON public.retailers (user_id, pipeline_stage);

-- Time-range queries on activity_log (for the dashboard activity feed).
CREATE INDEX IF NOT EXISTS idx_activity_log_user_created
  ON public.activity_log (user_id, created_at DESC);


-- ────────────────────────────────────────────────────────────────────────────
-- AI call log — observability for Lovable / Firecrawl / Google Maps spend
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ai_call_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  function_name   text NOT NULL,
  provider        text NOT NULL,
  model           text,
  status          text NOT NULL DEFAULT 'success',  -- success | error | rate_limited | timeout
  duration_ms     integer,
  prompt_tokens   integer,
  completion_tokens integer,
  total_tokens    integer,
  error_message   text,
  retailer_id     uuid REFERENCES public.retailers(id) ON DELETE SET NULL,
  metadata        jsonb DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_call_log_user_created
  ON public.ai_call_log (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_call_log_function_created
  ON public.ai_call_log (function_name, created_at DESC);

-- RLS: each user reads their own rows; inserts come from edge functions
-- (service role bypasses RLS, so no INSERT policy needed).
ALTER TABLE public.ai_call_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read their own ai_call_log rows"
  ON public.ai_call_log
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.ai_call_log IS 'Per-call audit of outbound AI / scraping / mapping API spend. Edge functions insert one row per call so cost can be tracked, anomalies detected, and rate limits / errors investigated.';
