import { describe, it, expect } from "vitest";
import { revenuePriority, rankByRevenuePriority, isFollowUpOverdue, overdueFollowUps } from "./leadPriority";
import type { Retailer } from "@/hooks/useRetailers";

const NOW = new Date("2024-06-15T12:00:00Z");

function makeRetailer(overrides: Partial<Retailer> = {}): Retailer {
  return {
    id: "r1",
    name: "Test",
    fit_score: 80,
    priority_score: 80,
    risk_flags: [],
    activity: {},
    outreach: {},
    ai_intelligence: {},
    performance_prediction: { predictedAnnualValue: "£10,000" },
    qualification: {},
    competitor_brands: [],
    ...overrides,
  } as Retailer;
}

describe("revenuePriority", () => {
  it("returns 0 when fit_score is 0", () => {
    const r = makeRetailer({ fit_score: 0 });
    expect(revenuePriority(r, NOW)).toBe(0);
  });

  it("returns 0 when predicted annual value is missing or non-numeric", () => {
    const r = makeRetailer({ performance_prediction: { predictedAnnualValue: "–" } });
    expect(revenuePriority(r, NOW)).toBe(0);
  });

  it("scales with predicted annual value", () => {
    const small = makeRetailer({ performance_prediction: { predictedAnnualValue: "£5,000" } });
    const big = makeRetailer({ performance_prediction: { predictedAnnualValue: "£20,000" } });
    expect(revenuePriority(big, NOW)).toBeGreaterThan(revenuePriority(small, NOW));
    expect(revenuePriority(big, NOW)).toBeCloseTo(revenuePriority(small, NOW) * 4, 5);
  });

  it("scales with fit_score", () => {
    const low = makeRetailer({ fit_score: 40 });
    const high = makeRetailer({ fit_score: 90 });
    expect(revenuePriority(high, NOW)).toBeGreaterThan(revenuePriority(low, NOW));
  });

  it("boosts accounts that haven't been contacted recently", () => {
    const recent = makeRetailer({ activity: { lastContactDate: new Date(NOW.getTime() - 1 * 86400000).toISOString() } });
    const stale = makeRetailer({ activity: { lastContactDate: new Date(NOW.getTime() - 90 * 86400000).toISOString() } });
    expect(revenuePriority(stale, NOW)).toBeGreaterThan(revenuePriority(recent, NOW));
  });

  it("caps the recency boost at 90 days (180-day-old contact ≈ same as 90-day-old)", () => {
    const ninety = makeRetailer({ activity: { lastContactDate: new Date(NOW.getTime() - 90 * 86400000).toISOString() } });
    const oneEighty = makeRetailer({ activity: { lastContactDate: new Date(NOW.getTime() - 180 * 86400000).toISOString() } });
    expect(revenuePriority(oneEighty, NOW)).toBeCloseTo(revenuePriority(ninety, NOW), 5);
  });

  it("treats malformed lastContactDate as no contact (boost factor 1)", () => {
    const a = makeRetailer({ activity: { lastContactDate: "not a date" } });
    const b = makeRetailer({ activity: {} });
    expect(revenuePriority(a, NOW)).toBeCloseTo(revenuePriority(b, NOW), 5);
  });
});

describe("rankByRevenuePriority", () => {
  it("returns retailers sorted by revenuePriority descending", () => {
    const a = makeRetailer({ id: "a", performance_prediction: { predictedAnnualValue: "£5,000" } });
    const b = makeRetailer({ id: "b", performance_prediction: { predictedAnnualValue: "£20,000" } });
    const c = makeRetailer({ id: "c", performance_prediction: { predictedAnnualValue: "£10,000" } });
    const ranked = rankByRevenuePriority([a, b, c], NOW).map(r => r.id);
    expect(ranked).toEqual(["b", "c", "a"]);
  });

  it("does not mutate the input array", () => {
    const list = [makeRetailer({ id: "a" }), makeRetailer({ id: "b" })];
    const original = list.map(r => r.id);
    rankByRevenuePriority(list, NOW);
    expect(list.map(r => r.id)).toEqual(original);
  });
});

describe("isFollowUpOverdue", () => {
  it("returns false when there's no next action date", () => {
    expect(isFollowUpOverdue(makeRetailer(), NOW)).toBe(false);
  });

  it("returns true when nextActionDate is strictly before today", () => {
    const r = makeRetailer({ activity: { nextActionDate: "2024-06-14" } });
    expect(isFollowUpOverdue(r, NOW)).toBe(true);
  });

  it("returns false when nextActionDate is today", () => {
    const r = makeRetailer({ activity: { nextActionDate: "2024-06-15" } });
    expect(isFollowUpOverdue(r, NOW)).toBe(false);
  });

  it("returns false when nextActionDate is in the future", () => {
    const r = makeRetailer({ activity: { nextActionDate: "2024-07-01" } });
    expect(isFollowUpOverdue(r, NOW)).toBe(false);
  });

  it("returns false for non-ISO date strings like 'next week'", () => {
    const r = makeRetailer({ activity: { nextActionDate: "next week" } });
    expect(isFollowUpOverdue(r, NOW)).toBe(false);
  });
});

describe("overdueFollowUps", () => {
  it("returns only overdue retailers, sorted by date ascending (oldest first)", () => {
    const a = makeRetailer({ id: "a", activity: { nextActionDate: "2024-06-10" } });
    const b = makeRetailer({ id: "b", activity: { nextActionDate: "2024-06-05" } });
    const c = makeRetailer({ id: "c", activity: { nextActionDate: "2024-07-01" } });
    const d = makeRetailer({ id: "d", activity: {} });
    expect(overdueFollowUps([a, b, c, d], NOW).map(r => r.id)).toEqual(["b", "a"]);
  });
});
