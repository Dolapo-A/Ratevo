import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import IntelligenceCard from "./IntelligenceCard";

/**
 * The card is read on a phone as much as on a desktop, and every layout below
 * exists because a narrow viewport produced something worse than cramped:
 *
 *   1. The score row gave the label a column about ten characters wide, so
 *      "Ratevo score · Positive" broke across three lines and the description
 *      beneath it across four.
 *   2. The disclosure sat vertically centred against that tall block, floating in
 *      the middle rather than beside the figure it opens.
 *   3. The period filter overflowed its container and the 1Y option was simply
 *      not on screen.
 *
 * Those are all failures of proportion, and proportion is asserted here through
 * the class names that cause it — jsdom has no layout, so a test cannot measure
 * what a phone would actually render.
 */

function analyticsWith(overrides = {}) {
	return {
		pair: "USD/NGN",
		base: "USD",
		quote: "NGN",
		currentRate: 1330.6356,
		period: 30,
		periodLabel: "30D",
		range: {
			requested: 30,
			days: 30,
			partial: false,
			low: 1321.23,
			high: 1335.69,
			lowDate: "2026-09-08",
			highDate: "2026-09-20",
			positionPct: 65,
			label: "Upper part of range",
		},
		trend: "positive",
		trendLabel: "Positive",
		persistence: 0.4,
		volatility: "low",
		volatilityLabel: "Low",
		annualisedVolPct: 3.11,
		score: 54,
		scoreBand: "Balanced",
		measured: { requested: 30, spanDays: 30, substituted: false },
		coverage: { missingCount: 0 },
		scoreDetail: {
			value: 54,
			band: "balanced",
			version: "1.0.0",
			components: [
				{ key: "performance", label: "Performance", value: 49, weight: 0.3, note: "" },
				{ key: "momentum", label: "Momentum", value: 29, weight: 0.25, note: "" },
			],
		},
		...overrides,
	};
}

const props = { baseCurrency: "USD", quoteCurrency: "NGN" };

