import { describe, it, expect } from "vitest";
import { tradingStatus, tradingStatusAt } from "./tradingHours";

describe("tradingStatus", () => {
  it("flags UK public holidays", () => {
    expect(tradingStatus(new Date("2026-12-25T11:00:00"))).toMatchObject({ hint: "holiday" });
    expect(tradingStatus(new Date("2026-01-01T11:00:00"))).toMatchObject({ hint: "holiday" });
  });

  it("flags Sundays as probably_closed", () => {
    // 2026-05-17 is a Sunday
    expect(tradingStatus(new Date("2026-05-17T11:00:00"))).toMatchObject({ hint: "probably_closed" });
  });

  it("flags before-09:00 as outside_hours", () => {
    // 2026-05-18 is a Monday
    expect(tradingStatus(new Date("2026-05-18T07:30:00"))).toMatchObject({ hint: "outside_hours" });
  });

  it("flags after-18:00 as outside_hours", () => {
    expect(tradingStatus(new Date("2026-05-18T19:00:00"))).toMatchObject({ hint: "outside_hours" });
  });

  it("flags 17:00-18:00 on a weekday as outside_hours", () => {
    expect(tradingStatus(new Date("2026-05-18T17:30:00"))).toMatchObject({ hint: "outside_hours" });
  });

  it("does NOT flag Saturday afternoon (16:00) as outside_hours", () => {
    // 2026-05-16 is Saturday
    expect(tradingStatus(new Date("2026-05-16T16:30:00"))).toMatchObject({ hint: "likely_open" });
  });

  it("treats a normal Tuesday 11am as likely_open", () => {
    // 2026-05-19 is a Tuesday
    expect(tradingStatus(new Date("2026-05-19T11:00:00"))).toMatchObject({ hint: "likely_open" });
  });
});

describe("tradingStatusAt", () => {
  it("accepts a YYYY-MM-DD string and defaults to mid-morning", () => {
    expect(tradingStatusAt("2026-05-19")).toMatchObject({ hint: "likely_open" });
  });

  it("accepts a YYYY-MM-DDTHH:mm string", () => {
    expect(tradingStatusAt("2026-05-19T07:00")).toMatchObject({ hint: "outside_hours" });
  });

  it("flags a Sunday date even without an explicit time", () => {
    expect(tradingStatusAt("2026-05-17")).toMatchObject({ hint: "probably_closed" });
  });

  it("flags a Christmas Day visit", () => {
    expect(tradingStatusAt("2026-12-25")).toMatchObject({ hint: "holiday" });
  });

  it("returns 'likely_open' for an unparseable input rather than throwing", () => {
    expect(tradingStatusAt("not a date")).toMatchObject({ hint: "likely_open" });
  });
});
