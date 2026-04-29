## Mark uploaded prospects + dedupe upload imports

### Goal
When Emma uses **Upload Your Own Contacts**, every resulting prospect (whether newly created or already on file) should be tagged `discovery_source = "Uploaded"`. Duplicates must NEVER create a second row — instead, the existing record gets re-tagged.

### Changes

**1. `supabase/functions/search-store/index.ts`**
- Accept new optional body field `source` (`"uploaded" | undefined`).
- Compute `discoverySource = source === "uploaded" ? "Uploaded" : "Manual Search"`.
- Same-town **retailer** duplicate: unchanged — return `alreadyExists: true, existsAs: "retailer"`. We do NOT mutate current accounts.
- Same-town **prospect** duplicate:
  - If `isUpload`: `UPDATE discovered_prospects SET discovery_source = 'Uploaded', updated_at = now() WHERE id = sameTownProspect.id AND user_id = user.id`. Return `alreadyExists: true, existsAs: "prospect", marked: true, message: "Already discovered — marked as Uploaded"`.
  - Otherwise: keep current behaviour.
- New prospect insert: use `discoverySource` instead of the hard-coded `"Manual Search"`.
- Need to also `select("id, town")` from existingProspects so we can update by id.

**2. `src/components/prospects/MyContactsUpload.tsx`**
- Pass `source: "uploaded"` in the `supabase.functions.invoke("search-store", { body: {...} })` call.
- When result is `duplicate` and `existsAs === "prospect"`, change message to `"Already discovered — marked as Uploaded"`. Retailer dup message stays `"Already in current accounts"`.

**3. `src/pages/ProspectDiscovery.tsx` (light touch)**
- The Source filter / display already uses `discovery_source`. No code change required — `"Uploaded"` will appear naturally as a new source value.
- Verify the source filter dropdown is dynamic (built from data). If it's a hard-coded list, add `"Uploaded"` to it. (Will check during implementation.)

### Out of scope
- No DB schema changes (uses existing `discovery_source` text column).
- No changes to retailer/current-account records.
- No bulk re-tagging of historical rows.
