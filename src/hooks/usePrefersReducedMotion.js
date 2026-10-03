import { useEffect, useState } from "react";

/**
 * Whether the reader has asked for less motion.
 *
 * Read in an effect rather than during the first render, because `matchMedia` does
 * not exist during server rendering and reading it inline produces a first paint
 * that disagrees with the hydrated one.
 *
 * Lives here rather than inline because two things need it — the loading
 * animation, which renders on SVG and so escapes the global CSS block, and the
 * score gauge, which must not sweep for someone who asked for stillness.
 */
export function usePrefersReducedMotion() {
	const [reduced, setReduced] = useState(false);

	useEffect(() => {
		if (typeof window === "undefined" || !window.matchMedia) return;

		const query = window.matchMedia("(prefers-reduced-motion: reduce)");
		setReduced(query.matches);

		function onChange(event) {
			setReduced(event.matches);
		}

		// Safari before 14 only has the deprecated listener API.
		if (query.addEventListener) {
			query.addEventListener("change", onChange);
			return () => query.removeEventListener("change", onChange);
		}
		query.addListener(onChange);
		return () => query.removeListener(onChange);
	}, []);

	return reduced;
}
