## Issues to fix

1. **AI is generating fake/imagined businesses** — the `discover-prospects` edge function uses Gemini to invent shop names from training data. Even with the "no contact details" rule, the names themselves are often fabricated. We need to switch to a verified-only discovery flow.
2. **Journey Planner has no Google Maps handoff** — Emma can build a route but can't push it to her phone for navigation.
3. **No way to remove a stop from the Journey Planner once added** — `removeAccountFromRoute` exists for the custom route builder, but stops on AI-clustered routes can't be removed.
4. **No way to permanently delete a prospect** — only "dismiss" exists, which keeps it in the list (just hidden under the Dismissed filter).

## Plan

### 1. Stop AI from inventing businesses (Discovery Engine)

Switch `supabase/functions/discover-prospects` from "AI invents names" to "AI uses Firecrawl to discover real ones":

- Replace the pure-Gemini name generation with a **Firecrawl-backed discovery pipeline**:
  - Use Firecrawl search/scrape against Google Maps, Yell, and high-street directory pages for the chosen `{county, category}`.
  - Pass the scraped results (real shop names + URLs) to Gemini only for **classification, scoring, and ai_reason** — never for generating the name, town, or contact details.
- If Firecrawl returns no results for a category/county, return zero prospects for that batch (do NOT fall back to invented data).
- Mark every saved prospect as `discovery_source: 'Firecrawl + AI'` and `verification_status: 'web_verified'` when Firecrawl confirms a website domain; otherwise keep `unverified`.
- Update the Discovery page filter so the **default view shows only `web_verified` or `manually_verified`** prospects, with a toggle to "Show unverified (legacy)" for the existing pre-fix data.
- Add a one-click **"Purge unverified legacy prospects"** button on the Discovery page (uses the existing delete RLS) so Emma can clear out previously generated AI rows in one go.

### 2. Journey Planner → Google Maps export

Add a **"Open in Google Maps"** button to the active route detail panel (`src/pages/JourneyPlanner.tsx`):

- Build a Google Maps Directions URL of the form:
  ```
  https://www.google.com/maps/dir/?api=1
    &origin={home.lat},{home.lng}
    &destination={home.lat},{home.lng}
    &waypoints={stop1.lat,stop1.lng}|{stop2.lat,stop2.lng}|...
    &travelmode=driving
  ```
- Stops are taken from `activeRoute.clusters` flat-mapped to retailers (in displayed order), filtered to those with `lat` & `lng`.
- Google Maps caps waypoints at ~9; if a route has more, split into sequential "Leg 1 / Leg 2" links.
- Button opens in a new tab — works on desktop (full Maps) and on mobile (deep-links into the Google Maps app).
- Also add a smaller **"Copy Apple Maps link"** as a secondary option for Emma's iPhone (`maps://?saddr=...&daddr=...`).

### 3. Remove stops from any route

Currently only the custom "Build a Route" panel supports removing accounts. We'll extend this so **every stop in the active route detail view has a remove (✕) button**:

- Track removed stop IDs in component state (`removedStopIds: Set<string>`, persisted in `localStorage` per route name).
- Filter `cluster.retailers` through this set before rendering and before building the Google Maps URL.
- Show a "Restore removed stops" link at the bottom of the route when any are hidden.

### 4. Hard-delete prospects from Discovery

Add a **"Delete permanently"** action alongside the existing Dismiss button on each prospect card in `src/pages/ProspectDiscovery.tsx`:

- Confirms via a small dialog ("Permanently delete {name}? This cannot be undone.").
- Calls `supabase.from("discovered_prospects").delete().eq("id", p.id)` (RLS already allows owner delete).
- Optionally inserts a `disqualification_pattern` row so the AI learns from it (same as Dismiss), but only if the user ticks "Teach AI to avoid similar".
- Removes the row from local state immediately.

### 5. Quick fix: leaflet runtime error

The console is throwing `Cannot read properties of undefined (reading '_leaflet_pos')` from the Territory map. This is the known react-leaflet teardown race when the map unmounts during a resize. We'll wrap the map container in a `key={routeKey}` so it remounts cleanly when the parent route changes, instead of trying to update an unmounted instance.

## Technical notes

- **Firecrawl secret** is already configured (`FIRECRAWL_API_KEY` is in the secrets list — managed by the connector). No new secrets needed.
- **No DB migrations required** — `verification_status` already supports `web_verified` / `manually_verified`, and delete RLS is already in place on `discovered_prospects`.
- **No new dependencies** — Google Maps export is a plain URL builder.
- **Files touched**:
  - `supabase/functions/discover-prospects/index.ts` (rewrite to Firecrawl-led)
  - `src/pages/ProspectDiscovery.tsx` (default filter, purge button, delete action)
  - `src/pages/JourneyPlanner.tsx` (Google Maps button, per-stop remove)
  - `src/components/map/TerritoryLeafletMap.tsx` (key-based remount fix)

## What Emma will see after

- Discovery only shows real businesses Firecrawl actually found online — no more "Bath Charm Boutique" style hallucinations.
- Each route in Journey Planner has an **"Open in Google Maps"** button that hands off to her phone.
- Every stop has a ✕ to drop it from the route before navigating.
- Each prospect card has a **Delete** button to remove it permanently from the list.
