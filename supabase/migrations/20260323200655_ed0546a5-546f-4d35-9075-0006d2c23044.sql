
-- Table to store disqualification reasons for AI learning
CREATE TABLE public.disqualification_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  prospect_name text NOT NULL,
  prospect_town text NOT NULL,
  prospect_county text NOT NULL,
  prospect_category text,
  reason text NOT NULL DEFAULT 'not_fit',
  reason_detail text,
  patterns jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.disqualification_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own patterns" ON public.disqualification_patterns FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert patterns" ON public.disqualification_patterns FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own patterns" ON public.disqualification_patterns FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Add dismiss_reason to discovered_prospects
ALTER TABLE public.discovered_prospects ADD COLUMN IF NOT EXISTS dismiss_reason text;
