import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import WhatChanged from "./WhatChanged";

/**
 * The card has two layers that must never be confused: measured figures the
 * engine produced, and — once switched on — a model's interpretation of them.
 *
 * These tests pin the boundary. The important ones are the negative cases: an
 * unmeasured comparison must render no numbers at all, and Layer 2 must stay
 * invisible while its flag is off, because a generated sentence appearing beside
 * a measured one without a register marking it is exactly the confusion the
 * layering exists to prevent.
 */

function analyticsWith(overrides = {}) {
	return {
		period: 30,
		periodLabel: "30D",
		changePct: 0.11,
		priorPeriod: -2.61,
		deltaPp: 2.72,
		acceleration: "faster",
		trendLabel: "Neutral",
		volatilityLabel: "Low",
		momentumLabel: "Moderate",
		coverage: { available: 359 },
		changeSummary: {
			text: "The pair gained 0.1% over the last 30 days, compared with a loss of 2.6% during the preceding 30 days. Recent movement is therefore stronger than the previous period.",
			direction: "up",
			verdict: "faster",
		},
		move: { from: 1321.23, to: 1322.69, abs: 1.46, pct: 0.11, spanDays: 30 },
		priorMove: { from: 1357.11, to: 1350.42, abs: -6.69, pct: -0.49 },
		...overrides,
	};
}

describe("WhatChanged", () => {
	test("leads with the difference in percentage points", () => {
		render(<WhatChanged analytics={analyticsWith()} />);
		expect(screen.getByText("+2.7 percentage points")).toBeInTheDocument();
	});

	test("shows both windows as bars, labelled and signed", () => {
		render(<WhatChanged analytics={analyticsWith()} />);

		expect(screen.getByText("Last 30D")).toBeInTheDocument();
		expect(screen.getByText("Prior 30D")).toBeInTheDocument();
		expect(screen.getByText("+0.1%")).toBeInTheDocument();
		expect(screen.getByText("−2.6%")).toBeInTheDocument();
	});

	test("renders the engine's sentence rather than composing one here", () => {
		render(<WhatChanged analytics={analyticsWith()} />);
		expect(screen.getByText(/The pair gained 0\.1%/)).toBeInTheDocument();
	});

	/* ------------------------------------------------------------------ *
	 * The price difference behind each percentage
	 *
	 * A percentage is a ratio and hides scale. "0.1%" is about a naira and a half
	 * on USD/NGN and a rounding error on a pair quoted in the hundredths, so the
	 * level each bar moved between is shown too.
	 *
	 * The cases that matter are the negative ones: the levels come from the engine
	 * rather than being multiplied back out of the rounded percentage, and an
	 * absent level must leave the row showing its percentage alone.
	 * ------------------------------------------------------------------ */

	test("shows the level each window moved between, and by how much", () => {
		render(<WhatChanged analytics={analyticsWith()} />);

		// Last window: 1,321.23 → 1,322.69, a rise of 1.46.
		expect(
			screen.getByText("1,321.23 → 1,322.69 (+1.46)")
		).toBeInTheDocument();

		// Prior window fell, so the sign has to be negative — a bare "6.69" beside a
		// red bar would leave the direction to be inferred from colour.
		expect(
			screen.getByText("1,357.11 → 1,350.42 (−6.69)")
		).toBeInTheDocument();
	});

	test("never derives the difference from the rounded percentage", () => {
		// The percentage on screen is rounded to one decimal for reading. Multiplying
		// 0.11% back out by the rate gives 1.45, not the measured 1.46 — so a
		// client-side derivation produces a number that looks right and is not.
		render(<WhatChanged analytics={analyticsWith()} />);

		expect(screen.getByText(/\+1\.46/)).toBeInTheDocument();
		expect(screen.queryByText(/\+1\.45/)).not.toBeInTheDocument();
	});

	test("shows the percentage alone when the engine withheld the level", () => {
		// `move: null` means the difference was too small to state at any honest
		// precision. Inventing a level here is the fabrication this product exists
		// to avoid, so the row simply carries the percentage.
		render(<WhatChanged analytics={analyticsWith({ move: null, priorMove: null })} />);

		expect(screen.getByText("+0.1%")).toBeInTheDocument();
		expect(screen.getByText("−2.6%")).toBeInTheDocument();

		// Scoped to the level rows rather than the whole card: an arrow requires two
		// known endpoints, so one unknown endpoint is as good as none, and a
		// half-printed pair is a measurement of something that was not measured.
		expect(document.querySelectorAll("[data-levels]")).toHaveLength(0);
	});

	test("treats a single known endpoint as no endpoint at all", () => {
		// One level with nothing to compare it against is not half a measurement, and
		// "1,321.23 → —" invites the reader to supply the other end themselves.
		render(
			<WhatChanged
				analytics={analyticsWith({
					move: { from: 1321.23, to: null, abs: null },
					priorMove: { from: null, to: null, abs: null },
				})}
			/>
		);

		expect(document.querySelectorAll("[data-levels]")).toHaveLength(0);
		expect(screen.queryByText(/1,321\.23/)).not.toBeInTheDocument();
	});

	test("shows the percentage alone when the levels are unusable", () => {
		render(
			<WhatChanged
				analytics={analyticsWith({
					move: { from: null, to: null, abs: null },
					priorMove: { from: 1357.11, to: 1350.42, abs: null },
				})}
			/>
		);

		// The prior window still has levels, so it keeps them — with its difference
		// withheld, which means the arrow and no signed amount. Only the window with
		// nothing at all to state loses its line entirely.
		expect(screen.getByText("1,357.11 → 1,350.42")).toBeInTheDocument();
		expect(screen.queryByText(/1,321\.23/)).not.toBeInTheDocument();

		// The unusable window must render no level row at all — not a row of em
		// dashes, which reads as a measurement of two missing numbers rather than an
		// admission that there is nothing to state. Scoped to this window's own
		// marker, because the prior window legitimately still shows an arrow.
		const lastRow = document.querySelector('[data-window="now"]');
		expect(lastRow.querySelector("[data-levels]")).toBeNull();
		expect(lastRow.textContent).not.toContain("→");
		expect(lastRow.textContent).not.toContain("—");
	});

	test("a tiny pair keeps its decimals instead of printing a zero", () => {
		// Rounded to two decimals this move is 0.00, which claims nothing happened
		// on a pair that did move. The engine's own precision has to survive.
		render(
			<WhatChanged
				analytics={analyticsWith({
					move: { from: 0.00012, to: 0.00011964, abs: -0.00000036, pct: -0.3 },
					priorMove: null,
				})}
			/>
		);

		expect(screen.getByText(/0\.00012 → 0\.00011964/)).toBeInTheDocument();
		expect(screen.queryByText("−0")).not.toBeInTheDocument();
	});

	test("prints a whole rate at the same two decimals as every other rate on the page", () => {
		render(
			<WhatChanged
				analytics={analyticsWith({
					move: { from: 8, to: 9, abs: 1, pct: 12.5 },
					priorMove: null,
				})}
			/>
		);

		// Not for the precision — FX rates are conventionally quoted to a fixed
		// number of decimals, and the range figure two cards up prints "1,321.23".
		// Printing "8" here would read as a different measurement of the same pair.
		expect(screen.getByText("8.00 → 9.00 (+1.00)")).toBeInTheDocument();
	});

	test("the context line names momentum, trend and volatility", () => {
		// This is what stops the delta being read on its own.
		render(<WhatChanged analytics={analyticsWith()} />);
		expect(screen.getByText("Momentum:")).toBeInTheDocument();
		expect(screen.getByText("Trend:")).toBeInTheDocument();
		expect(screen.getByText("Volatility:")).toBeInTheDocument();
		expect(screen.getByText("Moderate")).toBeInTheDocument();
	});

	test("a negative delta is shown as a loss, never as a minus-signed gain", () => {
		render(
			<WhatChanged
				analytics={analyticsWith({
					changePct: -2.83,
					priorPeriod: -0.82,
					deltaPp: -2.01,
					acceleration: "slower",
				})}
			/>
		);
		expect(screen.getByText("−2.0 percentage points")).toBeInTheDocument();
		expect(screen.getByText("Last 30D")).toBeInTheDocument();
	});

	test("an unmeasured comparison renders no figures at all", () => {
		// No bars, no headline, no sentence. Saying "0.0%" would be a fabrication.
		const { container } = render(
			<WhatChanged
				analytics={analyticsWith({ changeSummary: null, priorPeriod: null, deltaPp: null })}
			/>
		);

		expect(screen.getByText(/Not enough history to compare windows/)).toBeInTheDocument();
		expect(screen.queryByText(/percentage points/)).not.toBeInTheDocument();
		expect(screen.queryByText("Last 30D")).not.toBeInTheDocument();
		expect(container.textContent).not.toMatch(/[-+]\d+\.\d%/);
	});

	test("the withheld state states how many windows the comparison needs", () => {
		// Saying "two" when it needs three leaves a reader unable to work out why.
		render(<WhatChanged analytics={analyticsWith({ changeSummary: null })} />);
		expect(screen.getByText(/three full 30D windows/)).toBeInTheDocument();
		expect(screen.getByText(/359 observations/)).toBeInTheDocument();
	});

	test("Layer 2 is invisible while its flag is off", () => {
		render(<WhatChanged analytics={analyticsWith()} />);
		expect(screen.queryByText("Why does it matter?")).not.toBeInTheDocument();
		expect(screen.queryByText("Ratevo Intelligence")).not.toBeInTheDocument();
	});

	test("no causal language appears anywhere in the card", () => {
		// Every clause here is a measured figure. Explaining a cause is Phase 2's
		// job, and it belongs under a different register when it arrives.
		const { container } = render(<WhatChanged analytics={analyticsWith()} />);
		expect(container.textContent).not.toMatch(
			/because|due to|driven by|caused|thanks to|as a result/i
		);
	});

	test("context rows with no value are omitted rather than shown blank", () => {
		render(
			<WhatChanged analytics={analyticsWith({ momentumLabel: null, volatilityLabel: null })} />
		);
		expect(screen.queryByText("Momentum:")).not.toBeInTheDocument();
		expect(screen.queryByText("Volatility:")).not.toBeInTheDocument();
		expect(screen.getByText("Trend:")).toBeInTheDocument();
	});
});