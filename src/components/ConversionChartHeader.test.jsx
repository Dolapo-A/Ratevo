import { describe, test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ConversionChart from "./ConversionChart";

/**
 * The header states "1 USD = 1,330.64 NGN". Both halves come from different
 * places — the rate from the quote query, the currencies from the selected pair —
 * and this file exists because those two can disagree.
 *
 * Changing the window changes the history query key, which drops its data to
 * undefined for a frame. The quote is keyed separately and survives that frame, so
 * the header had a rate to print and no currencies to print it between. It
 * rendered "1 undefined = 1330.64 undefined" — a figure that looks like a
 * measurement and belongs to no pair at all.
 */

// The loading animation is a canvas-based Lottie, and jsdom has no canvas. It is
// mocked here rather than installed because the header is what is under test, and
// nothing about a rate line depends on an animation being able to draw.
vi.mock("./LoadingComponent", () => ({
	default: () => <div data-testid="lottie" />,
}));

// Recharts measures its container, which jsdom reports as zero. Stubbing the
// chart leaves the header, which is what is under test here.
vi.mock("recharts", () => ({
	ResponsiveContainer: ({ children }) => <div>{children}</div>,
	AreaChart: ({ children }) => <div>{children}</div>,
	Area: () => null,
	XAxis: () => null,
	YAxis: () => null,
	Tooltip: () => null,
	CartesianGrid: () => null,
	ReferenceLine: () => null,
}));

const data = [
	{ date: "2026-09-20", value: 1320.1 },
	{ date: "2026-09-25", value: 1325.4 },
	{ date: "2026-10-03", value: 1330.6356 },
];

function renderChart(overrides = {}) {
	return render(
		<ConversionChart
			data={data}
			base="USD"
			quote="NGN"
			conversionRate={1330.6356}
			isLoading={false}
			error={null}
			period={30}
			setPeriod={() => {}}
			change={{}}
			changeLabel={{}}
			{...overrides}
		/>
	);
}

describe("the chart header", () => {
	test("names the pair the rate belongs to", () => {
		renderChart();
		expect(screen.getByText(/1 USD = /)).toBeInTheDocument();
		expect(screen.getByText(/NGN$/)).toBeInTheDocument();
	});

	test("never prints undefined beside a real rate", () => {
		// The exact failure: a rate that resolved, currencies that had not.
		renderChart({ base: undefined, quote: undefined });
		expect(screen.queryByText(/undefined/)).not.toBeInTheDocument();
	});

	test("withholds the rate line when either currency is missing", () => {
		// "1 undefined = 1330.64 undefined" is worse than no line at all — it looks
		// like a measurement and belongs to no pair.
		renderChart({ base: undefined });
		expect(screen.getByText("Loading current rate…")).toBeInTheDocument();
		expect(screen.queryByText(/1330/)).not.toBeInTheDocument();
	});

	test("withholds it for an empty-string currency too", () => {
		// toCurrency starts as "" and is set from a geo lookup, so the blank case is
		// the common one, not an edge case.
		renderChart({ quote: "" });
		expect(screen.getByText("Loading current rate…")).toBeInTheDocument();
	});

	test("shows the rate again once the pair is known", () => {
		// The withholding is a function of the current props, not a one-way latch.
		const { rerender } = renderChart({ quote: "" });
		expect(screen.getByText("Loading current rate…")).toBeInTheDocument();

		rerender(
			<ConversionChart
				data={data}
				base="USD"
				quote="NGN"
				conversionRate={1330.6356}
				isLoading={false}
				error={null}
				period={30}
				setPeriod={() => {}}
				change={{}}
				changeLabel={{}}
			/>
		);
		expect(screen.getByText(/1 USD = /)).toBeInTheDocument();
	});

	test("prints nothing undefined anywhere in the header", () => {
		// Belt and braces across both header lines, including the date range, which
		// is built from the data and so has its own failure mode when data is absent.
		const { container } = renderChart({ data: [], base: undefined, quote: undefined });
		expect(container.textContent).not.toContain("undefined");
		expect(container.textContent).not.toContain("NaN");
	});
});