/**
 * Calculate an annualised run-rate from a report total.
 *
 * - If both period_start and period_end are present, use that exact period.
 * - If only period_end is present, assume period_start is 1 January of that year.
 * - If neither is present, fall back to "days since 1 Jan of the current year"
 *   and flag the result as an estimate.
 */
export function calculateAnnualisedRate(
  totalCY: number,
  periodStart: string | null,
  periodEnd: string | null
): { rate: number; isEstimate: boolean; periodDays: number } {
  if (!totalCY || totalCY <= 0) {
    return { rate: 0, isEstimate: false, periodDays: 0 };
  }

  const parse = (s: string | null): Date | null => {
    if (!s) return null;
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  };

  const start = parse(periodStart);
  const end = parse(periodEnd);

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
  const periodDays = Math.max(1, Math.floor((now.getTime() - yearStart.getTime()) / 86400000));
  return { rate: (totalCY / periodDays) * 365, isEstimate: true, periodDays };
}
