CREATE TYPE public.verification_status AS ENUM ('unverified', 'web_verified', 'manually_verified', 'verified_fake');

ALTER TABLE public.discovered_prospects 
ADD COLUMN verification_status public.verification_status NOT NULL DEFAULT 'unverified',
ADD COLUMN verification_data jsonb DEFAULT '{}'::jsonb;