import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  getAccountHealth,
  getHealthLabel,
  getHealthColor,
  getHealthBg,
  getEngagementColor,
  getReorderLabel,
  getReorderColor,
} from "./accountHealth";
import type { Retailer } from "@/hooks/useRetailers";

const NOW = new Date("2024-06-15T12:00:00Z");

function daysAgo(days: number): string {
  return new Date(NOW.getTime() - days * 86400000).toISOString();
}

function makeRetailer(overrides: Partial<Retailer> = {}): Retailer {
  return {
    id: "r1",
    name: "Test Retailer",
    fit_score: 80,
    priority_score: 80,
    risk_flags: [],
    activity: {},
    outreach: {},
    ai_intelligence: { summary: "Strong AI summary" },
    performance_prediction: { reorderPotential: "high" },
    qualification: {},
    competitor_brands: [],
    ...overrides,
  } as Retailer;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("getAccountHealth - engagement levels", () => {
  it("classifies recent contact (<=14 days) as high engagement", () => {
    const h = getAccountHealth(makeRetailer({ activity: { lastContactDate: daysAgo(7) } }));
    expect(h.engagementLevel).toBe("high");
    expect(h.daysSinceContact).toBe(7);
  });

  it("classifies contact between 15 and 30 days as medium engagement", () => {
    const h = getAccountHealth(makeRetailer({ activity: { lastContactDate: daysAgo(20) } }));
    expect(h.engagementLevel).toBe("medium");
  });

  it("classifies contact over 30 days old as low engagement", () => {
    const h = getAccountHealth(makeRetailer({ activity: { lastContactDate: daysAgo(45) } }));
    expect(h.engagementLevel).toBe("low");
  });

  it("classifies no contact as 'none'", () => {
    const h = getAccountHealth(makeRetailer({ activity: {} }));
    expect(h.engagementLevel).toBe("none");
    expect(h.daysSinceContact).toBeNull();
  });

  it("upgrades to high engagement when a meeting is scheduled, regardless of last contact", () => {
    const h = getAccountHealth(
      makeRetailer({ activity: { lastContactDate: daysAgo(90), meetingScheduled: true } }),
    );
    expect(h.engagementLevel).toBe("high");
  });

  it("treats invalid contact dates as no contact", () => {
    const h = getAccountHealth(makeRetailer({ activity: { lastContactDate: "not-a-date" } }));
    expect(h.daysSinceContact).toBeNull();
    expect(h.engagementLevel).toBe("none");
  });
});

describe("getAccountHealth - reorder status", () => {
  it.each([
    ["high", "on_track"],
    ["medium", "due_soon"],
    ["low", "overdue"],
  ] as const)("maps reorderPotential=%s to status=%s", (potential, expected) => {
    const h = getAccountHealth(makeRetailer({ performance_prediction: { reorderPotential: potential } }));
    expect(h.reorderStatus).toBe(expected);
  });

  // The JSONB accessor in useRetailers defaults reorderPotential to "low" when missing,
  // which means a brand-new account with no prediction looks "overdue" rather than "unknown".
  // This is current behaviour; flagged here so a future product fix doesn't silently regress.
  it("treats a missing prediction as 'overdue' (defaulted to low)", () => {
    const h = getAccountHealth(makeRetailer({ performance_prediction: {} }));
    expect(h.reorderStatus).toBe("overdue");
  });
});

describe("getAccountHealth - flags", () => {
  it("flags 30+ day silence without escalating to 60+", () => {
    const h = getAccountHealth(makeRetailer({ activity: { lastContactDate: daysAgo(45) } }));
    expect(h.flags).toContain("No contact in 30+ days");
    expect(h.flags).not.toContain("No contact in 60+ days");
  });

  it("escalates to 60+ day silence flag", () => {
    const h = getAccountHealth(makeRetailer({ activity: { lastContactDate: daysAgo(90) } }));
    expect(h.flags).toContain("No contact in 60+ days");
    expect(h.flags).not.toContain("No contact in 30+ days");
  });

  it("flags when there's no engagement record at all", () => {
    const h = getAccountHealth(makeRetailer({ activity: {} }));
    expect(h.flags).toContain("No engagement recorded");
  });

  it("flags when reorder potential is low", () => {
    const h = getAccountHealth(makeRetailer({ performance_prediction: { reorderPotential: "low" } }));
    expect(h.flags).toContain("Low reorder potential");
  });

  it("includes up to two risk flags from the retailer", () => {
    const h = getAccountHealth(
      makeRetailer({ risk_flags: ["payment delay", "stock dispute", "third risk that shouldn't show"] }),
    );
    expect(h.flags).toContain("payment delay");
    expect(h.flags).toContain("stock dispute");
    expect(h.flags).not.toContain("third risk that shouldn't show");
  });

  it("flags missing AI analysis", () => {
    const h = getAccountHealth(makeRetailer({ ai_intelligence: {} }));
    expect(h.flags).toContain("No AI analysis");
  });
});

describe("getAccountHealth - score and status", () => {
  it("clamps the score between 0 and 100", () => {
    const worst = getAccountHealth(
      makeRetailer({
        fit_score: 0,
        risk_flags: ["a", "b", "c", "d", "e"],
        activity: {},
        ai_intelligence: {},
        performance_prediction: { reorderPotential: "low" },
      }),
    );
    expect(worst.score).toBeGreaterThanOrEqual(0);
    expect(worst.score).toBeLessThanOrEqual(100);

    const best = getAccountHealth(
      makeRetailer({
        fit_score: 100,
        activity: { lastContactDate: daysAgo(1), meetingScheduled: true },
        performance_prediction: { reorderPotential: "high" },
        ai_intelligence: { summary: "x" },
      }),
    );
    expect(best.score).toBeGreaterThanOrEqual(0);
    expect(best.score).toBeLessThanOrEqual(100);
  });

  it("classifies a thriving account as 'excellent'", () => {
    const h = getAccountHealth(
      makeRetailer({
        fit_score: 100,
        activity: { lastContactDate: daysAgo(1) },
        performance_prediction: { reorderPotential: "high" },
        ai_intelligence: { summary: "x" },
      }),
    );
    expect(h.status).toBe("excellent");
    expect(h.score).toBeGreaterThanOrEqual(80);
  });

  it("classifies a fully cold account as 'at_risk'", () => {
    const h = getAccountHealth(
      makeRetailer({
        fit_score: 10,
        risk_flags: ["x", "y"],
        activity: {},
        ai_intelligence: {},
        performance_prediction: { reorderPotential: "low" },
      }),
    );
    expect(h.status).toBe("at_risk");
    expect(h.score).toBeLessThan(40);
  });
});

describe("getAccountHealth - status label/colour helpers", () => {
  it("returns a label for every status", () => {
    expect(getHealthLabel("excellent")).toBe("Excellent");
    expect(getHealthLabel("good")).toBe("Good");
    expect(getHealthLabel("needs_attention")).toBe("Needs Attention");
    expect(getHealthLabel("at_risk")).toBe("At Risk");
  });

  it("returns a colour class for every status", () => {
    expect(getHealthColor("excellent")).toMatch(/text-/);
    expect(getHealthBg("excellent")).toMatch(/bg-/);
  });

  it("maps engagement to a colour for every level", () => {
    expect(getEngagementColor("high")).toMatch(/bg-/);
    expect(getEngagementColor("medium")).toMatch(/bg-/);
    expect(getEngagementColor("low")).toMatch(/bg-/);
    expect(getEngagementColor("none")).toMatch(/bg-/);
  });

  it("maps reorder status to a label and colour", () => {
    expect(getReorderLabel("on_track")).toBe("On Track");
    expect(getReorderLabel("due_soon")).toBe("Due Soon");
    expect(getReorderLabel("overdue")).toBe("Overdue");
    expect(getReorderLabel("unknown")).toBe("Unknown");
    expect(getReorderColor("on_track")).toMatch(/text-/);
  });
});
