-- Add contact_provenance to retailers and discovered_prospects.
-- Shape per field key (phone, email, address, postcode, instagram):
--   { "source": "website"|"google_maps"|"companies_house"|"manual"|"ai_inferred"|"unknown",
--     "verified_at": ISO8601 timestamp | null,
--     "verified_by": user_id | "system" | null,
--     "needs_review": boolean }

ALTER TABLE public.retailers
  ADD COLUMN IF NOT EXISTS contact_provenance jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.discovered_prospects
  ADD COLUMN IF NOT EXISTS contact_provenance jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Backfill: for any existing populated contact field, mark it as
-- { source: 'unknown', verified_at: null, verified_by: null, needs_review: true }.
-- Only overwrite empty provenance objects so the migration is idempotent.

UPDATE public.retailers
SET contact_provenance = COALESCE(
  CASE WHEN phone     IS NOT NULL AND phone     <> '' THEN jsonb_build_object('phone',     jsonb_build_object('source','unknown','verified_at',null,'verified_by',null,'needs_review',true)) ELSE '{}'::jsonb END
  ||
  CASE WHEN email     IS NOT NULL AND email     <> '' THEN jsonb_build_object('email',     jsonb_build_object('source','unknown','verified_at',null,'verified_by',null,'needs_review',true)) ELSE '{}'::jsonb END
  ||
  CASE WHEN address   IS NOT NULL AND address   <> '' THEN jsonb_build_object('address',   jsonb_build_object('source','unknown','verified_at',null,'verified_by',null,'needs_review',true)) ELSE '{}'::jsonb END
  ||
  CASE WHEN postcode  IS NOT NULL AND postcode  <> '' THEN jsonb_build_object('postcode',  jsonb_build_object('source','unknown','verified_at',null,'verified_by',null,'needs_review',true)) ELSE '{}'::jsonb END
  ||
  CASE WHEN instagram IS NOT NULL AND instagram <> '' THEN jsonb_build_object('instagram', jsonb_build_object('source','unknown','verified_at',null,'verified_by',null,'needs_review',true)) ELSE '{}'::jsonb END
, '{}'::jsonb)
WHERE contact_provenance = '{}'::jsonb
  AND (
    (phone IS NOT NULL AND phone <> '') OR
    (email IS NOT NULL AND email <> '') OR
    (address IS NOT NULL AND address <> '') OR
    (postcode IS NOT NULL AND postcode <> '') OR
    (instagram IS NOT NULL AND instagram <> '')
  );

UPDATE public.discovered_prospects
SET contact_provenance = COALESCE(
  CASE WHEN phone     IS NOT NULL AND phone     <> '' THEN jsonb_build_object('phone',     jsonb_build_object('source','unknown','verified_at',null,'verified_by',null,'needs_review',true)) ELSE '{}'::jsonb END
  ||
  CASE WHEN email     IS NOT NULL AND email     <> '' THEN jsonb_build_object('email',     jsonb_build_object('source','unknown','verified_at',null,'verified_by',null,'needs_review',true)) ELSE '{}'::jsonb END
  ||
  CASE WHEN address   IS NOT NULL AND address   <> '' THEN jsonb_build_object('address',   jsonb_build_object('source','unknown','verified_at',null,'verified_by',null,'needs_review',true)) ELSE '{}'::jsonb END
  ||
  CASE WHEN instagram IS NOT NULL AND instagram <> '' THEN jsonb_build_object('instagram', jsonb_build_object('source','unknown','verified_at',null,'verified_by',null,'needs_review',true)) ELSE '{}'::jsonb END
, '{}'::jsonb)
WHERE contact_provenance = '{}'::jsonb
  AND (
    (phone IS NOT NULL AND phone <> '') OR
    (email IS NOT NULL AND email <> '') OR
    (address IS NOT NULL AND address <> '') OR
    (instagram IS NOT NULL AND instagram <> '')
  );