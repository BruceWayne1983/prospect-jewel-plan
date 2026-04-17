ALTER TABLE public.sales_reports ADD COLUMN IF NOT EXISTS error_detail text;
ALTER TABLE public.uploaded_files ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'analysed';
ALTER TABLE public.uploaded_files ADD COLUMN IF NOT EXISTS error_detail text;