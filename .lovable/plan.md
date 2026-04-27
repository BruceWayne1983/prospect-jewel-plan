# Verified-Data-Only Prospect Policy

## Goal
Prospect records and the prospect UI must contain **only high-level verified data** sourced from real signals (Google Maps listing, website scrape, Companies House, postcode validators, social handles found verbatim). All AI-generated narrative — fit reasons, review summaries, traffic estimates, store-quality guesses, qualitative location context — is removed.

## What counts as "verified" (kept)
- Name, address, town, county, postcode (from Google Places / Maps result)
- Lat / lng (from Maps)
- Phone, email, website (only when scraped verbatim from the official site or Maps listing — already enforced by `contact-verification-provenance`)
- Social handles (only when found verbatim on the site)
- Google rating + review count (numeric, from Maps)
- Companies House registration data
- Identity Score + 8 cross-validation check results (deterministic)
- Verification status badge

## What counts as "AI-generated" (removed)
- `ai_reason` — AI's free-text fit explanation
- `google_review_summary` + `google_review_highlights` — AI summarisation of reviews
- `location_context` — AI narrative about the town
- `estimated_monthly_traffic` — AI guess
- `follower_counts` — AI guess (not scraped)
- `estimated_store_quality` — AI guess (0–95 number)
- `estimated_price_positioning` — AI guess
- `ai_notes`, `ai_intelligence` blobs on the retailer record

## Changes

### 1. Discovery edge functions — stop generating these fields
Files: `discover-prospects`, `discover-web`, `discover-by-brand`, `discover-locations`, `search-store`

- Remove from AI tool schemas: `ai_reason`, `estimated_store_quality`, `estimated_price_positioning`, `google_review_summary`, `google_review_highlights`, `location_context`, `estimated_monthly_traffic`, `follower_counts`.
- Replace `predicted_fit_score` calculation: instead of weighting AI's `estimated_store_quality`, derive a deterministic score from verified inputs only:
  - Google rating (0–5) → 30 pts
  - Review count bands (10/50/200+) → 20 pts
  - Has website (verified) → 15 pts
  - Has verified phone OR email → 15 pts
  - Independent (Companies House / not chain) → 10 pts
  - Category alignment (jeweller/gift/fashion) → 10 pts
- Insert prospects with the AI-narrative columns set to `null` / `[]` / `{}`.

### 2. Promote-to-retailer flow (`ProspectDiscovery.tsx`, `ProspectProfile.tsx`)
- Stop copying `ai_reason → ai_notes`.
- Stop copying `google_review_summary`, `google_review_highlights`, `estimated_monthly_traffic`, `follower_counts`, `location_context` onto the new retailer row. Pass `null` / empty.

### 3. Prospect UI — remove narrative blocks
`src/pages/ProspectDiscovery.tsx` (list cards) and `src/pages/ProspectProfile.tsx`:
- Remove the "AI Reason" / italic narrative card.
- Remove the Google review summary + highlights block.
- Remove the follower-count badges and the `~X/mo visitors` traffic badge.
- Remove the location-context paragraph.
- Keep: Identity Confidence Panel, verified contact rows (with provenance badges), rating/review-count chip, address, Companies House info, deterministic fit score with its factor breakdown.

### 4. Database hygiene (one-time backfill migration)
On `discovered_prospects` and `retailers`, null out the AI-narrative columns for existing rows so the UI is consistent immediately:
```sql
UPDATE discovered_prospects SET
  ai_reason = NULL,
  google_review_summary = NULL,
  google_review_highlights = '[]'::jsonb,
  location_context = NULL,
  estimated_monthly_traffic = NULL,
  follower_counts = '{}'::jsonb;

UPDATE retailers SET
  ai_notes = NULL,
  google_review_summary = NULL,
  google_review_highlights = '[]'::jsonb,
  location_context = NULL,
  estimated_monthly_traffic = NULL,
  follower_counts = '{}'::jsonb,
  ai_intelligence = '{}'::jsonb
WHERE pipeline_stage IN ('new_lead','researching','qualifying');
```
(Columns themselves are kept — AI summaries on **approved retailers** for briefings/pitches are still allowed; this only blanks unverified prospect-stage rows.)

### 5. Memory update
Save a new constraint memory: `mem://features/no-ai-prospect-details` — "Prospect records show verified facts only. No AI narrative, review summaries, traffic estimates, store-quality guesses, or fit prose. Fit score is deterministic from rating, reviews, verified contacts, independence, category."

## Out of scope
- AI use elsewhere (Pre-visit briefings, pitch personaliser, follow-up drafter, voice-to-CRM) — these run on **approved current accounts** with verified data, and remain unchanged.
- Identity cross-validation pipeline — already deterministic, stays as-is.

## Files touched
- `supabase/functions/discover-prospects/index.ts`
- `supabase/functions/discover-web/index.ts`
- `supabase/functions/discover-by-brand/index.ts`
- `supabase/functions/discover-locations/index.ts`
- `supabase/functions/search-store/index.ts`
- `src/pages/ProspectDiscovery.tsx`
- `src/pages/ProspectProfile.tsx`
- New migration: blank AI-narrative columns on prospect rows
- New memory file
