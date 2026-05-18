import { describe, it, expect } from "vitest";
import { parseCSV, toCSV, findColumn } from "./csv";

describe("parseCSV", () => {
  it("parses a simple row", () => {
    expect(parseCSV("a,b,c")).toEqual([["a", "b", "c"]]);
  });

  it("parses multiple rows separated by LF", () => {
    expect(parseCSV("a,b\nc,d")).toEqual([
      ["a", "b"],
      ["c", "d"],
    ]);
  });

  it("ignores CR (handles CRLF line endings)", () => {
    expect(parseCSV("a,b\r\nc,d\r\n")).toEqual([
      ["a", "b"],
      ["c", "d"],
    ]);
  });

  it("preserves commas embedded in quoted fields", () => {
    expect(parseCSV('"Smith, John",42')).toEqual([["Smith, John", "42"]]);
  });

  it("treats doubled quotes inside a quoted field as a literal quote", () => {
    expect(parseCSV('"She said ""hi""",ok')).toEqual([['She said "hi"', "ok"]]);
  });

  it("handles empty cells", () => {
    expect(parseCSV("a,,c")).toEqual([["a", "", "c"]]);
  });

  it("drops completely blank rows", () => {
    expect(parseCSV("a,b\n\nc,d")).toEqual([
      ["a", "b"],
      ["c", "d"],
    ]);
  });

  it("returns an empty array for empty input", () => {
    expect(parseCSV("")).toEqual([]);
  });

  it("handles trailing newline without producing an empty row", () => {
    expect(parseCSV("a,b\n")).toEqual([["a", "b"]]);
  });
});

describe("toCSV", () => {
  it("serialises plain rows", () => {
    expect(toCSV([["a", "b"], ["c", "d"]])).toBe("a,b\nc,d");
  });

  it("quotes cells containing commas, quotes, or newlines", () => {
    expect(toCSV([["a,b", 'he said "hi"', "line\n2"]])).toBe('"a,b","he said ""hi""","line\n2"');
  });

  it("renders null and undefined as empty cells", () => {
    expect(toCSV([["a", null, undefined, "b"]])).toBe("a,,,b");
  });

  it("renders numbers without quoting", () => {
    expect(toCSV([[1, 2, 3.5]])).toBe("1,2,3.5");
  });

  it("round-trips through parseCSV", () => {
    const rows = [
      ["name", "note"],
      ["Smith, John", 'said "hi"'],
      ["Empty", ""],
    ];
    expect(parseCSV(toCSV(rows))).toEqual(rows);
  });
});

describe("findColumn", () => {
  it("matches case-insensitively", () => {
    expect(findColumn(["Name", "Phone"], ["phone"])).toBe(1);
  });

  it("matches across space / underscore / dash variants", () => {
    expect(findColumn(["Phone Number"], ["phone_number"])).toBe(0);
    expect(findColumn(["phone-number"], ["phonenumber"])).toBe(0);
    expect(findColumn(["phone_number"], ["Phone Number"])).toBe(0);
  });

  it("returns the first matching candidate", () => {
    expect(findColumn(["a", "email", "phone"], ["phone", "email"])).toBe(2);
  });

  it("returns -1 when no candidate matches", () => {
    expect(findColumn(["a", "b"], ["c"])).toBe(-1);
  });
});
