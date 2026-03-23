
-- Create a public storage bucket for store images
INSERT INTO storage.buckets (id, name, public)
VALUES ('store-images', 'store-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload store images
CREATE POLICY "Authenticated users can upload store images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'store-images');

-- Allow anyone to view store images (public bucket)
CREATE POLICY "Anyone can view store images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'store-images');

-- Allow authenticated users to delete their own store images
CREATE POLICY "Authenticated users can delete store images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'store-images' AND (storage.foldername(name))[1] = auth.uid()::text);
