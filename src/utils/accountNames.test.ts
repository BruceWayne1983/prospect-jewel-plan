import { describe, it, expect } from "vitest";
import { normaliseAccountName } from "./accountNames";

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
