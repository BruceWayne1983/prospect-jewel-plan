
CREATE TABLE public.sales_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  report_type text NOT NULL DEFAULT 'other',
  report_date date,
  period_start date,
  period_end date,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL DEFAULT 0,
  file_type text,
  status text NOT NULL DEFAULT 'uploaded',
  ai_summary text,
  parsed_data jsonb DEFAULT '{}'::jsonb,
  tags text[] DEFAULT '{}'::text[],
  territory_total_cy numeric,
  territory_total_py1 numeric,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.sales_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reports" ON public.sales_reports FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reports" ON public.sales_reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reports" ON public.sales_reports FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reports" ON public.sales_reports FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_sales_reports_updated_at BEFORE UPDATE ON public.sales_reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
