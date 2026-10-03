import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import IntelligenceCard from "./IntelligenceCard";

/**
 * The score gauge and the range bar both animate when the data lands, which is
 * the kind of behaviour that passes every assertion you would naturally write and
 * still ships broken: `toHaveTextContent("63")` passes whether the number counted
 * up or appeared instantly, and it passes just as happily if the count-up never
 * starts.
 *
 * So these tests drive the clock. requestAnimationFrame is replaced with a queue
 * the test steps by hand, which makes "what was on screen 200ms in" a question
 * with an answer rather than something to sample for and hope.
 */

/** The arc is a semicircle of radius 40, so its length is half the circumference. */
const ARC_LENGTH = Math.PI * 40;

function analytics(score, positionPct) {
	return {
		period: 30,
		range: {
			requested: 30,
			days: 30,
			partial: false,
			low: 1321.23,
			high: 1335.69,
			positionPct,
			label: "Mid-range",
		},
		trend: "positive",
		trendLabel: "Positive",
		persistence: 0.4,
		volatility: "low",
		volatilityLabel: "Low",
		annualisedVolPct: 3.11,
		score,
		scoreBand: "Positive",
		measured: { requested: 30, spanDays: 30, substituted: false },
		coverage: { missingCount: 0 },
		scoreDetail: { value: score, band: "positive", version: "1.0.0", components: [] },
	};
}

const props = { baseCurrency: "USD", quoteCurrency: "NGN" };

let frames;
let clock;

function raf(callback) {
	frames.push(callback);
	return frames.length;
}

/** Advances the virtual clock, then runs every frame callback due in that span. */
function advance(ms) {
	clock += ms;
	act(() => {
		vi.advanceTimersByTime(ms);
	});
	const due = frames;
	frames = [];
	act(() => {
		due.forEach((callback) => callback(clock));
	});
}

function run(count = 80, step = 16) {
	for (let i = 0; i < count; i += 1) advance(step);
}

/**
 * Steps frames until the virtual clock passes a time.
 *
 * Needed because the first animation frame only records when the animation
 * started — it does not move anything. Every measurement after it is one frame
 * behind, so a test that reads a single frame sees the value it started from.
 */
function stepUntilClock(target, step = 16) {
	let guard = 0;
	while (clock < target && guard < 500) {
		advance(step);
		guard += 1;
	}
}

function scoreNow() {
	const gauge = screen.getByLabelText(/Ratevo score/);
	return Number(gauge.querySelector("text").textContent);
}

function arcFill() {
	const gauge = screen.getByLabelText(/Ratevo score/);
	return Number(gauge.querySelectorAll("path")[1].getAttribute("stroke-dashoffset"));
}

function barWidth() {
	return document.querySelector(".bg-measured").style.width;
}

describe("the score gauge and range bar animate in", () => {
	beforeEach(() => {
		frames = [];
		clock = 0;
		vi.useFakeTimers();
		// Assigned after useFakeTimers so this wins: vitest fakes rAF too, and the
		// queue is the only way to land on an exact frame.
		window.requestAnimationFrame = raf;
		window.cancelAnimationFrame = () => {};
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	test("the score counts up rather than appearing finished", () => {
		render(<IntelligenceCard analytics={analytics(63, 65)} {...props} />);

		// Before the delay elapses, the number is at zero. If it were already 63
		// here, there is no animation — just a number that was there all along.
		expect(scoreNow()).toBe(0);

		stepUntilClock(300);
		const mid = scoreNow();
		expect(mid).toBeGreaterThan(0);
		expect(mid).toBeLessThan(63);

		run();
		expect(scoreNow()).toBe(63);
	});

	test("it decelerates into its final digit instead of arriving linearly", () => {
		render(<IntelligenceCard analytics={analytics(100, 50)} {...props} />);

		stepUntilClock(500);
		const halfway = scoreNow();
		run();
		const finished = scoreNow();

		// Ease-out means the first half of the duration has already covered most of
		// the distance. A linear ramp would be at roughly the midpoint.
		expect(halfway).toBeGreaterThan(finished * 0.6);
	});

	test("the arc sweeps from empty to exactly the score's proportion", () => {
		render(<IntelligenceCard analytics={analytics(63, 65)} {...props} />);

		// Empty: the full length is offset, so nothing is drawn.
		expect(arcFill()).toBeCloseTo(ARC_LENGTH, 5);

		run();
		// Filled by exactly 63% of a fixed track — not scaled to the value showing.
		expect(arcFill()).toBeCloseTo(ARC_LENGTH * (1 - 0.63), 5);
	});

	test("the range bar grows from nothing to where the rate sits", () => {
		render(<IntelligenceCard analytics={analytics(63, 65)} {...props} />);

		expect(barWidth()).toBe("0%");
		run();
		expect(barWidth()).toBe("65%");
	});

	test("a score of zero leaves the arc empty", () => {
		render(<IntelligenceCard analytics={analytics(0, 0)} {...props} />);
		run();
		expect(arcFill()).toBeCloseTo(ARC_LENGTH, 5);
	});

	test("a score of one hundred fills it completely", () => {
		render(<IntelligenceCard analytics={analytics(100, 100)} {...props} />);
		run();
		expect(arcFill()).toBeCloseTo(0, 5);
	});

	test("both are transitions, so the browser interpolates rather than snapping", () => {
		render(<IntelligenceCard analytics={analytics(63, 65)} {...props} />);

		const gauge = screen.getByLabelText(/Ratevo score/);
		expect(gauge.querySelectorAll("path")[1].style.transition).toContain("stroke-dashoffset");
		expect(document.querySelector(".bg-measured").style.transition).toContain("width");
	});

	test("changing the score animates to the new value instead of snapping", () => {
		const { rerender } = render(<IntelligenceCard analytics={analytics(63, 65)} {...props} />);
		run();
		expect(scoreNow()).toBe(63);

		// The user picks a different window and the engine answers with a new score.
		rerender(<IntelligenceCard analytics={analytics(21, 30)} {...props} />);
		expect(scoreNow()).toBe(63);
		run();
		expect(scoreNow()).toBe(21);
	});
});

describe("under reduced motion", () => {
	beforeEach(() => {
		frames = [];
		clock = 0;
		vi.useFakeTimers();
		window.matchMedia = vi.fn().mockImplementation((query) => ({
			matches: query.indexOf("prefers-reduced-motion") !== -1,
			media: query,
			addEventListener() {},
			removeEventListener() {},
			addListener() {},
			removeListener() {},
		}));
		window.requestAnimationFrame = raf;
		window.cancelAnimationFrame = () => {};
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	test("the figures are settled on the first frame", () => {
		render(<IntelligenceCard analytics={analytics(63, 65)} {...props} />);

		// No count-up, no sweep, no growth — the reader asked for stillness, and a
		// number that arrives by counting is motion.
		expect(scoreNow()).toBe(63);
		expect(barWidth()).toBe("65%");
		expect(arcFill()).toBeCloseTo(ARC_LENGTH * (1 - 0.63), 5);
	});

	test("nothing is left with a transition that would still play", () => {
		render(<IntelligenceCard analytics={analytics(63, 65)} {...props} />);

		const gauge = screen.getByLabelText(/Ratevo score/);
		expect(gauge.querySelectorAll("path")[1].style.transition).toBe("");
		expect(document.querySelector(".bg-measured").style.transition).toBe("");
	});
});