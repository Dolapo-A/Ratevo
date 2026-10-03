import { describe, test, expect } from "vitest";

import { fmtRate, fmtRateLine, fmtPair } from "./rateFormat";

/**
 * A rate's precision has to follow its magnitude, and getting that wrong does not
 * look like a formatting bug — it looks like a measurement.
 *
 * The 161 currencies here are quoted from 1,330.64 for USD/NGN down to fractions
 * far below a hundredth. Two decimals turns every one of those into "0.00", which
 * asserts the rate is zero. That is the specific failure these cases exist to stop.
 */

describe("fmtRate", () => {
	test("groups and fixes two decimals above a cent", () => {
		expect(fmtRate(1330.6356)).toBe("1,330.64");
		expect(fmtRate(8)).toBe("8.00");
		expect(fmtRate(0.5)).toBe("0.50");
		expect(fmtRate(1)).toBe("1.00");
	});

	test("keeps the decimals a sub-cent rate needs instead of printing zero", () => {
		// The hazard, stated as an assertion: a fixed 2dp would claim these are zero.
		expect(fmtRate(0.0084)).toBe("0.0084");
		expect(fmtRate(0.0000084)).toBe("0.0000084");
		expect(fmtRate(0.000001)).toBe("0.000001");

		// And the fixed-precision version that must not be used here.
		expect((0.0084).toFixed(2)).toBe("0.01");
	});

	test("handles a very small rate without losing all of it", () => {
		expect(fmtRate(1e-9)).toBe("1e-9");
		expect(fmtRate(0.000000001)).toBe("1e-9");
	});

	test("a genuine zero is zero, not a withheld figure", () => {
		expect(fmtRate(0)).toBe("0");
	});

	test("never prints NaN, which is the shape a missing figure usually arrives in", () => {
		expect(fmtRate(NaN)).toBe("—");
		expect(fmtRate(Infinity)).toBe("—");
		expect(fmtRate(null)).toBe("—");
		expect(fmtRate(undefined)).toBe("—");
		expect(fmtRate("not a number")).toBe("—");
	});

	test("prints a minus sign, not a bracket, for a negative rate", () => {
		// Rates are not negative, but a derived difference can be, and `(1.50)`
		// reads as accounting notation rather than a value.
		expect(fmtRate(-1.5)).toBe("-1.50");
	});
});

describe("fmtRateLine", () => {
	test("names the pair the rate belongs to", () => {
		expect(fmtRateLine("USD", "NGN", 1330.6356)).toBe("1 USD = 1,330.64 NGN");
	});

	test("withholds the whole line when either currency is unknown", () => {
		// A rate printed without its pair is not a measurement. This is the fix for
		// "1 undefined = 1330.64 undefined", which is what a one-frame gap between
		// two differently-keyed queries used to render.
		expect(fmtRateLine(undefined, "NGN", 1330.6356)).toBe("—");
		expect(fmtRateLine("USD", undefined, 1330.6356)).toBe("—");
		expect(fmtRateLine("", "NGN", 1330.6356)).toBe("—");
		expect(fmtRateLine("USD", "", 1330.6356)).toBe("—");
	});

	test("withholds it when the rate itself is unmeasured", () => {
		expect(fmtRateLine("USD", "NGN", null)).toBe("—");
		expect(fmtRateLine("USD", "NGN", NaN)).toBe("—");
	});
});

describe("fmtPair", () => {
	test("shows the direction of the pair", () => {
		expect(fmtPair("USD", "NGN")).toBe("USD → NGN");
	});

	test("refuses rather than printing an arrow between nothing", () => {
		expect(fmtPair(undefined, "NGN")).toBe("—");
		expect(fmtPair("USD", undefined)).toBe("—");
		expect(fmtPair("", "")).toBe("—");
	});
});