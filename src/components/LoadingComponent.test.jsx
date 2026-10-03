import { describe, test, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import LoadingComponent from "./LoadingComponent";

/**
 * The Lottie renders to its own SVG, not through CSS, so the global
 * `prefers-reduced-motion` block cannot reach it. That is why the autoplay is
 * decided here instead — and it needs a test, because getting it wrong means an
 * indefinite animation plays for someone who asked for less motion, with nothing
 * in the codebase able to stop it.
 */

// Mocked so the test can assert on the props it was handed without pulling the
// real animation runtime into jsdom, which does not implement SVG SMIL playback.
vi.mock("lottie-react", () => ({
	default: (props) => {
		return (
			<div
				data-testid="lottie"
				data-loop={String(props.loop)}
				data-autoplay={String(props.autoplay)}
				className={props.className}
			/>
		);
	},
}));

function setMotionPreference(matches) {
	window.matchMedia = vi.fn().mockImplementation((query) => ({
		matches: query.includes("prefers-reduced-motion") ? matches : false,
		media: query,
		onchange: null,
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		addListener: vi.fn(),
		removeListener: vi.fn(),
		dispatchEvent: vi.fn(),
	}));
}

describe("LoadingComponent", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	test("plays by default", () => {
		setMotionPreference(false);
		render(<LoadingComponent />);

		const el = screen.getByTestId("lottie");
		expect(el).toHaveAttribute("data-loop", "true");
		expect(el).toHaveAttribute("data-autoplay", "true");
	});

	test("does not animate when reduced motion is preferred", () => {
		// A frozen animation reads as broken rather than as loading, which is the
		// whole reason this component decides autoplay itself.
		setMotionPreference(true);
		render(<LoadingComponent />);

		const el = screen.getByTestId("lottie");
		expect(el).toHaveAttribute("data-autoplay", "false");
		expect(el).toHaveAttribute("data-loop", "false");
	});

	test("keeps the original sizing", () => {
		setMotionPreference(false);
		render(<LoadingComponent />);
		expect(screen.getByTestId("lottie")).toHaveClass("w-80", "h-80");
	});

	test("survives an environment without matchMedia", () => {
		// A missing matchMedia must not throw during mount.
		const original = window.matchMedia;
		window.matchMedia = undefined;
		expect(() => render(<LoadingComponent />)).not.toThrow();
		window.matchMedia = original;
	});
});
