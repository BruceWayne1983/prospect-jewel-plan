import { describe, it, expect } from "vitest";
import { normaliseAccountName, findMatchingRetailer, type RetailerLite } from "./accountNames";

describe("normaliseAccountName", () => {
  it("lowercases plain names", () => {
    expect(normaliseAccountName("Bumble Tree")).toBe("bumble tree");
  });

  it("strips Ltd suffix", () => {
    expect(normaliseAccountName("BUMBLE TREE LTD")).toBe("bumble tree");
  });

  it("strips trailing town suffix", () => {
    expect(normaliseAccountName("Bumble Tree, Bath")).toBe("bumble tree");
  });

  it("strips leading numeric prefix and Ltd", () => {
    expect(normaliseAccountName("246750-MOUNT CYCLE LTD")).toBe("mount cycle");
  });

  it("normalises & and 'and' to the same value", () => {
    expect(normaliseAccountName("Allum and Sidaway")).toBe("allum and sidaway");
    expect(normaliseAccountName("Allum & Sidaway")).toBe("allum and sidaway");
    expect(normaliseAccountName("Allum and Sidaway")).toBe(
      normaliseAccountName("Allum & Sidaway")
    );
  });

  it("strips parentheses and Limited", () => {
    expect(normaliseAccountName("Jones (Cardiff) Limited")).toBe("jones");
  });

  it("handles empty input", () => {
    expect(normaliseAccountName("")).toBe("");
  });

  it("collapses multiple spaces", () => {
    expect(normaliseAccountName("Bumble    Tree   Ltd")).toBe("bumble tree");
  });
});

describe("findMatchingRetailer", () => {
  const retailers: RetailerLite[] = [
    { id: "r1", name: "Bumble Tree Ltd", town: "Bath", website: "https://bumbletree.co.uk" },
    { id: "r2", name: "Allum & Sidaway", town: "Salisbury", website: null },
    { id: "r3", name: "Jones (Cardiff) Limited", town: null, website: "www.jonesjewellers.com" },
  ];

  it("returns null for an empty retailer list", () => {
    expect(findMatchingRetailer("Bumble Tree", "Bath", null, [])).toBeNull();
  });

  it("matches on root domain even when the name differs", () => {
    const match = findMatchingRetailer("Totally Different Name", "Nowhere", "https://www.bumbletree.co.uk/about", retailers);
    expect(match?.id).toBe("r1");
  });

  it("treats www. prefix as equivalent", () => {
    const match = findMatchingRetailer("X", "Y", "http://www.bumbletree.co.uk", retailers);
    expect(match?.id).toBe("r1");
  });

  it("matches on normalised name + same town (strict)", () => {
    const match = findMatchingRetailer("BUMBLE TREE LIMITED", "Bath", null, retailers);
    expect(match?.id).toBe("r1");
  });

  it("matches loosely on name when town is unknown on one side", () => {
    const match = findMatchingRetailer("Allum and Sidaway", "", null, retailers);
    expect(match?.id).toBe("r2");
  });

  it("does NOT match when towns conflict and there's no domain signal", () => {
    const match = findMatchingRetailer("Bumble Tree", "Brighton", null, retailers);
    expect(match).toBeNull();
  });

  it("returns null when the input name normalises to empty and there's no domain match", () => {
    const match = findMatchingRetailer("Ltd", "Bath", null, retailers);
    expect(match).toBeNull();
  });

  it("handles a missing scheme on the website URL", () => {
    const match = findMatchingRetailer("X", "Y", "bumbletree.co.uk", retailers);
    expect(match?.id).toBe("r1");
  });

  it("ignores malformed URLs and falls back to name matching", () => {
    const match = findMatchingRetailer("Allum & Sidaway", "Salisbury", "not a url at all  ", retailers);
    expect(match?.id).toBe("r2");
  });

  it("matches a .com domain via name when the candidate has no website", () => {
    const candidates: RetailerLite[] = [
      { id: "x", name: "Jones", town: null, website: null },
    ];
    const match = findMatchingRetailer("Jones (Cardiff) Limited", "", null, candidates);
    expect(match?.id).toBe("x");
  });
});
