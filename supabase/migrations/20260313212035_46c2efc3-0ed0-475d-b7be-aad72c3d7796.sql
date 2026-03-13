
-- Nomination Territory Planner - Full Schema

-- Enums
CREATE TYPE public.retailer_category AS ENUM ('jeweller', 'gift_shop', 'fashion_boutique', 'lifestyle_store', 'premium_accessories', 'concept_store');
CREATE TYPE public.pipeline_stage AS ENUM ('new_lead', 'research_needed', 'qualified', 'priority_outreach', 'contacted', 'follow_up_needed', 'meeting_booked', 'under_review', 'approved', 'rejected');
CREATE TYPE public.store_positioning AS ENUM ('premium', 'mid_market', 'budget');
CREATE TYPE public.prospect_status AS ENUM ('new', 'reviewing', 'accepted', 'dismissed');
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 1. Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  role_title TEXT DEFAULT 'Sales Agent',
  territory TEXT DEFAULT 'South West England',
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. User Roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 3. Retailers
CREATE TABLE public.retailers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  town TEXT NOT NULL,
  county TEXT NOT NULL,
  postcode TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  instagram TEXT,
  category retailer_category NOT NULL DEFAULT 'jeweller',
  is_independent BOOLEAN DEFAULT true,
  store_positioning store_positioning DEFAULT 'mid_market',
  rating NUMERIC(2,1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  fit_score INTEGER DEFAULT 0,
  commercial_health_score INTEGER DEFAULT 0,
  priority_score INTEGER DEFAULT 0,
  spend_potential_score INTEGER DEFAULT 0,
  pipeline_stage pipeline_stage NOT NULL DEFAULT 'new_lead',
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  ai_intelligence JSONB DEFAULT '{}',
  performance_prediction JSONB DEFAULT '{}',
  outreach JSONB DEFAULT '{}',
  activity JSONB DEFAULT '{}',
  qualification JSONB DEFAULT '{}',
  qualification_status TEXT DEFAULT 'unqualified',
  competitor_brands JSONB DEFAULT '[]',
  risk_flags TEXT[] DEFAULT '{}',
  ai_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.retailers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own retailers" ON public.retailers FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert retailers" ON public.retailers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own retailers" ON public.retailers FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own retailers" ON public.retailers FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_retailers_updated_at BEFORE UPDATE ON public.retailers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_retailers_user ON public.retailers(user_id);
CREATE INDEX idx_retailers_pipeline ON public.retailers(pipeline_stage);
CREATE INDEX idx_retailers_county ON public.retailers(county);

-- 4. Discovered Prospects
CREATE TABLE public.discovered_prospects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  town TEXT NOT NULL,
  county TEXT NOT NULL,
  category retailer_category NOT NULL DEFAULT 'jeweller',
  rating NUMERIC(2,1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  estimated_store_quality INTEGER DEFAULT 50,
  estimated_price_positioning store_positioning DEFAULT 'mid_market',
  predicted_fit_score INTEGER DEFAULT 50,
  discovery_source TEXT DEFAULT 'AI Scanner',
  discovered_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  status prospect_status NOT NULL DEFAULT 'new',
  ai_reason TEXT,
  website TEXT,
  address TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  raw_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.discovered_prospects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own prospects" ON public.discovered_prospects FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert prospects" ON public.discovered_prospects FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own prospects" ON public.discovered_prospects FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own prospects" ON public.discovered_prospects FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_discovered_prospects_updated_at BEFORE UPDATE ON public.discovered_prospects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_prospects_user ON public.discovered_prospects(user_id);
CREATE INDEX idx_prospects_status ON public.discovered_prospects(status);

-- 5. Activity Log
CREATE TABLE public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  retailer_id UUID REFERENCES public.retailers(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own activity" ON public.activity_log FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert activity" ON public.activity_log FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_activity_user ON public.activity_log(user_id);
CREATE INDEX idx_activity_retailer ON public.activity_log(retailer_id);
