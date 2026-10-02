import { describe, test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PeriodFilter from "./PeriodFilter";
import { PERIODS } from "../config/periods";

/**
 * These tests exist because of a specific bug: the filter was rewritten to put a
 * percentage under each label, and the rewrite silently dropped `onClick`. Six
 * correctly styled buttons rendered, `aria-pressed` stayed put, and nothing
 * failed — the frontend had no tests at all.
 *
 * So the first test is deliberately blunt: a control that renders must do
 * something when pressed. Everything else covers the presentation.
 */

const WINDOWS = PERIODS.map((p) => p.analyticsDays);

/** The engine returns `change` for every window, whatever period was requested. */
function changeFor(values) {
	const change = {};
	WINDOWS.forEach((w, i) => {
		change[w] = values[i] ?? null;
	});
	return change;
}

// Values are given in the order of PERIODS: 24H, 7D, 30D, 90D, 6M, 1Y.
const ALL_MEASURED = changeFor([-0.07, -0.02, -0.37, -3.04, -3.67, -10.58]);
const MIXED = changeFor([-0.07, -0.02, -0.37, null, null, null]);

/** Renders the filter with an arbitrary change map, for direction assertions. */
function ChangeFixture({ change }) {
	return <PeriodFilter value={30} onchange={() => {}} change={change} />;
}

describe("PeriodFilter", () => {
	test("every option is a real button that responds to a click", async () => {
		// The regression that started this file.
		const onchange = vi.fn();
		render(<PeriodFilter value={30} onchange={onchange} change={ALL_MEASURED} />);

		const buttons = screen.getAllByRole("button");
		expect(buttons).toHaveLength(PERIODS.length);

		for (const option of PERIODS) {
			const before = onchange.mock.calls.length;
			await userEvent.click(screen.getByRole("button", { name: new RegExp(option.label) }));
			expect(onchange).toHaveBeenCalledTimes(before + 1);
			expect(onchange.mock.calls.at(-1)[0]).toBe(option.historyDays);
		}
	});

	test("clicking a window reports the chart's own days-back value", async () => {
		// The chart and the analytics use different conventions for a window, so
		// the control has to pass the chart's. Getting this wrong would move the
		// chart without moving the analytics.
		const onchange = vi.fn();
		render(<PeriodFilter value={30} onchange={onchange} change={ALL_MEASURED} />);

		await userEvent.click(screen.getByRole("button", { name: /90D/ }));
		expect(onchange).toHaveBeenCalledWith(90);
	});

	test("exactly one option reports itself as pressed", () => {
		render(<PeriodFilter value={6} onchange={vi.fn()} change={ALL_MEASURED} />);

		const pressed = screen
			.getAllByRole("button")
			.filter((b) => b.getAttribute("aria-pressed") === "true");

		expect(pressed).toHaveLength(1);
		expect(pressed[0].textContent).toContain("7D");
	});

	test("each option shows its own change beneath the label", () => {
		render(<PeriodFilter value={30} onchange={vi.fn()} change={ALL_MEASURED} />);

		expect(screen.getByRole("button", { name: /7D/ })).toHaveTextContent(
			/7D.*0\.02%/s
		);
		expect(screen.getByRole("button", { name: /30D/ })).toHaveTextContent(
			/30D.*0\.37%/s
		);
		expect(screen.getByRole("button", { name: /1Y/ })).toHaveTextContent(
			/1Y.*10\.58%/s
		);
	});

	test("a window with no measurement reads as a dash, never as 0%", () => {
		// The engine refuses to invent these. Rendering 0.00% would be a
		// fabricated number wearing a real value's clothes.
		render(<PeriodFilter value={30} onchange={vi.fn()} change={MIXED} />);

		for (const label of [/90D/, /6M/, /1Y/]) {
			expect(screen.getByRole("button", { name: label })).toHaveTextContent(/—/);
		}
		expect(screen.getByRole("button", { name: /90D/ })).not.toHaveTextContent("0.00%");
	});

	test("a dash still explains itself on hover", () => {
		render(<PeriodFilter value={30} onchange={vi.fn()} change={MIXED} />);
		expect(screen.getByRole("button", { name: /90D/ }).getAttribute("title")).toMatch(
			/not enough history/i
		);
	});

	test("direction is stated with an arrow as well as a sign", () => {
		render(<ChangeFixture change={changeFor([0.07, 0.02, 0.37, 3.04, -3.67, -10.58])} />);

		expect(screen.getByRole("button", { name: /90D/ })).toHaveTextContent("↑");
		expect(screen.getByRole("button", { name: /6M/ })).toHaveTextContent("↓");
		expect(screen.getByRole("button", { name: /1Y/ })).toHaveTextContent("↓");
		// Every value is an absolute magnitude plus a direction marker, so no
		// figure reads as negative.
		expect(screen.getByRole("button", { name: /1Y/ })).not.toHaveTextContent("-10.58%");
	});

	test("a missing change map degrades to dashes rather than crashing", () => {
		// The analytics request has not resolved yet, or is disabled.
		expect(() => render(<PeriodFilter value={30} onchange={vi.fn()} />)).not.toThrow();
		expect(screen.getAllByText("—")).toHaveLength(PERIODS.length);
	});

	test("it renders nothing without a change handler rather than throwing", () => {
		// Preserved from the original component, and it is the reason the old
		// guard existed.
		const { container } = render(<PeriodFilter value={30} change={ALL_MEASURED} />);
		expect(container).toBeEmptyDOMElement();
	});

	test("it renders nothing when the value is absent", () => {
		const { container } = render(
			<PeriodFilter onchange={vi.fn()} change={ALL_MEASURED} />
		);
		expect(container).toBeEmptyDOMElement();
	});
});
