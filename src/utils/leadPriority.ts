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

// Parses a YYYY-MM-DD string as a *local* midnight Date. Avoids the trap
// where `new Date("2024-06-14")` is treated as UTC midnight and then compared
// against a local-midnight `today`, which flags today's follow-up as overdue
// for users in any timezone west of UTC during evening hours.
function parseLocalIsoDate(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return isNaN(d.getTime()) ? null : d;
}

// True when the retailer has a `nextActionDate` set and it's strictly before
// today (local-date comparison — both sides parsed as local midnight). Used
// to surface "you owe these people a follow-up" on the dashboard.
export function isFollowUpOverdue(r: Retailer, now: Date = new Date()): boolean {
  const activity = getActivity(r);
  if (!activity.nextActionDate) return false;
  const next = parseLocalIsoDate(activity.nextActionDate);
  if (!next) return false; // non-ISO like "next week" → not overdue
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return next < today;
}

// Days-overdue calculation using the same local-midnight parsing so the
// number matches the boolean returned by isFollowUpOverdue.
export function daysOverdue(nextActionDate: string | null | undefined, now: Date = new Date()): number {
  if (!nextActionDate) return 0;
  const next = parseLocalIsoDate(nextActionDate);
  if (!next) return 0;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(0, Math.floor((today.getTime() - next.getTime()) / 86400000));
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
