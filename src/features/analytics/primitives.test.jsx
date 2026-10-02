import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RegisterPill } from "./primitives";

/**
 * The register pill is the only sanctioned way to label a kind of statement, so
 * every register it supports has to actually resolve to its own colour.
 *
 * These tokens once sat outside `colors` in tailwind.config.js, which Tailwind
 * ignores without erroring — so `bg-measured-soft` and friends silently
 * produced no utilities at all, and the whole register system rendered as no
 * colour while looking deliberate. A test per register is the cheapest way to
 * stop that class of silent breakage recurring.
 */

const REGISTERS = [
	{ kind: "measured", expectBg: "bg-measured-soft", expectText: "text-measured", expectDot: "bg-measured" },
	{ kind: "ai", expectBg: "bg-ai-soft", expectText: "text-ai", expectDot: "bg-ai" },
	{ kind: "evidence", expectBg: "bg-evidence-soft", expectText: "text-evidence", expectDot: "bg-evidence" },
	{ kind: "possible", expectBg: "bg-possible-soft", expectText: "text-possible", expectDot: "bg-possible" },
];

describe("RegisterPill", () => {
	for (const { kind, expectBg, expectText, expectDot } of REGISTERS) {
		test(`the ${kind} register resolves to its own colour`, () => {
			render(<RegisterPill kind={kind}>{kind}</RegisterPill>);

			const pill = screen.getByText(kind).closest("span");
			expect(pill.className).toContain(expectBg);
			expect(pill.className).toContain(expectText);

			// The dot carries the solid colour; it is the part that stays legible
			// when the pill sits on a tinted background.
			const dot = pill.querySelector("span > span");
			expect(dot?.className).toContain(expectDot);
		});
	}

	test("every register is visually distinct from every other", () => {
		// Guards against a token silently colliding with another — which is what
		// would happen if two registers were given the same value.
		const classes = REGISTERS.map((r) => `${r.expectBg} ${r.expectText} ${r.expectDot}`);
		expect(new Set(classes).size).toBe(REGISTERS.length);
	});

	test("it defaults to measured", () => {
		render(<RegisterPill>default</RegisterPill>);
		expect(screen.getByText("default").closest("span").className).toContain("bg-measured-soft");
	});
});
