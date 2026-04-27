## Two non-negotiable rules

1. **Every prospect must be a real, verifiable business.** No invented names, no AI-fabricated towns/contacts, no unverified rows allowed into the list.
2. **If a "prospect" is already a current account**, it must be removed from prospecting/research and the user must be told it's a stockist.

## Plan

### 1. Hard-enforce "real business only" in the Discovery engine

`supabase/functions/discover-prospects/index.ts` already uses Firecrawl, but we'll tighten it so nothing fabricated can leak through:

- **Reject any classified row missing a real source URL.** Drop rows where `src.url` is empty or fails URL parsing. (Currently only filtered for directory hosts.)
- **Domain sanity check**: require URL hostname to contain a TLD (`.co.uk`, `.com`, etc.) and not be a search/results page (`/search`, `?q=`, `/find/`).
- **Name = exactly the cleaned page title or hostname brand** — already enforced, but we'll also drop any name that is generic ("Home", "Welcome", "Contact", "Shop", "About Us", etc.) or shorter than 3 chars after cleaning.
- **Force `verification_status = 'web_verified'` only when the URL passes a HEAD/GET probe (200/301/302).** If the probe fails, the prospect is discarded — never saved as `unverified`.
- **Remove any fallback paths** that allow saving without a confirmed URL. If Firecrawl returns nothing, the function returns 0 prospects for that batch (no AI invention).
- **Discovery page filter**: change the default from "show all" to **only `web_verified` + `manually_verified`**. Remove the option for the user to even see legacy unverified rows from the main grid (they can be purged via the existing button).

### 2. Detect & block current-account duplicates at every layer

**Edge function (`discover-prospects`)** — already loads `existingRetailers`. Strengthen the matching:

- Replace exact-match dedup with **fuzzy match** on normalised name (lowercase, strip punctuation, strip "Ltd/Limited/Jewellers/The") AND same town OR same postcode area.
- If a Firecrawl result matches a current account → **never insert it as a prospect**. Instead, log it (return in the response under `matched_current_accounts: [{ name, town, retailer_id }]`) so the UI can tell Emma "We found *Smith & Co* but they're already a stockist — opening their account."
- Domain-level match: if the Firecrawl URL's root domain matches a current account's `website` domain → same outcome (skip + return as match).

**Discovery page (`src/pages/ProspectDiscovery.tsx`)**:

- Add a **toast/banner** after every scan listing any current-account matches found, with a "View account" link straight to `/retailer/:id`.
- For any pre-existing prospect rows that match a current account (legacy data), surface a per-card badge **"Already a current account"** with two buttons: **"Open account"** (navigate to retailer profile) and **"Remove from prospects"** (hard-delete the discovered_prospects row).
- Add a one-click bulk action **"Remove prospects that are current accounts"** at the top of the list — runs the same fuzzy match across all loaded prospects and deletes matches.

**Manual override on every prospect card**:

- Add a small **"Mark as current account"** action (next to Delete/Dismiss). It opens a tiny picker showing the closest-name retailers; selecting one deletes the prospect row and links it (no other state needed — the retailer already exists). 
- This handles cases where the fuzzy match misses (different trading name).

### 3. Prevent leakage in other research surfaces

The same fuzzy matcher will be exposed as a small util `src/utils/accountNames.ts` (file already exists) → add `findMatchingRetailer(name, town, retailers)` and reuse it in:

- `discover-prospects` edge function (above)
- `ProspectFinder.tsx` if it shows results from the same source
- `NearbyProspects.tsx` so a current account never appears as a "nearby prospect"

### 4. Quick UX confirmation

After a scan completes, the toast reads either:
- "Found N verified businesses." (real-only)
- "Found N verified businesses. M were already current accounts and have been linked." 
- "No verified businesses found — try a different county/category."

## Technical notes

**Files touched**
- `supabase/functions/discover-prospects/index.ts` — URL probe, stricter rejection, fuzzy current-account match, return `matched_current_accounts`.
- `src/utils/accountNames.ts` — add `findMatchingRetailer(name, town, retailers)` fuzzy helper (normalise + token overlap).
- `src/pages/ProspectDiscovery.tsx` — default filter `web_verified|manually_verified`, scan-result banner for current-account matches, per-card "Already a current account" badge + "Open account" / "Remove from prospects" actions, bulk "Remove prospects that are current accounts", "Mark as current account" picker.
- `src/components/retailer/NearbyProspects.tsx` — filter out anything matching a current account.

**No DB migrations required.** All changes use existing columns and RLS.

**No new secrets.** Firecrawl + Lovable AI keys already configured.

## What Emma will see after

- Discovery only ever shows businesses Firecrawl actually found and whose website responded — no invented shops.
- Any time the scanner stumbles onto an existing stockist, it's quietly linked to her current account instead of being shown as a prospect, and she gets a notice telling her so.
- She has a one-click button to clean up any legacy "prospect" rows that are really already her accounts, and a manual "Mark as current account" on every card for edge cases.
