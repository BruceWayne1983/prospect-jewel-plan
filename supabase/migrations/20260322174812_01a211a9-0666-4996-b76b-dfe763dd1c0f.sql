-- Temporary public read policies for testing without auth
CREATE POLICY "Public read discovered_prospects" ON public.discovered_prospects FOR SELECT USING (true);
CREATE POLICY "Public read retailers" ON public.retailers FOR SELECT USING (true);
CREATE POLICY "Public read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Public read calendar_events" ON public.calendar_events FOR SELECT USING (true);