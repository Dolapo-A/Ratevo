import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import RangeExtremes from "./RangeExtremes";

/**
 * A range figure without its dates is half an answer, and this component sits on
 * the one surface where a wrong date would be trusted most — it is directly under
 * the number it explains.
 *
 * The cases below are the ways it can go wrong: inventing a date the engine
 * withheld, attaching the low to the wrong end, or dropping both labels and
 * leaving colour to do the work alone.
 */

function rangeWith(overrides = {}) {
	return {
		requested: 30,
		days: 30,
		partial: false,
		low: 1321.23,
		high: 1335.69,
		lowDate: "2026-09-08",
		highDate: "2026-09-20",
		positionPct: 65,
		label: "Upper part of range",
		...overrides,
	};
}

describe("RangeExtremes", () => {
	test("names the day the low and the high fell on", () => {
		render(<RangeExtremes range={rangeWith()} />);

		expect(screen.getByText("Low")).toBeInTheDocument();
		expect(screen.getByText("High")).toBeInTheDocument();
		expect(screen.getByText("8 Sept")).toBeInTheDocument();
		expect(screen.getByText("20 Sept")).toBeInTheDocument();
	});

	test("keeps the year visible on a date that is not from this year", () => {
		// A 1Y window reaches back past new year, so one end can be last December
		// while the other is this January. Without the year those two dates read as
		// the same month eleven months apart.
		const thisYear = new Date().toISOString().slice(0, 4);
		const lastYear = String(Number(thisYear) - 1);

		render(
			<RangeExtremes
				range={rangeWith({ lowDate: `${lastYear}-12-20`, highDate: `${thisYear}-01-04` })}
			/>
		);

		expect(screen.getByText(`20 Dec ${lastYear}`)).toBeInTheDocument();
		// This one IS this year, so it stays short — the year is only spelled out
		// where it would otherwise be ambiguous.
		expect(screen.getByText("4 Jan")).toBeInTheDocument();
	});

	test("tells assistive tech when the range crosses a year boundary", () => {
		// The visible labels stay short; this is the version that carries the full
		// picture for anyone not reading the dates by eye.
		const thisYear = new Date().toISOString().slice(0, 4);
		const lastYear = String(Number(thisYear) - 1);

		render(
			<RangeExtremes
				range={rangeWith({ lowDate: `${lastYear}-12-20`, highDate: `${thisYear}-01-04` })}
			/>
		);

		expect(
			screen.getByText(/spans more than one calendar year/i)
		).toBeInTheDocument();
	});

	test("does not attach the low to the high's date", () => {
		// The whole point of the component is that these two are distinguishable.
		const { container } = render(
			<RangeExtremes range={rangeWith({ lowDate: "2026-09-08", highDate: "2026-09-20" })} />
		);

		const text = container.textContent;
		expect(text).toMatch(/Low\s+8 Sept/);
		expect(text).toMatch(/High\s+20 Sept/);
	});

	test("shows nothing at all when the engine withheld both dates", () => {
		// A window that never moved has no low day and no high day. Rendering a
		// substituted date here would be the fabrication this product exists to
		// avoid, so the honest result is no row.
		const { container } = render(
			<RangeExtremes range={rangeWith({ low: 7, high: 7, lowDate: null, highDate: null })} />
		);

		expect(container).toBeEmptyDOMElement();
		expect(screen.queryByText("Low")).not.toBeInTheDocument();
	});

	test("withholds the row when only one date is missing", () => {
		// Half a row would read as a measurement of the other end too.
		const { container } = render(
			<RangeExtremes range={rangeWith({ lowDate: "2026-09-08", highDate: null })} />
		);
		expect(container).toBeEmptyDOMElement();
	});

	test("renders nothing without a range", () => {
		expect(render(<RangeExtremes range={null} />).container).toBeEmptyDOMElement();
		expect(render(<RangeExtremes />).container).toBeEmptyDOMElement();
	});

	test("carries a word beside every colour, so colour is never the only signal", () => {
		// A red/green pair is invisible to a red-green colourblind reader. Each dot
		// is paired with its own word for exactly that reason.
		const { container } = render(<RangeExtremes range={rangeWith()} />);

		const labels = container.querySelectorAll("[data-tone]");
		expect(labels).toHaveLength(2);
		expect(screen.getByText("Low")).toBeInTheDocument();
		expect(screen.getByText("High")).toBeInTheDocument();

		labels.forEach((dot) => expect(dot).toHaveAttribute("aria-hidden", "true"));
	});

	test("uses dashes rather than printing an unusable date", () => {
		render(<RangeExtremes range={rangeWith({ lowDate: "2026-02-30" })} />);

		// 30 February is not a day; Date would roll it to 1 March.
		expect(screen.getByText("—")).toBeInTheDocument();
		expect(screen.queryByText(/Mar/)).not.toBeInTheDocument();
	});
});