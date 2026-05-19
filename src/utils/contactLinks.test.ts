import { describe, it, expect } from "vitest";
import { telHref, mailtoHref, websiteHref, directionsHref } from "./contactLinks";

describe("telHref", () => {
  it("strips spaces, hyphens, and parens but keeps the leading +", () => {
    expect(telHref("+44 (0)20 1234 5678")).toBe("tel:+4402012345678");
    expect(telHref("020-1234-5678")).toBe("tel:02012345678");
  });

  it("returns null for empty/nullish input", () => {
    expect(telHref(null)).toBeNull();
    expect(telHref(undefined)).toBeNull();
    expect(telHref("")).toBeNull();
  });

  it("returns null when no digits remain after cleaning", () => {
    expect(telHref("call me!")).toBeNull();
  });
});

describe("mailtoHref", () => {
  it("returns a mailto: link for valid input", () => {
    expect(mailtoHref("a@b.com")).toBe("mailto:a@b.com");
  });

  it("trims whitespace", () => {
    expect(mailtoHref("  a@b.com  ")).toBe("mailto:a@b.com");
  });

  it("returns null for missing @", () => {
    expect(mailtoHref("not-an-email")).toBeNull();
    expect(mailtoHref("")).toBeNull();
    expect(mailtoHref(null)).toBeNull();
  });
});

describe("websiteHref", () => {
  it("preserves an explicit https://", () => {
    expect(websiteHref("https://example.com")).toBe("https://example.com");
  });

  it("preserves an explicit http://", () => {
    expect(websiteHref("http://example.com")).toBe("http://example.com");
  });

  it("prefixes https:// when no scheme", () => {
    expect(websiteHref("example.com")).toBe("https://example.com");
  });

  it("returns null for empty/nullish input", () => {
    expect(websiteHref(null)).toBeNull();
    expect(websiteHref(undefined)).toBeNull();
    expect(websiteHref("   ")).toBeNull();
  });
});

describe("directionsHref", () => {
  it("prefers lat/lng over text", () => {
    const r = directionsHref({ lat: 51.38, lng: -2.36, address: "1 High St", town: "Bath" });
    expect(r).toContain("51.38,-2.36");
    expect(r).not.toContain("High");
  });

  it("falls back to address + postcode when no coords", () => {
    const r = directionsHref({ address: "1 High St", postcode: "BA1 1AA", town: "Bath" });
    expect(r).toContain(encodeURIComponent("1 High St, BA1 1AA"));
  });

  it("falls back to town + county when no address or postcode", () => {
    const r = directionsHref({ town: "Cowbridge", county: "Vale of Glamorgan" });
    expect(r).toContain(encodeURIComponent("Cowbridge, Vale of Glamorgan"));
  });

  it("returns null with no usable target data", () => {
    expect(directionsHref({})).toBeNull();
    expect(directionsHref({ address: null, postcode: null, town: null, county: null })).toBeNull();
  });

  it("treats lat=0 / lng=0 as valid coordinates (not falsy)", () => {
    const r = directionsHref({ lat: 0, lng: 0 });
    expect(r).toContain("0,0");
  });
});
