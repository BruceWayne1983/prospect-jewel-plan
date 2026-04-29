## Fix MyContactsUpload issues from review

Three small fixes to `src/components/prospects/MyContactsUpload.tsx`:

### 1. Fix broken Stop button (closure bug)
The current `stop` state value is captured in the loop closure when `runAll` starts, so clicking Stop never breaks the loop.

**Fix:** Replace `useState(false)` for `stop` with a `useRef<boolean>(false)`.
- Reset `stopRef.current = false` at start of `runAll`.
- Check `if (stopRef.current) break;` inside the loop.
- Stop button sets `stopRef.current = true` and forces a re-render via a small `stopping` state flag for button label feedback.
- If stopped, toast: "Verification stopped at X/Y."

### 2. Add row-count guard
Prevent accidentally running thousands of rows.

**Fix:** After parsing, if `parsedRows.length > 500`, show a `confirm()` dialog warning about the size and estimated time (~10 minutes per 1000 rows). Hard cap at 2000 rows — refuse with a toast asking user to split the file.

### 3. Cosmetic cleanup in `src/pages/ProspectDiscovery.tsx`
Remove the stray double blank lines around the recently added export handlers/buttons. No logic changes.

### Out of scope
- Per-row delay (600ms) stays — safe default for upstream Firecrawl/Google rate limits.
- No new edge function or DB changes.
- No UI redesign.
