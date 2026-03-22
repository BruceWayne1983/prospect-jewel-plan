-- Remove temporary public read policies
DROP POLICY IF EXISTS "Public read discovered_prospects" ON public.discovered_prospects;
DROP POLICY IF EXISTS "Public read retailers" ON public.retailers;
DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public read calendar_events" ON public.calendar_events;