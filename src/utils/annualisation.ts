/**
 * Calculate an annualised run-rate from a report total.
 *
 * - If both period_start and period_end are present, use that exact period.
 * - If only period_end is present, assume period_start is 1 January of that year.
 * - If neither is present, fall back to "days since 1 Jan of the current year"
 *   and flag the result as an estimate.
 *
 * All date parsing uses *local* midnight. The previous implementation used
 * `new Date("YYYY-MM-DD")` which parses as UTC, then mixed it with
 * `new Date(year, 0, 1)` (local midnight) — that drifted by one day under
 * timezones east of UTC.
 */

// Parses a YYYY-MM-DD string as local midnight. Returns null for anything
// non-ISO so the caller can fall through to the next branch.
function parseLocalIsoDate(s: string | null): Date | null {
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return isNaN(d.getTime()) ? null : d;
}

export function calculateAnnualisedRate(
  totalCY: number,
  periodStart: string | null,
  periodEnd: string | null
): { rate: number; isEstimate: boolean; periodDays: number } {
  if (!totalCY || totalCY <= 0) {
    return { rate: 0, isEstimate: false, periodDays: 0 };
  }

  const start = parseLocalIsoDate(periodStart);
  const end = parseLocalIsoDate(periodEnd);

  // Both dates present — use the exact period
  if (start && end) {
    const periodDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
    return { rate: (totalCY / periodDays) * 365, isEstimate: false, periodDays };
  }

  // Only period_end — assume start of that calendar year
  if (end) {
    const yearStart = new Date(end.getFullYear(), 0, 1);
    const periodDays = Math.max(1, Math.round((end.getTime() - yearStart.getTime()) / 86400000) + 1);
    return { rate: (totalCY / periodDays) * 365, isEstimate: false, periodDays };
  }

  // Fallback — current calendar YTD, flagged as estimate
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const periodDays = Math.max(1, Math.round((now.getTime() - yearStart.getTime()) / 86400000) + 1);
  return { rate: (totalCY / periodDays) * 365, isEstimate: true, periodDays };
}
