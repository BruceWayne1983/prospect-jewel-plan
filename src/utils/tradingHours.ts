// Coarse "is this shop likely to be open?" heuristic for trips and call-time
// planning. We don't have real opening hours per retailer (yet), so this is
// a best-effort hint that flags Sundays and very early mornings — both
// common ways Emma could waste a trip.
//
// All independent jewellers / gift shops in SW England and South Wales are
// closed on Christmas Day and Boxing Day; many are closed Sundays year-round
// outside peak tourist season. We can't enumerate every store's hours, but
// we can warn on the obvious cases.

export type TradingHint = "likely_open" | "probably_closed" | "outside_hours" | "holiday";

export interface TradingStatus {
  hint: TradingHint;
  reason: string;
}

const UK_PUBLIC_HOLIDAYS_2026: string[] = [
  "2026-01-01", // New Year
  "2026-04-03", // Good Friday
  "2026-04-06", // Easter Monday
  "2026-05-04", // Early May bank holiday
  "2026-05-25", // Spring bank holiday
  "2026-08-31", // Summer bank holiday (Eng/Wales)
  "2026-12-25", // Christmas Day
  "2026-12-26", // Boxing Day (observed)
  "2026-12-28", // Boxing Day substitute (Sun → Mon)
];

const UK_PUBLIC_HOLIDAYS_2027: string[] = [
  "2027-01-01",
  "2027-03-26",
  "2027-03-29",
  "2027-05-03",
  "2027-05-31",
  "2027-08-30",
  "2027-12-27", // Christmas substitute
  "2027-12-28", // Boxing substitute
];

const UK_PUBLIC_HOLIDAYS = new Set<string>([
  ...UK_PUBLIC_HOLIDAYS_2026,
  ...UK_PUBLIC_HOLIDAYS_2027,
]);

export function tradingStatus(at: Date = new Date()): TradingStatus {
  const yyyy = at.getFullYear();
  const mm = String(at.getMonth() + 1).padStart(2, "0");
  const dd = String(at.getDate()).padStart(2, "0");
  const iso = `${yyyy}-${mm}-${dd}`;

  if (UK_PUBLIC_HOLIDAYS.has(iso)) {
    return { hint: "holiday", reason: "UK public holiday — most shops closed" };
  }

  const day = at.getDay(); // 0=Sun, 1=Mon … 6=Sat
  const hour = at.getHours();

  if (day === 0) {
    return { hint: "probably_closed", reason: "Sunday — many independents are closed" };
  }

  if (hour < 9) {
    return { hint: "outside_hours", reason: "Before 09:00 — most shops not open yet" };
  }
  if (hour >= 18) {
    return { hint: "outside_hours", reason: "After 18:00 — most shops have closed" };
  }
  if (hour >= 17 && day !== 6) {
    return { hint: "outside_hours", reason: "After 17:00 on a weekday — shops may have closed" };
  }

  return { hint: "likely_open", reason: "Within normal trading hours" };
}

// Check trading status at a specific time (used for calendar event cards).
// Accepts either a Date or a "YYYY-MM-DD" / "YYYY-MM-DDTHH:mm" string.
export function tradingStatusAt(input: Date | string, fallbackHour = 11): TradingStatus {
  let d: Date;
  if (input instanceof Date) {
    d = input;
  } else if (/^\d{4}-\d{2}-\d{2}T/.test(input)) {
    d = new Date(input);
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    // Plain date — assume mid-morning so we don't accidentally flag the
    // event as "before 09:00" when only the date is known.
    d = new Date(input);
    d.setHours(fallbackHour, 0, 0, 0);
  } else {
    d = new Date(input);
  }
  if (isNaN(d.getTime())) return { hint: "likely_open", reason: "Unknown time" };
  return tradingStatus(d);
}
