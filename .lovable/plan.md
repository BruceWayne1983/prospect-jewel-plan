# Plan: Identify Current Accounts + Pipeline Quick Actions

Two focused changes — both small, both UI-led.

---

## 1. Show "Current Account" status on the Retailer Profile header

**Where:** `src/pages/RetailerProfile.tsx` (header area, next to existing pills like `JEWELLER · QUALIFIED · HIGH CONFIDENCE`).

**Rule (matches Current Accounts page):** A retailer is treated as a current account when `pipeline_stage` is one of: `approved`, `retention_risk`, or `dormant`. Each gets its own visual treatment so Emma can tell at a glance:

| Stage | Badge | Colour |
|---|---|---|
| `approved` | **Current Account · Active** | Champagne gold |
| `retention_risk` | **Current Account · At Risk** | Warning amber |
| `dormant` | **Current Account · Dormant** | Muted grey |
| anything else | (no badge — it's a prospect) | — |

For current accounts we also surface a small inline summary line under the address:
- **Last billed:** date from `billing_last_updated` (if present)
- **2026 YTD:** £ value from `billing_2026_ytd` (if present)

This makes the "current account" state instantly readable on every retailer detail page without changing any data model.

---

## 2. Pipeline page: one-click remove + drag-to-reorder

**Where:** `src/pages/Pipeline.tsx`.

### 2a. One-click remove
Add a small ✕ button (top-right of every Kanban card) that:
- Opens a tiny confirm popover ("Remove from pipeline?")
- On confirm: hard-deletes the retailer (`supabase.from('retailers').delete().eq('id', r.id)`) and removes it from local state
- Shows a sonner toast with an **Undo** action (re-inserts the row from a kept-in-memory copy if clicked within 6s)

This mirrors the destructive-action pattern already used elsewhere (Current Accounts removeDialog).

### 2b. Drag-to-reorder within a stage
- Use the lightweight HTML5 drag-and-drop API (no new dependency) — same approach used across the app.
- Reordering is **within a single column** (stage). Order is persisted per-user/per-stage in `localStorage` under a key like `pipeline_order_v1`.
- Cross-column drag also works: dropping a card into a different stage column updates `pipeline_stage` in the database (Kanban-style stage move).
- Visual feedback: dragged card gets reduced opacity, target column gets a soft champagne ring.

### Why localStorage for order (not DB)
Order is a personal preference, not shared data. Adding a `sort_order` column is overkill for one user. If Emma later wants order to sync across devices we can promote it to a DB column — flagged as a future enhancement, not built now.

---

## Files touched
- `src/pages/RetailerProfile.tsx` — add Current Account badge + billing summary line in the header block
- `src/pages/Pipeline.tsx` — add ✕ remove button, drag-and-drop handlers, localStorage order persistence, stage-change on cross-column drop

No database migrations. No new dependencies. No edge function changes.
