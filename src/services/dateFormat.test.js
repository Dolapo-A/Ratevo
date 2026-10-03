import { describe, test, expect } from "vitest";
import { formatDate, isValidISODate, spansYearBoundary, daysBetweenISODate } from "./dateFormat";

/**
 * The engine sends calendar dates. These cases exist because a calendar date
 * parsed carelessly becomes the wrong day, and "the low fell on 8 Sep" becoming
 * "7 Sep" is exactly the kind of error the rest of this product is built to
 * avoid.
 */

describe("formatDate", () => {
	test("renders a calendar date as day and month", () => {
		expect(formatDate("2026-09-08")).toBe("8 Sept");
	});

	test("adds the year when the date is not from this year", () => {
		// The 1Y window exists to compare across years, so a bare "8 Sept" would
		// be genuinely ambiguous there.
		expect(formatDate("2024-09-08")).toBe("8 Sept 2024");
	});

	test("spells the year out when asked, regardless", () => {
		const thisYear = new Date().toISOString().slice(0, 10);
		expect(formatDate(thisYear, { long: true })).toMatch(/\d{4}$/);
	});

	test("does not roll a date backwards for anyone west of Greenwich", () => {
		// Bare `new Date("2026-09-08")` is UTC midnight. Read as local time in any
		// negative offset that is 7 Sep, so the extreme would be attributed to the
		// wrong day for most of the Americas.
		expect(formatDate("2026-01-01")).toBe("1 Jan");
		expect(formatDate("2026-12-31")).toBe("31 Dec");
	});

	test("returns an em dash rather than a broken string", () => {
		expect(formatDate(null)).toBe("—");
		expect(formatDate(undefined)).toBe("—");
		expect(formatDate("")).toBe("—");
		expect(formatDate("not-a-date")).toBe("—");
	});

	test("refuses a day that does not exist", () => {
		// Date would silently roll 30 February over to 1 March; printing that
		// would be a date the engine never sent.
		expect(isValidISODate("2026-02-30")).toBe(false);
		expect(isValidISODate("2026-13-01")).toBe(false);
		expect(formatDate("2026-02-30")).toBe("—");
	});
});

describe("spansYearBoundary", () => {
	test("detects a range crossing new year", () => {
		expect(spansYearBoundary("2025-12-30", "2026-01-04")).toBe(true);
	});

	test("is false within one year", () => {
		expect(spansYearBoundary("2026-01-04", "2026-12-30")).toBe(false);
	});

	test("is false when either date is unusable", () => {
		expect(spansYearBoundary(null, "2026-01-04")).toBe(false);
		expect(spansYearBoundary("2026-01-04", "junk")).toBe(false);
	});
});

describe("daysBetweenISODate", () => {
	test("counts calendar days across a month boundary", () => {
		expect(daysBetweenISODate("2026-08-31", "2026-09-01")).toBe(1);
	});

	test("counts a full year", () => {
		expect(daysBetweenISODate("2025-10-03", "2026-10-03")).toBe(365);
	});

	test("is null when either date is unusable", () => {
		expect(daysBetweenISODate("2026-01-01", null)).toBeNull();
		expect(daysBetweenISODate("nope", "2026-01-01")).toBeNull();
	});
});