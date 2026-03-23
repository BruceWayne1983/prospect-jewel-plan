
-- Retail locations: retail parks, shopping centres, high streets, garden centres
CREATE TABLE public.retail_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  location_type text NOT NULL DEFAULT 'shopping_centre',
  town text NOT NULL,
  county text NOT NULL,
  address text,
  postcode text,
  lat double precision,
  lng double precision,
  footfall_estimate text,
  tenant_count integer,
  key_tenants text[] DEFAULT '{}'::text[],
  has_jewellery_stores boolean DEFAULT false,
  has_gift_stores boolean DEFAULT false,
  has_fashion_boutiques boolean DEFAULT false,
  opportunity_notes text,
  ai_summary text,
  website text,
  scraped_data jsonb DEFAULT '{}'::jsonb,
  discovery_source text DEFAULT 'manual',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, name, town)
);

ALTER TABLE public.retail_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own retail locations" ON public.retail_locations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert retail locations" ON public.retail_locations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own retail locations" ON public.retail_locations FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own retail locations" ON public.retail_locations FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Add location_type field to retailers for quick reference
ALTER TABLE public.retailers ADD COLUMN IF NOT EXISTS location_context text;
ALTER TABLE public.retailers ADD COLUMN IF NOT EXISTS retail_location_id uuid REFERENCES public.retail_locations(id) ON DELETE SET NULL;

-- Add to discovered_prospects too
ALTER TABLE public.discovered_prospects ADD COLUMN IF NOT EXISTS location_context text;
