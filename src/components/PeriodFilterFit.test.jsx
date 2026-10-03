import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import PeriodFilter from "./PeriodFilter";
import { PERIODS } from "../config/periods";

/**
 * Six options in a fixed-width pill does not fit a phone, and the first version
 * did not try: the control was `shrink-0` beside a text column that also refused
 * to shrink, so the pair together pushed the pill past the right edge of the card.
 * The 1Y option was off-screen with no scrollbar to reveal it — a control that
 * existed in the DOM and could not be reached.
 *
 * The fix is proportion rather than overflow, because a control you have to scroll
 * to find is worse than one that fits: on mobile the options share the available
 * width equally, and from `sm` up they go back to a fixed width so the pill stops
 * growing across a wide screen.
 */

const change = { 1: 0.22, 7: 0.13, 30: 0.11, 90: -2.83, 180: -3.62, 365: null };
const changeLabel = { 1: "24 hour", 7: "7 day", 30: "30 day", 90: "90 day", 180: "6 month", 365: "1 year" };

function renderFilter(overrides = {}) {
	return render(
		<PeriodFilter value={30} onchange={() => {}} change={change} changeLabel={changeLabel} {...overrides} />
	);
}

describe("the period filter fits its container", () => {
	test("takes the full width on mobile and stops growing above sm", () => {
		const { container } = renderFilter();
		const group = container.querySelector('[role="group"]');

		// `w-full sm:w-auto` rather than a scroll container: a control you have to
		// scroll to find is a worse answer than one that fits.
		expect(group.className).toContain("w-full");
		expect(group.className).toContain("sm:w-auto");

		// `shrink-0` was what pushed it off the edge in the first place — it is
		// still correct from `sm` up, where there is room for a fixed-width pill, so
		// the assertion is that the bare class is gone rather than never present.
		// Precise: `sm:shrink-0` is still wanted above the breakpoint, so this
		// asserts on the bare class rather than on the substring, which would also
		// match the responsive one and so could never fail.
		expect(group.className.split(/\s+/)).not.toContain("shrink-0");
	});

	test("every option shares the width rather than demanding its own", () => {
		const { container } = renderFilter();
		const buttons = [...container.querySelectorAll('[role="group"] button')];

		expect(buttons).toHaveLength(PERIODS.length);

		buttons.forEach((button) => {
			// flex-1 on mobile so the six share what is there; flex-none from sm up
			// so the pill stops stretching across a desktop.
			expect(button.className).toContain("flex-1");
			expect(button.className).toContain("sm:flex-none");

			// min-w-0 is what allows the shrink to happen at all. With the old
			// min-w-[3.25rem] floor six options could never fit below ~330px.
			expect(button.className).toContain("min-w-0");

			// The floor is retained where there is room for it.
			expect(button.className).toContain("sm:min-w-[3.75rem]");
		});
	});

	test("still offers every window, including the one the engine cannot measure", () => {
		renderFilter();
		// 1Y is unmeasurable on the current dataset. Removing the option would hide
		// the fact that the window exists and cannot yet be answered; a dash states
		// it, which is the rule the rest of the panel follows.
		expect(screen.getByText("1Y")).toBeInTheDocument();
		expect(screen.getByText("—")).toBeInTheDocument();
	});

	test("each option remains a real button with its change", () => {
		renderFilter();

		const thirtyDay = screen.getByRole("button", { name: /30D/ });
		expect(thirtyDay).toHaveAttribute("aria-pressed", "true");
		expect(thirtyDay.textContent).toContain("0.11%");
	});

	test("keeps a 44px-tall touch target despite the tighter mobile padding", () => {
		const { container } = renderFilter();
		const button = container.querySelector('[role="group"] button');

		// The padding shrinks on mobile to fit six options; the target must not.
		// `py-1.5` plus two ~10px lines clears 44px, and the assertion is on the
		// padding rather than a computed height because jsdom has no layout.
		expect(button.className).toContain("py-1.5");
	});
});