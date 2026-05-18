import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { calculateAnnualisedRate } from "./annualisation";

describe("calculateAnnualisedRate", () => {
  it("returns zero rate for non-positive totals", () => {
    expect(calculateAnnualisedRate(0, "2024-01-01", "2024-06-30")).toEqual({
      rate: 0,
      isEstimate: false,
      periodDays: 0,
    });
    expect(calculateAnnualisedRate(-100, "2024-01-01", "2024-06-30").rate).toBe(0);
  });

  it("annualises an exact period when both dates are present", () => {
    // Jan 1 to Jun 30 inclusive = 182 days, total 10000 -> rate ~= 20055
    const r = calculateAnnualisedRate(10000, "2024-01-01", "2024-06-30");
    expect(r.isEstimate).toBe(false);
    expect(r.periodDays).toBe(182);
    expect(r.rate).toBeCloseTo((10000 / 182) * 365, 5);
  });

  it("treats period_end-only as 1 Jan of that year (not an estimate)", () => {
    const r = calculateAnnualisedRate(10000, null, "2024-06-30");
    expect(r.isEstimate).toBe(false);
    expect(r.periodDays).toBe(182);
    expect(r.rate).toBeCloseTo((10000 / 182) * 365, 5);
  });

  it("falls back to YTD against system clock when both dates are missing, flagged as estimate", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-30T12:00:00Z"));
    try {
      const r = calculateAnnualisedRate(10000, null, null);
      expect(r.isEstimate).toBe(true);
      expect(r.periodDays).toBeGreaterThan(0);
      expect(r.rate).toBeGreaterThan(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it("handles a single-day period without dividing by zero", () => {
    const r = calculateAnnualisedRate(100, "2024-03-15", "2024-03-15");
    expect(r.periodDays).toBe(1);
    expect(r.rate).toBe(100 * 365);
  });

  it("treats malformed period_start the same as null (falls through to end-only branch)", () => {
    const r = calculateAnnualisedRate(10000, "not-a-date", "2024-06-30");
    expect(r.isEstimate).toBe(false);
    expect(r.periodDays).toBe(182);
  });

  it("falls back to YTD estimate when both dates are malformed", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-30T12:00:00Z"));
    try {
      const r = calculateAnnualisedRate(10000, "bogus", "also-bogus");
      expect(r.isEstimate).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("handles leap-year February without off-by-one", () => {
    // Feb 1 to Feb 29 2024 inclusive = 29 days
    const r = calculateAnnualisedRate(2900, "2024-02-01", "2024-02-29");
    expect(r.periodDays).toBe(29);
    expect(r.rate).toBeCloseTo((2900 / 29) * 365, 5);
  });

  it("clamps periodDays to at least 1 even if end < start", () => {
    const r = calculateAnnualisedRate(100, "2024-12-31", "2024-01-01");
    expect(r.periodDays).toBeGreaterThanOrEqual(1);
  });
});
