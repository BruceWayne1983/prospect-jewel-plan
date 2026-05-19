import type { Retailer } from "@/hooks/useRetailers";
import { getPerformancePrediction, getActivity } from "@/hooks/useRetailers";

// Revenue-weighted lead priority. Combines:
//   - fit_score:           how good a stockist they'd be (0-100)
//   - predicted £ value:   how much they're worth annually
//   - contact recency:     boosts accounts that haven't been touched recently
//
// Output is a unitless number — higher means "work on this account next".
// We don't try to normalise it to 0-100; comparisons are what matters.
//
// Why it exists: the existing `priority_score` field is set upstream by
// discovery and only reflects the prospect's intrinsic appeal. It doesn't
// know how long Emma has been ignoring them or how much money is on the
// table. revenuePriority adds those signals.
export function revenuePriority(r: Retailer, now: Date = new Date()): number {
  const fit = Math.max(0, Math.min(100, r.fit_score ?? 0)) / 100;

  // Parse predicted annual value out of the formatted string ("£11,500", etc.).
  const pred = getPerformancePrediction(r);
  const annual = parseFloat(String(pred.predictedAnnualValue).replace(/[^0-9.]/g, "")) || 0;

  // Days since last contact — caps at 90 to stop ancient leads dominating.
  const activity = getActivity(r);
  let recencyBoost = 1; // no contact recorded → no boost or penalty
  if (activity.lastContactDate) {
    const last = new Date(activity.lastContactDate);
    if (!isNaN(last.getTime())) {
      const days = Math.min(90, Math.max(0, (now.getTime() - last.getTime()) / 86400000));
      // 0 days → 0.5x (recently contacted, less urgent),
      // 30 days → 1.0x (neutral),
      // 90+ days → 2.0x (haven't touched in ages — needs attention).
      recencyBoost = 0.5 + (days / 90) * 1.5;
    }
  }

  return fit * annual * recencyBoost;
}

// Convenience: rank a list by revenuePriority, descending.
export function rankByRevenuePriority(retailers: Retailer[], now: Date = new Date()): Retailer[] {
  return [...retailers]
    .map(r => ({ r, score: revenuePriority(r, now) }))
    .sort((a, b) => b.score - a.score)
    .map(({ r }) => r);
}

// True when the retailer has a `nextActionDate` set and it's strictly before
// today (UTC date comparison). Used to surface "you owe these people a
// follow-up" on the dashboard.
export function isFollowUpOverdue(r: Retailer, now: Date = new Date()): boolean {
  const activity = getActivity(r);
  if (!activity.nextActionDate) return false;
  // Parse as a YYYY-MM-DD date — if the next-action date is anything else
  // (e.g. "next week") we can't compute overdue-ness, treat as not overdue.
  if (!/^\d{4}-\d{2}-\d{2}/.test(activity.nextActionDate)) return false;
  const next = new Date(activity.nextActionDate);
  if (isNaN(next.getTime())) return false;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return next < today;
}

export function overdueFollowUps(retailers: Retailer[], now: Date = new Date()): Retailer[] {
  return retailers
    .filter(r => isFollowUpOverdue(r, now))
    .sort((a, b) => {
      const aDate = getActivity(a).nextActionDate || "";
      const bDate = getActivity(b).nextActionDate || "";
      return aDate.localeCompare(bDate);
    });
}
