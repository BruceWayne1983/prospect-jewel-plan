import { describe, it, expect } from "vitest";
import {
  computeBudget,
  buildCumulative,
  DEFAULT_INPUTS,
  SEED_MONTHLY,
} from "@/data/stockBuildPlan";

describe("computeBudget", () => {
  it("matches the spreadsheet's worked example within £1", () => {
    const out = computeBudget(SEED_MONTHLY, DEFAULT_INPUTS);
    // Spreadsheet uses chained intermediate rounding, hence the ±£1 tolerance.
    expect(out.octJanSpend).toBeCloseTo(11436, 0);
    expect(out.expectedSpend).toBeCloseTo(15438, -1);
    expect(out.stockBuildBudget).toBeCloseTo(10807, -1);
    expect(out.charmBudget).toBeCloseTo(8645, -1);
    expect(out.fashionBasesBudget).toBeCloseTo(1081, -1);
    expect(out.fashionBudget).toBeCloseTo(540, -1);
    expect(out.categorySumValid).toBe(true);
  });

  it("permits under-allocated splits (Emma's defaults sum to 95%)", () => {
    const out = computeBudget(SEED_MONTHLY, DEFAULT_INPUTS);
    expect(out.categorySum).toBe(95);
    expect(out.categorySumValid).toBe(true);
  });

  it("flags over-allocated splits", () => {
    const out = computeBudget(SEED_MONTHLY, {
      ...DEFAULT_INPUTS,
      categorySplits: { fashion: 30, fashionBases: 30, charms: 60 },
    });
    expect(out.categorySum).toBe(120);
    expect(out.categorySumValid).toBe(false);
  });

  it("scales charm budget with growth ambition", () => {
    const conservative = computeBudget(SEED_MONTHLY, { ...DEFAULT_INPUTS, growthAmbitionPct: 20 });
    const stretch = computeBudget(SEED_MONTHLY, { ...DEFAULT_INPUTS, growthAmbitionPct: 50 });
    expect(stretch.charmBudget).toBeGreaterThan(conservative.charmBudget);
  });
});

describe("buildCumulative", () => {
  it("produces monotonic cumulative totals matching the spreadsheet", () => {
    const cum = buildCumulative(SEED_MONTHLY);
    expect(cum[0].cumulative2025).toBe(1663);
    expect(cum[1].cumulative2025).toBe(1663 + 3405);
    expect(cum[11].cumulative2025).toBe(24949);
    expect(cum[3].cumulative2026).toBe(2340 + 3968 + 4685 + 987);
    expect(cum[3].yoyPct).toBeCloseTo(((987 - 1331) / 1331) * 100, 0);
    expect(cum[4].actual2026).toBeNull();
  });
});
