## Plan

The issue is not stale UI state: the discovery page is successfully loading real rows from the backend, and the current snapshot shows 68 prospects still present. The screenshot also shows **Hide unverified** enabled, which can make the visible list appear empty even while the counters still show data.

### What I’ll implement

1. **Clear the existing prospect dataset**
   - Remove existing rows from the prospect discovery data so the demo starts fresh.
   - Clear both:
     - discovered prospects
     - learned disqualification patterns
   - If you want a total reset, I’ll also verify no related demo-only prospect state remains elsewhere.

2. **Fix the confusing empty-list state on `/discovery`**
   - Change the default behavior of the **Hide unverified** toggle so it does not hide everything on first load.
   - Add a clear empty-state message when filters are hiding all loaded prospects, e.g. “68 prospects loaded, but hidden by current filters.”
   - Make the stats and visible list behavior feel consistent.

3. **Add a proper demo reset control**
   - Add a visible **Clear all prospects** action on the discovery page for quick demo resets.
   - This will clear prospect discovery data without needing manual backend intervention each time.
   - Include confirmation to prevent accidental wipes.

4. **Verify end-to-end behavior**
   - Confirm the discovery request returns zero rows after reset.
   - Confirm cards update to zero.
   - Confirm the page no longer looks blank/misleading because of the verification filter.
   - Confirm a new scan repopulates the list correctly.

## Technical details

- Files likely involved:
  - `src/pages/ProspectDiscovery.tsx`
  - backend data reset via migration or permitted delete action
- Root cause confirmed:
  - `/discovery` fetches directly from `discovered_prospects`
  - current network snapshot returned real prospect rows for Emma’s session
  - `Hide unverified` is currently defaulted to `true`, which can hide most/all freshly discovered records
- Data to clear:
  - `public.discovered_prospects`
  - `public.disqualification_patterns`

## Expected result

After this change, the demo will open with a genuinely clean prospect list, the page won’t appear empty for confusing reasons, and you’ll have a quick way to reset prospects again before demos.