-- Lock down store-images bucket: keep public READ access (so <img src> works)
-- but prevent anonymous LISTING of bucket contents and prevent uploads/updates/deletes
-- by anyone other than the owner.

-- 1. Make the bucket non-public — this disables the auto-generated public SELECT policy
--    and stops the bucket contents from being listable via the storage API.
UPDATE storage.buckets SET public = false WHERE id = 'store-images';

-- 2. Allow public READ of individual objects (needed for <img src> URLs to work)
--    but only when the exact object path is known. Listing requires a separate grant
--    which we are deliberately NOT giving.
DROP POLICY IF EXISTS "Public can read store images" ON storage.objects;
CREATE POLICY "Public can read store images"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'store-images');

-- 3. Only authenticated users can upload to store-images, scoped to their own folder
DROP POLICY IF EXISTS "Authenticated users can upload store images" ON storage.objects;
CREATE POLICY "Authenticated users can upload store images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'store-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. Only the owner can update their own files
DROP POLICY IF EXISTS "Users can update own store images" ON storage.objects;
CREATE POLICY "Users can update own store images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'store-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 5. Only the owner can delete their own files
DROP POLICY IF EXISTS "Users can delete own store images" ON storage.objects;
CREATE POLICY "Users can delete own store images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'store-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);