describe("the intelligence card on a narrow viewport", () => {
	test("the score row wraps instead of squeezing the label", () => {
		const { container } = render(<IntelligenceCard analytics={analyticsWith()} {...props} />);

		// `flex-wrap` is what lets the disclosure drop to its own line rather than
		// taking width from the label column.
		const row = container.querySelector(".border-t.border-slate-200 > div");
		expect(row.className).toContain("flex-wrap");

		// The label column needs a basis, not just flex-grow: given only `flex-1` it
		// shrank to whatever the disclosure had not already taken.
		const label = screen.getByText(/^Ratevo score$/).closest("div");
		expect(label.className).toMatch(/basis-\[/);
		expect(label.className).toContain("min-w-0");
	});

	test("the breakdown disclosure sits at the top of its own line on mobile", () => {
		render(<IntelligenceCard analytics={analyticsWith()} {...props} />);

		const button = screen.getByRole("button", { name: /breakdown/i });

		// `self-start`, not `self-center` — a control for the score beside it should
		// align to the score, not float in the middle of a four-line paragraph.
		expect(button.className).toContain("self-start");
		expect(button.className).not.toContain("self-center");

		// Full width below `sm`, so it does not compete with the label for a line.
		expect(button.className).toMatch(/w-full/);
		expect(button.className).toMatch(/sm:w-auto/);
	});

	test("the score description sits directly under the score label", () => {
		render(<IntelligenceCard analytics={analyticsWith()} {...props} />);

		// Same wrapper as the label, so the two cannot drift onto separate lines.
		const label = screen.getByText(/^Ratevo score$/).closest("div");
		const description = screen.getByText("A trend rating, not a forecast.");

		expect(label).toContainElement(description);
		expect(label.className).toContain("min-w-0");
	});
});

describe("the card names the pair before measuring it", () => {
	test("leads with the selected pair and its rate", () => {
		const { container } = render(<IntelligenceCard analytics={analyticsWith()} {...props} />);

		const cell = container.querySelector('[data-measure="Selected pair"]');
		expect(cell).toBeTruthy();
		expect(cell.textContent).toContain("USD");
		expect(cell.textContent).toContain("NGN");
		expect(cell.textContent).toContain("1,330.64");
	});

	test("puts a flag in front of each currency code", () => {
		const { container } = render(<IntelligenceCard analytics={analyticsWith()} {...props} />);
		const cell = container.querySelector('[data-measure="Selected pair"]');

		// "USD → NGN" says the direction but not that NGN is what you would be
		// converting into. Flags beside each code say both, and they are the same
		// flags the converter uses, so a pair recognised here is recognised there.
		const flags = cell.querySelectorAll("[data-flag]");
		expect(flags).toHaveLength(2);
		expect(flags[0].getAttribute("data-flag")).toBe("us");
		expect(flags[1].getAttribute("data-flag")).toBe("ng");

		// Each flag must immediately precede its own code. Asserted on the DOM
		// rather than on the rendered text, because the flags are aria-hidden with
		// an empty alt — they contribute no text at all, so the pair reads "USD→NGN"
		// to a reader and to a screen reader, and a text assertion would prove
		// nothing about placement.
		const pairs = [...cell.querySelectorAll("[data-flag]")].map((flag) => {
			// The code lives in the same inline wrapper as the flag.
			const wrapper = flag.parentElement;
			const nodes = [...wrapper.childNodes];

			// `firstElementChild` is not enough: it skips text nodes, so a flag moved
			// *after* its code still reports itself as first, because the code is a
			// bare text node. The flag has to be compared against the first child
			// node of any type.
			return {
				region: flag.getAttribute("data-flag"),
				code: wrapper.textContent.trim(),
				flagLeadsCode: nodes[0] === flag,
			};
		});

		expect(pairs).toEqual([
			{ region: "us", code: "USD", flagLeadsCode: true },
			{ region: "ng", code: "NGN", flagLeadsCode: true },
		]);
	});

	test("renders one flag per code even for a reversed pair", () => {
		const { container } = render(
			<IntelligenceCard
				analytics={analyticsWith({ base: "GBP", quote: "EUR" })}
				baseCurrency="GBP"
				quoteCurrency="EUR"
			/>
		);

		const cell = container.querySelector('[data-measure="Selected pair"]');
		const flags = [...cell.querySelectorAll("[data-flag]")].map((f) =>
			f.getAttribute("data-flag")
		);

		// GBP is GB and EUR is EU — the two codes whose regions are not derivable
		// from the letters, which is where a wrong mapping would show.
		expect(flags).toEqual(["gb", "eu"]);
	});

	test("the pair column comes before the three measurements", () => {
		const { container } = render(<IntelligenceCard analytics={analyticsWith()} {...props} />);

		const cells = [...container.querySelectorAll("[data-measure]")];
		const labels = cells.map((c) => c.getAttribute("data-measure"));

		// Every other figure on the card is a statement about this pair, so the pair
		// is read first rather than looked up.
		expect(labels[0]).toBe("Selected pair");
		expect(labels).toHaveLength(4);
	});

	test("four columns, not three", () => {
		const { container } = render(<IntelligenceCard analytics={analyticsWith()} {...props} />);

		// `lg:` rather than `sm:` — four columns at tablet width gives each about
		// 150px, which is not enough for a range figure and its date labels.
		const grid = container.querySelector("[data-measure]").parentElement;
		expect(grid.className).toContain("lg:grid-cols-4");
		expect(grid.className).toContain("sm:grid-cols-2");
	});

	test("withholds the rate rather than printing a zero for an unmeasured one", () => {
		const { container } = render(
			<IntelligenceCard analytics={analyticsWith({ currentRate: null })} {...props} />
		);

		const cell = container.querySelector('[data-measure="Selected pair"]');
		// The pair still shows — it is known. Only the rate is withheld.
		expect(cell.textContent).toContain("USD");
		expect(cell.textContent).toContain("NGN");
		expect(cell.textContent).not.toContain("0.00");
	});

	test("falls back to the props when the engine names no pair", () => {
		const { container } = render(
			<IntelligenceCard
				analytics={analyticsWith({ pair: undefined, base: undefined, quote: undefined })}
				baseCurrency="EUR"
				quoteCurrency="GBP"
			/>
		);

		const cell = container.querySelector('[data-measure="Selected pair"]');
		expect(cell.textContent).toContain("EUR");
		expect(cell.textContent).toContain("GBP");
	});

	test("shows no pair at all rather than a placeholder, when neither is known", () => {
		const { container } = render(
			<IntelligenceCard
				analytics={analyticsWith({ pair: undefined, base: undefined, quote: undefined })}
				baseCurrency=""
				quoteCurrency=""
			/>
		);

		const cell = container.querySelector('[data-measure="Selected pair"]');
		expect(cell.textContent).not.toContain("undefined");
		expect(cell.textContent).not.toContain("→ →");
	});

	test("never prints undefined anywhere on the card", () => {
		const { container } = render(
			<IntelligenceCard
				analytics={analyticsWith({
					pair: undefined,
					base: undefined,
					quote: undefined,
					currentRate: null,
				})}
				baseCurrency=""
				quoteCurrency=""
			/>
		);

		// One assertion across the whole surface: a single stray `undefined` in a
		// figure reads as a measurement, because everything around it is one.
		expect(container.textContent).not.toContain("undefined");
		expect(container.textContent).not.toContain("NaN");
	});
});
