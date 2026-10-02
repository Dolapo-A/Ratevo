/**
 * Format a rate for display.
 *
 * Rates span eight orders of magnitude here — NGN at ~1300, KRW at ~1900, and
 * GBP at ~0.75 — so precision is chosen by magnitude rather than fixed.
 *
 * The guard matters: a rate is legitimately `null` whenever the quote for the
 * current pair has not loaded yet, or while the pair is changing. Without it,
 * `null.toFixed()` threw inside the chart's render, which React treats as fatal
 * and unmounts the whole tree — a white screen from a missing decimal place.
 */
function formatRate(rate) {
	if (rate === null || rate === undefined || !Number.isFinite(rate)) {
		return "—";
	}
	const abs = Math.abs(rate);
	if (abs < 0.0001) return rate.toFixed(8);
	if (abs < 0.01) return rate.toFixed(6);
	if (abs < 1) return rate.toFixed(3);
	return rate.toFixed(2);
}

export default formatRate;
