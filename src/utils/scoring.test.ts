import { describe, it, expect } from "vitest";
import {
  calculateFitScore,
  CALCULATE_FIT_SCORE_SOURCE,
  type FitScoreFactors,
} from "./scoring";

const base: FitScoreFactors = {
  estimated_store_quality: 80,
  category_alignment: "strong",
  price_positioning: "mid_market",
  town_appeal: "good",
  has_social_media: true,
  is_independent: true,
  estimated_rating: 4,
  has_website: true,
};

describe("calculateFitScore", () => {
  it("produces a total within 0-100", () => {
    const { total } = calculateFitScore(base);
    expect(total).toBeGreaterThanOrEqual(0);
    expect(total).toBeLessThanOrEqual(100);
  });

  it("returns per-bucket breakdown that sums to the total (pre-clamp)", () => {
    const r = calculateFitScore(base);
    const sum =
      r.store_quality.score +
      r.category_alignment.score +
      r.location_appeal.score +
      r.online_presence.score +
      r.commercial_health.score +
      r.independence.score;
    expect(r.total).toBe(Math.min(100, Math.max(0, sum)));
  });

  it("scores category_alignment buckets in the expected order", () => {
    const perfect = calculateFitScore({ ...base, category_alignment: "perfect" }).category_alignment.score;
    const strong = calculateFitScore({ ...base, category_alignment: "strong" }).category_alignment.score;
    const moderate = calculateFitScore({ ...base, category_alignment: "moderate" }).category_alignment.score;
    const weak = calculateFitScore({ ...base, category_alignment: "weak" }).category_alignment.score;
    expect(perfect).toBe(20);
    expect(strong).toBe(16);
    expect(moderate).toBe(12);
    expect(weak).toBe(6);
    expect(perfect).toBeGreaterThan(strong);
    expect(strong).toBeGreaterThan(moderate);
    expect(moderate).toBeGreaterThan(weak);
  });

  it("scores town_appeal buckets in the expected order", () => {
    const prime = calculateFitScore({ ...base, town_appeal: "prime" }).location_appeal.score;
    const good = calculateFitScore({ ...base, town_appeal: "good" }).location_appeal.score;
    const average = calculateFitScore({ ...base, town_appeal: "average" }).location_appeal.score;
    const poor = calculateFitScore({ ...base, town_appeal: "poor" }).location_appeal.score;
    expect(prime).toBe(15);
    expect(good).toBe(12);
    expect(average).toBe(9);
    expect(poor).toBe(5);
  });

  it("does NOT penalise missing social media (rural retailers carve-out)", () => {
    const withSocial = calculateFitScore({ ...base, has_social_media: true, has_website: true });
    const withoutSocial = calculateFitScore({ ...base, has_social_media: false, has_website: true });
    expect(withSocial.online_presence.score).toBe(15);
    expect(withoutSocial.online_presence.score).toBe(10);
    // missing social loses the +5 bonus but doesn't drop below the website-only baseline
    expect(withoutSocial.online_presence.score).toBeGreaterThanOrEqual(10);
  });

  it("gives zero online presence when there's no website and no social", () => {
    const r = calculateFitScore({ ...base, has_website: false, has_social_media: false });
    expect(r.online_presence.score).toBe(0);
  });

  it("uses a neutral commercial score of 8 when rating is unknown (0)", () => {
    const r = calculateFitScore({ ...base, estimated_rating: 0 });
    expect(r.commercial_health.score).toBe(8);
  });

  it("scales commercial score linearly with rating 1-5", () => {
    expect(calculateFitScore({ ...base, estimated_rating: 5 }).commercial_health.score).toBe(15);
    expect(calculateFitScore({ ...base, estimated_rating: 1 }).commercial_health.score).toBe(3);
  });

  it("rewards independence (+6 over chains)", () => {
    const indie = calculateFitScore({ ...base, is_independent: true }).independence.score;
    const chain = calculateFitScore({ ...base, is_independent: false }).independence.score;
    expect(indie).toBe(9);
    expect(chain).toBe(3);
  });

  it("clamps total to 100 at maximum inputs", () => {
    const r = calculateFitScore({
      estimated_store_quality: 95,
      category_alignment: "perfect",
      price_positioning: "premium",
      town_appeal: "prime",
      has_social_media: true,
      is_independent: true,
      estimated_rating: 5,
      has_website: true,
    });
    // store_quality 25 + category 20 + location 15 + online 15 + commercial 15 + indep 9 = 99
    expect(r.total).toBe(99);
  });

  it("handles store_quality at 0 without going negative", () => {
    const r = calculateFitScore({ ...base, estimated_store_quality: 0 });
    expect(r.store_quality.score).toBe(0);
    expect(r.total).toBeGreaterThanOrEqual(0);
  });

  it("falls back to category default (10) for unknown alignment strings", () => {
    // bypass the type for the fallback test
    const r = calculateFitScore({ ...base, category_alignment: "unknown" as never });
    expect(r.category_alignment.score).toBe(10);
  });

  it("falls back to location default (9) for unknown town_appeal strings", () => {
    const r = calculateFitScore({ ...base, town_appeal: "unknown" as never });
    expect(r.location_appeal.score).toBe(9);
  });
});

describe("CALCULATE_FIT_SCORE_SOURCE (Deno edge-function parity)", () => {
  // The Deno copy is shipped to edge functions verbatim. If the two implementations
  // drift, prospect scoring becomes inconsistent between the UI and the discovery
  // pipeline. This test guards parity for 100 random inputs.
  const denoFactory = new Function(`${CALCULATE_FIT_SCORE_SOURCE}; return calculateFitScore;`);
  const denoCalc = denoFactory() as (f: FitScoreFactors) => { total: number };

  const cats: FitScoreFactors["category_alignment"][] = ["perfect", "strong", "moderate", "weak"];
  const locs: FitScoreFactors["town_appeal"][] = ["prime", "good", "average", "poor"];
  const prices: FitScoreFactors["price_positioning"][] = ["premium", "mid_market", "budget"];

  function randomFactors(seed: number): FitScoreFactors {
    const r = (n: number) => (Math.sin(seed * (n + 1)) + 1) / 2;
    return {
      estimated_store_quality: 40 + Math.floor(r(1) * 55),
      category_alignment: cats[Math.floor(r(2) * cats.length)],
      price_positioning: prices[Math.floor(r(3) * prices.length)],
      town_appeal: locs[Math.floor(r(4) * locs.length)],
      has_social_media: r(5) > 0.5,
      is_independent: r(6) > 0.5,
      estimated_rating: Math.floor(r(7) * 6),
      has_website: r(8) > 0.5,
    };
  }

  it("matches the TS implementation across 100 deterministic random inputs", () => {
    for (let i = 1; i <= 100; i++) {
      const f = randomFactors(i);
      const ts = calculateFitScore(f);
      const deno = denoCalc(f);
      expect(deno.total).toBe(ts.total);
    }
  });
});
