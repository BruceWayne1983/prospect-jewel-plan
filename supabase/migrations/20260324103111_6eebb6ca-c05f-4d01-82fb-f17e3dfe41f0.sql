
-- Enhancement 2: Add billing columns to retailers
ALTER TABLE public.retailers 
  ADD COLUMN IF NOT EXISTS billing_2024_full_year decimal,
  ADD COLUMN IF NOT EXISTS billing_2025_full_year decimal,
  ADD COLUMN IF NOT EXISTS billing_2026_ytd decimal,
  ADD COLUMN IF NOT EXISTS billing_last_updated timestamp with time zone;

-- Enhancement 4: Add parent account linking
ALTER TABLE public.retailers 
  ADD COLUMN IF NOT EXISTS parent_account_id uuid REFERENCES public.retailers(id);

-- Enhancement 7: Add retention_risk to pipeline_stage enum
ALTER TYPE public.pipeline_stage ADD VALUE IF NOT EXISTS 'retention_risk';

-- Enhancement 5: Create journey_plans table
CREATE TABLE public.journey_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_name text NOT NULL,
  planned_date date,
  stops jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.journey_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own journey plans" ON public.journey_plans FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own journey plans" ON public.journey_plans FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own journey plans" ON public.journey_plans FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own journey plans" ON public.journey_plans FOR DELETE TO authenticated USING (auth.uid() = user_id);
