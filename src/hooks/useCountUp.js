import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

/**
 * A 0 → 1 progress value, driven by requestAnimationFrame and ease-out.
 *
 * This exists for the score's count-up, which cannot be done in CSS: a number
 * changing over time needs a value per frame, not a transition between two
 * rendered states. The arc and the range bar do *not* use this — they animate
 * between two states, which a CSS transition handles better on the compositor.
 *
 * Ease-out rather than linear, because a figure that arrives at the same speed it
 * left reads as a progress bar; one that decelerates into its final digit reads
 * as arriving somewhere.
 *
 * Under reduced motion it returns 1 immediately: the reader asked for stillness,
 * not for a number that appears without being counted to.
 *
 * `target` is in the dependency list deliberately, so a score that changes — the
 * user picking a different window — animates to its new value rather than
 * snapping.
 *
 * @param {number} target the finished value
 * @param {number} durationMs
 * @param {number} delayMs hold before starting, so several figures can stagger
 * @returns {number} the value to render right now
 */
export function useCountUp(target, durationMs = 900, delayMs = 120) {
	const reducedMotion = usePrefersReducedMotion();
	const [value, setValue] = useState(reducedMotion ? target : 0);
	const frame = useRef(0);

	useEffect(() => {
		if (reducedMotion) {
			setValue(target);
			return undefined;
		}

		let start = null;
		let delayTimer = null;

		function easeOut(t) {
			return 1 - (1 - t) ** 3;
		}

		function tick(timestamp) {
			if (start === null) start = timestamp;
			const t = Math.min(1, (timestamp - start) / durationMs);
			setValue(target * easeOut(t));
			if (t < 1) frame.current = requestAnimationFrame(tick);
			else setValue(target);
		}

		delayTimer = setTimeout(() => {
			frame.current = requestAnimationFrame(tick);
		}, delayMs);

		return () => {
			clearTimeout(delayTimer);
			cancelAnimationFrame(frame.current);
		};
	}, [target, durationMs, delayMs, reducedMotion]);

	return value;
}
