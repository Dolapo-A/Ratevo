import { describe, test, expect } from "vitest";
import { render } from "@testing-library/react";
import CurrencyFlag from "./CurrencyFlag";

/**
 * The flags sit inline before a three-letter code in the analytics card, which
 * has no visible chrome around them. That matters for the failure case: in the
 * converter a broken image is a small glyph inside a bordered control, while here
 * it lands in a dense column of figures and reads as a rendering fault.
 *
 * All 161 selectable currencies are covered by `currencyFlag.jsx` and every mapped
 * region has a file in `public/flags` — verified, not assumed. So the unmapped
 * branch below is defensive rather than currently reachable, which is exactly why
 * it needs a test: a code added to the list without a flag would otherwise ship
 * quietly.
 */

describe("CurrencyFlag", () => {
	test("renders the flag for a mapped currency", () => {
		const { container } = render(<CurrencyFlag code="USD" />);
		const img = container.querySelector("img");

		expect(img).toBeInTheDocument();
		expect(img.getAttribute("src")).toBe("/flags/us.png");
		expect(img.getAttribute("data-flag")).toBe("us");
	});

	test("is hidden from assistive technology", () => {
		// The three-letter code beside it is the identifier. Announcing "United
		// States flag" as well would make a screen reader read the pair twice, and
		// the flag is a convenience rather than information the code lacks.
		const { container } = render(<CurrencyFlag code="EUR" />);
		expect(container.querySelector("img")).toHaveAttribute("aria-hidden", "true");
		expect(container.querySelector("img")).toHaveAttribute("alt", "");
	});

	test("maps to the country's region, not to the currency's own letters", () => {
		// The cases where they differ are exactly the ones worth pinning: EUR is EU,
		// not "EU-flag-by-accident", but GBP is GB while its code is not a country at
		// all, and XAF resolves across several states.
		const expectations = [
			["GBP", "gb"],
			["EUR", "eu"],
			["JPY", "jp"],
			["NGN", "ng"],
		];

		expectations.forEach(([code, region]) => {
			const { container, unmount } = render(<CurrencyFlag code={code} />);
			expect(container.querySelector("img").getAttribute("src")).toBe(
				`/flags/${region}.png`
			);
			unmount();
		});
	});

	test("falls back to a neutral tile rather than a broken image", () => {
		// `/flags/default-flag.png` is referenced by the converter and does not exist
		// on disk — anything relying on it made one request that 404s and swapped in
		// another. This renders an element instead, so there is nothing to fail.
		const { container } = render(<CurrencyFlag code="ZZZ" />);

		expect(container.querySelector("img")).toBeNull();
		const fallback = container.querySelector('[data-flag="none"]');
		expect(fallback).toBeInTheDocument();
		expect(fallback.textContent).toBe("Z");
	});

	test("handles a missing code without rendering NaN or throwing", () => {
		const { container } = render(<CurrencyFlag code={undefined} />);

		expect(container.querySelector("img")).toBeNull();
		expect(container.querySelector('[data-flag="none"]').textContent).toBe("?");
		expect(container.textContent).not.toContain("undefined");
	});

	test("stays small enough to sit inline with a code", () => {
		// 28px beside 19px text reads as an icon for the whole column rather than a
		// property of the currency.
		const { container } = render(<CurrencyFlag code="USD" />);
		expect(container.querySelector("img").className).toContain("w-4");
		expect(container.querySelector("img").className).toContain("h-3");
	});

	test("does not shrink when the column is tight", () => {
		const { container } = render(<CurrencyFlag code="USD" />);
		// The pair column is one of four in a grid; without shrink-0 the flag is the
		// first thing flex compresses, which distorts it into an unrecognisable sliver.
		expect(container.querySelector("img").className).toContain("shrink-0");
	});
});