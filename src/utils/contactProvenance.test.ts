import { describe, it, expect } from "vitest";
import {
  getProvenance,
  isVerified,
  provenanceLabel,
  provenanceBadgeColor,
} from "./contactProvenance";

const verifiedWebsite = {
  source: "website" as const,
  verified_at: "2024-01-15T00:00:00Z",
  verified_by: "scraper",
  needs_review: false,
};

const aiInferred = {
  source: "ai_inferred" as const,
  verified_at: null,
  verified_by: null,
  needs_review: false,
};

const needsReviewWebsite = { ...verifiedWebsite, needs_review: true };

describe("getProvenance", () => {
  it("returns the typed provenance for a known field", () => {
    const data = { phone: verifiedWebsite };
    expect(getProvenance(data, "phone")).toEqual(verifiedWebsite);
  });

  it("returns null when the provenance map is missing", () => {
    expect(getProvenance(null, "phone")).toBeNull();
    expect(getProvenance(undefined, "phone")).toBeNull();
  });

  it("returns null when the field is absent", () => {
    expect(getProvenance({}, "email")).toBeNull();
  });

  it("returns null when the field value isn't an object", () => {
    expect(getProvenance({ phone: "not-an-object" }, "phone")).toBeNull();
  });

  it("returns null when the source field is missing", () => {
    expect(getProvenance({ phone: { verified_at: "x", needs_review: false } }, "phone")).toBeNull();
  });

  it("coerces missing optional fields to safe defaults", () => {
    const result = getProvenance({ phone: { source: "manual" } }, "phone");
    expect(result).toEqual({
      source: "manual",
      verified_at: null,
      verified_by: null,
      needs_review: false,
    });
  });
});

describe("isVerified", () => {
  it.each([
    ["website", true],
    ["google_maps", true],
    ["companies_house", true],
    ["manual", true],
    ["ai_inferred", false],
    ["unknown", false],
  ] as const)("source=%s -> %s when needs_review is false", (source, expected) => {
    expect(isVerified({ source, verified_at: null, verified_by: null, needs_review: false })).toBe(expected);
  });

  it("returns false for trusted sources flagged needs_review", () => {
    expect(isVerified(needsReviewWebsite)).toBe(false);
  });

  it("returns false for null/undefined input", () => {
    expect(isVerified(null)).toBe(false);
    expect(isVerified(undefined)).toBe(false);
  });
});

describe("provenanceLabel", () => {
  it("labels verified sources with their origin", () => {
    expect(provenanceLabel(verifiedWebsite)).toBe("Verified — official website");
    expect(provenanceLabel({ ...verifiedWebsite, source: "google_maps" })).toBe("Verified — Google Maps");
    expect(provenanceLabel({ ...verifiedWebsite, source: "companies_house" })).toBe(
      "Verified — Companies House",
    );
    expect(provenanceLabel({ ...verifiedWebsite, source: "manual" })).toBe("Verified — manually entered");
  });

  it("labels ai_inferred as an unverified suggestion", () => {
    expect(provenanceLabel(aiInferred)).toBe("AI suggestion (unverified)");
  });

  it("flags needs_review with a review-required label", () => {
    expect(provenanceLabel(needsReviewWebsite)).toBe("Needs review");
    expect(
      provenanceLabel({ source: "unknown", verified_at: null, verified_by: null, needs_review: true }),
    ).toBe("Unverified — review required");
  });

  it("returns 'No source' for missing provenance", () => {
    expect(provenanceLabel(null)).toBe("No source");
  });
});

describe("provenanceBadgeColor", () => {
  it("returns green for verified trusted sources", () => {
    expect(provenanceBadgeColor(verifiedWebsite)).toBe("green");
  });

  it("returns red for AI-inferred values", () => {
    expect(provenanceBadgeColor(aiInferred)).toBe("red");
  });

  it("returns amber when needs_review is set on a non-AI source", () => {
    expect(provenanceBadgeColor(needsReviewWebsite)).toBe("amber");
  });

  it("returns grey when provenance is missing", () => {
    expect(provenanceBadgeColor(null)).toBe("grey");
  });

  it("returns grey for an unverified 'unknown' source", () => {
    expect(
      provenanceBadgeColor({
        source: "unknown",
        verified_at: null,
        verified_by: null,
        needs_review: false,
      }),
    ).toBe("grey");
  });
});
