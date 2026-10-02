import { describe, test, expect } from "vitest";
import {
	groupDigits,
	sanitizeAmountInput,
	formatConverted,
	figureSizeClass,
	MAX_AMOUNT,
} from "./amountFormat";

/**
 * These cover the two ways this module can be wrong without looking wrong.
 *
 * The first is dropping digits: grouping a number that has already been grouped
 * turns "1,234" into "1,,234" and then into "1,2,34". The second is accepting an
 * amount the engine cannot represent, which produces a converted figure that is
 * confidently not the product of the two numbers on screen.
 */

describe("groupDigits", () => {
	test("groups the integer part in threes", () => {
		expect(groupDigits("100")).toBe("100");
		expect(groupDigits("1234")).toBe("1,234");
		expect(groupDigits("1234567")).toBe("1,234,567");
		expect(groupDigits("1234567890")).toBe("1,234,567,890");
	});

	test("leaves the decimals untouched", () => {
		expect(groupDigits("1234.5")).toBe("1,234.5");
		expect(groupDigits("1234567.89")).toBe("1,234,567.89");
		expect(groupDigits("123.456")).toBe("123.456", "decimals are never regrouped");
	});

	test("an empty input stays empty", () => {
		expect(groupDigits("")).toBe("");
		expect(groupDigits(null)).toBe("");
		expect(groupDigits(undefined)).toBe("");
	});

	test("stray separators and symbols in the integer part are dropped", () => {
		// A pasted value, or grouping arriving twice.
		expect(groupDigits("1,234")).toBe("1,234");
		expect(groupDigits("$1234567")).toBe("1,234,567");
		expect(groupDigits("12a34b567")).toBe("1,234,567");
	});

	test("handles zero and a lone decimal point", () => {
		expect(groupDigits("0")).toBe("0");
		expect(groupDigits(".")).toBe(".");
		expect(groupDigits(".5")).toBe(".5");
	});

	test("a negative value groups its magnitude and keeps the sign", () => {
		// Not reachable from the amount input, but formatConverted can be handed one.
		expect(groupDigits("-1234567")).toBe("1,234,567");
	});
});

describe("sanitizeAmountInput", () => {
	test("keeps digits and a single decimal point", () => {
		expect(sanitizeAmountInput("123")).toBe("123");
		expect(sanitizeAmountInput("123.45")).toBe("123.45");
	});

	test("preserves a trailing point so a decimal can be typed at all", () => {
		// Stripping it would make "12." unreachable.
		expect(sanitizeAmountInput("12.")).toBe("12.");
	});

	test("drops a second decimal point", () => {
		expect(sanitizeAmountInput("1.2.3")).toBe("1.23");
	});

	test("removes letters, currency symbols and separators", () => {
		expect(sanitizeAmountInput("1a2b3")).toBe("123");
		expect(sanitizeAmountInput("$1,234")).toBe("1234");
		expect(sanitizeAmountInput("-12")).toBe("12", "a converter takes a magnitude");
	});

	test("empty stays empty", () => {
		expect(sanitizeAmountInput("")).toBe("");
		expect(sanitizeAmountInput(null)).toBe("");
	});

	test("refuses amounts beyond what a double can represent", () => {
		// 8.99e23 is far past Number.MAX_SAFE_INTEGER. Converting it produces a
		// figure that is not the product of the two numbers on screen.
		const capped = sanitizeAmountInput("898989898989898898989898");
		expect(Number(capped)).toBeLessThanOrEqual(MAX_AMOUNT);
		expect(capped).not.toBe("898989898989898898989898");
	});

	test("allows anything up to the ceiling", () => {
		expect(Number(sanitizeAmountInput("999999999999999"))).toBeLessThanOrEqual(MAX_AMOUNT);
		expect(sanitizeAmountInput("999999999999999")).toBe("999999999999999");
	});

	test("truncates from the right so typing stops at the ceiling", () => {
		// Typing left to right, the field keeps responding and simply stops
		// accepting digits rather than discarding what is already there.
		const capped = sanitizeAmountInput("10000000000000000");
		expect(Number(capped)).toBeLessThanOrEqual(MAX_AMOUNT);
	});

	test("an over-long amount with decimals is still capped on the integer part", () => {
		const capped = sanitizeAmountInput("99999999999999999.25");
		expect(Number(capped)).toBeLessThanOrEqual(MAX_AMOUNT);
	});
});

describe("formatConverted", () => {
	test("two decimals, grouped", () => {
		expect(formatConverted(1234.5)).toBe("1,234.50");
		expect(formatConverted(0)).toBe("0.00");
	});

	test("appends the currency as a unit", () => {
		expect(formatConverted(1327.68, "NGN")).toBe("1,327.68 NGN");
	});

	test("null rather than zero when there is nothing to show", () => {
		// The caller has to be able to tell "no amount entered" from "zero".
		expect(formatConverted(null)).toBeNull();
		expect(formatConverted(undefined)).toBeNull();
		expect(formatConverted(Number.NaN)).toBeNull();
		expect(formatConverted(Number.POSITIVE_INFINITY)).toBeNull();
	});

	test("never falls back to scientific notation", () => {
		// `toFixed` silently returns exponential form above 1e21, which then gets
		// mangled by grouping into something like "1.19357090909090927".
		const atMax = MAX_AMOUNT * 1327.68;
		const out = formatConverted(atMax);
		expect(out).not.toMatch(/e\+/i);
		expect(out).toMatch(/^\d{1,3}(,\d{3})*\.\d{2}$/);
	});

	test("a large but representable figure stays exact", () => {
		expect(formatConverted(677113384994802176)).toBe("677,113,384,994,802,176.00");
	});
});

describe("figureSizeClass", () => {
	test("gets smaller as the figure gets longer", () => {
		const short = figureSizeClass("132,768.00");
		const medium = figureSizeClass("1,639,109,914.56");
		const long = figureSizeClass("898,989,898,989,898,956,800.00");

		expect(short).toBe("text-2xl");
		expect(medium).toBe("text-lg");
		expect(long).toBe("text-sm");
	});

	test("always returns a size, for anything", () => {
		for (const input of ["", "1", "1,234,567.89", "9".repeat(200)]) {
			expect(figureSizeClass(input)).toMatch(/^text-/);
		}
	});

	test("an absent figure gets the large size, since it renders as 0.00", () => {
		expect(figureSizeClass(undefined)).toBe("text-2xl");
		expect(figureSizeClass(null)).toBe("text-2xl");
	});
});
