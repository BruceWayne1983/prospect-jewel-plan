
-- Brand assets table for Nomination brand materials
CREATE TABLE public.brand_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL DEFAULT 0,
  file_type text,
  category text NOT NULL DEFAULT 'general',
  description text,
  ai_summary text,
  ai_extracted_data jsonb DEFAULT '{}'::jsonb,
  tags text[] DEFAULT '{}'::text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.brand_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own brand assets" ON public.brand_assets FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert brand assets" ON public.brand_assets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own brand assets" ON public.brand_assets FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own brand assets" ON public.brand_assets FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Storage bucket for brand assets
INSERT INTO storage.buckets (id, name, public) VALUES ('brand-assets', 'brand-assets', false) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Auth users can upload brand assets" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'brand-assets');
CREATE POLICY "Auth users can view own brand assets" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'brand-assets' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Auth users can delete own brand assets" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'brand-assets' AND (storage.foldername(name))[1] = auth.uid()::text);
