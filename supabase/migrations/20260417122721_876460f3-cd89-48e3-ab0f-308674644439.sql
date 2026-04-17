-- 1. Profiles: restrict reads to owner only (was USING (true), exposing phone numbers)
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 2. store-images bucket: drop any public/anon SELECT policies; require authenticated owner
DROP POLICY IF EXISTS "Anyone can view store images" ON storage.objects;
DROP POLICY IF EXISTS "Public can read store images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view store images" ON storage.objects;

CREATE POLICY "Authenticated users can view own store images"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'store-images'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );

-- 3. brand-assets bucket: enforce folder ownership on uploads
DROP POLICY IF EXISTS "Auth users can upload brand assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload brand assets" ON storage.objects;

CREATE POLICY "Users can upload to own brand assets folder"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'brand-assets'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );

-- Also tighten read/update/delete on brand-assets to owner-only for consistency
DROP POLICY IF EXISTS "Auth users can view brand assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view brand assets" ON storage.objects;

CREATE POLICY "Users can view own brand assets folder"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'brand-assets'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );

DROP POLICY IF EXISTS "Auth users can update brand assets" ON storage.objects;
CREATE POLICY "Users can update own brand assets folder"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'brand-assets'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );

DROP POLICY IF EXISTS "Auth users can delete brand assets" ON storage.objects;
CREATE POLICY "Users can delete own brand assets folder"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'brand-assets'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );