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