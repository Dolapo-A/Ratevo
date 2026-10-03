import { describe, test, expect } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import IntelligenceCard from "./IntelligenceCard";

/**
 * The summary card replaced three separate surfaces plus a six-window strip, so
 * it carries the product's whole honesty rule in a much smaller space. Every
 * case below is one where the engine declined to answer and the card could have
 * quietly printed a number instead.
 */

/** A complete response: everything measurable. */
function fullAnalytics(overrides = {}) {
	return {
		period: 30,
		range: {
			requested: 30,
			days: 30,
			partial: false,
			low: 1321.23,
			high: 1335.69,
			lowDate: "2026-09-08",
			highDate: "2026-09-20",
			positionPct: 45,
			label: "Mid-range",
		},
		trend: "neutral",
		trendLabel: "Neutral",
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
				{ key: "trend", label: "Trend", value: 50, weight: 0.25, note: "" },
				{ key: "stability", label: "Stability", value: 100, weight: 0.2, note: "" },
			],
		},
		...overrides,
	};
}

/** A response from a dataset too young for anything. */
function emptyAnalytics() {
	return {
		period: 90,
		range: null,
		trend: null,
		trendLabel: null,
		persistence: null,
		volatility: null,
		volatilityLabel: null,
		annualisedVolPct: null,
		score: null,
		scoreBand: null,
		measured: { requested: 90, spanDays: 89, substituted: true },
		coverage: { missingCount: 1 },
		scoreDetail: { reason: "Insufficient history to measure: performance, trend, stability" },
	};
}

const props = { baseCurrency: "USD", quoteCurrency: "NGN" };

describe("IntelligenceCard", () => {
	test("the three measurements are shown side by side", () => {
		const { container } = render(<IntelligenceCard analytics={fullAnalytics()} {...props} />);

		const col = (name) => within(container.querySelector(`[data-measure="${name}"]`));

		const range = col("30-day range");
		expect(range.getByText("1,321.23 – 1,335.69")).toBeInTheDocument();
		expect(range.getByText("Mid-range · 45%")).toBeInTheDocument();

		const trend = col("Trend");
		expect(trend.getByText("Neutral")).toBeInTheDocument();
		expect(trend.getByText("40% of sessions closed higher")).toBeInTheDocument();

		const vol = col("Volatility");
		expect(vol.getByText("Low")).toBeInTheDocument();
		expect(vol.getByText("3.1% annualised")).toBeInTheDocument();
	});

	test("the score sits beneath the measurements, with its band and its limits", async () => {
		render(<IntelligenceCard analytics={fullAnalytics()} {...props} />);

		const gauge = screen.getByLabelText(/Ratevo score 54 out of 100, Balanced/);
		// The figure counts up to its final value, so assert on the settled number
		// rather than whichever frame the assertion happened to land on.
		await waitFor(() => expect(gauge).toHaveTextContent("54"));

		expect(screen.getByText(/^Ratevo score$/)).toBeInTheDocument();
		expect(screen.getByText("Balanced")).toBeInTheDocument();
		// The disclaimer sits with the number, not in a footer.
		expect(screen.getByText("A trend rating, not a forecast.")).toBeInTheDocument();
	});

	test("the gauge shows the score, not a rounded placeholder", () => {
		render(<IntelligenceCard analytics={fullAnalytics({ score: 63, scoreBand: "Positive" })} {...props} />);

		const gauge = screen.getByLabelText(/Ratevo score 63 out of 100, Positive/);
		// A semicircle: one path for the empty track, one for the fill.
		expect(gauge.querySelectorAll("path")).toHaveLength(2);
		expect(gauge.getAttribute("viewBox")).toBe("0 0 104 60");
	});

	test("the breakdown is closed by default and opens on request", async () => {
		render(<IntelligenceCard analytics={fullAnalytics()} {...props} />);

		const toggle = screen.getByRole("button", { name: /see breakdown/i });
		expect(toggle).toHaveAttribute("aria-expanded", "false");
		expect(screen.queryByText("Stability")).not.toBeInTheDocument();

		await userEvent.click(toggle);

		expect(toggle).toHaveAttribute("aria-expanded", "true");
		expect(toggle).toHaveAccessibleName(/hide breakdown/i);
		for (const label of ["Performance", "Trend", "Momentum", "Stability"]) {
			expect(screen.getAllByText(label).length).toBeGreaterThan(0);
		}
		// Weights and the formula, so the number is defensible rather than asserted.
		expect(screen.getByText(/score = 0\.30·performance/)).toBeInTheDocument();
		expect(screen.getByText(/v1\.0\.0/)).toBeInTheDocument();
	});

	test("a withheld score shows the engine's reason and offers no breakdown", () => {
		// The button is only offered when there is something to open. A disclosure
		// that reveals nothing is worse than no disclosure.
		render(<IntelligenceCard analytics={emptyAnalytics()} {...props} />);

		expect(screen.getByText(/Insufficient history to measure/)).toBeInTheDocument();
		expect(screen.queryByRole("button", { name: /breakdown/i })).not.toBeInTheDocument();
		expect(screen.queryByLabelText(/Ratevo score/)).not.toBeInTheDocument();
	});

	test("unmeasurable measurements read as a dash with a reason, never as 0", () => {
		render(<IntelligenceCard analytics={emptyAnalytics()} {...props} />);

		for (const reason of [
			/Not enough history to measure a range yet/,
			/Not enough history to measure a trend yet/,
			/Not enough history to measure volatility yet/,
		]) {
			expect(screen.getByText(reason)).toBeInTheDocument();
		}
		// 0.00 would read as a real measurement.
		expect(screen.queryByText(/^0\.00/)).not.toBeInTheDocument();
		expect(screen.queryByText("Low")).not.toBeInTheDocument();
	});

	test("the range heading names the window that was actually measured", () => {
		// 177 days of data must not be labelled "180-day range".
		const { container } = render(
			<IntelligenceCard
				analytics={fullAnalytics({
					range: { ...fullAnalytics().range, requested: 180, days: 177, partial: true },
				})}
				{...props}
			/>
		);
		expect(container.querySelector('[data-measure="177-day range"]')).toBeTruthy();
		expect(container.querySelector('[data-measure="180-day range"]')).toBeNull();
	});

	test("a substituted window is stated under the score", () => {
		render(
			<IntelligenceCard
				analytics={fullAnalytics({
					measured: { requested: 90, spanDays: 89, substituted: true },
				})}
				{...props}
			/>
		);
		expect(
			screen.getByText(/Measured over 89 days — the 90-day window is not yet available/)
		).toBeInTheDocument();
	});

	test("a score with no components offers no breakdown button", () => {
		// Defensive: a score value with nothing behind it should not present a
		// control that opens an empty panel.
		const a = fullAnalytics();
		render(
			<IntelligenceCard
				analytics={fullAnalytics({ scoreDetail: { ...a.scoreDetail, components: [] } })}
				{...props}
			/>
		);
		expect(screen.getByLabelText(/Ratevo score 54/)).toBeInTheDocument();
		expect(screen.queryByRole("button", { name: /breakdown/i })).not.toBeInTheDocument();
	});

	test("the pair is named for assistive technology", () => {
		render(<IntelligenceCard analytics={fullAnalytics()} {...props} />);
		const sr = document.querySelector(".sr-only");
		expect(within(sr).getByText(/Range, trend and volatility for USD to NGN/)).toBeTruthy();
	});

	test("it renders nothing without analytics", () => {
		const { container } = render(<IntelligenceCard analytics={null} {...props} />);
		expect(container).toBeEmptyDOMElement();
	});
});
