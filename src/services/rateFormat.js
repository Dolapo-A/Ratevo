/**
 * Formatting a rate for reading.
 *
 * Lives in one place because a rate's precision depends on its magnitude, and
 * getting that wrong does not look like a formatting mistake — it looks like a
 * measurement. Rates here run from 1,330.64 for USD/NGN down to single-digit
 * fractions for a handful of the 161 pairs, and a fixed two decimals turns every
 * one of those into "0.00", which is a claim that the rate is zero.
 *
 * The rule is therefore:
 *
 *   0.01 and above  two decimals, always. That is the convention every rate on the
 *                   page follows, so the same currency never appears at two
 *                   different precisions in two places.
 *   below 0.01     as many places as the value carries, and no more. Precision
 *                   follows magnitude rather than a fixed width.
 *
 * `maximumFractionDigits` is high enough for the smallest pair in the set and no
 * higher — past that the digits are the float's, not the rate's.
 */

const MAX_FRACTION_DIGITS = 12;

/** The whole number part, grouped. "1,330" */
function grouped(value) {
	return value.toLocaleString("en-US", {
		useGrouping: true,
		minimumFractionDigits: 0,
		maximumFractionDigits: MAX_FRACTION_DIGITS,
	});
}

/**
 * A rate as a reader parses it.
 *
 * @param {number|null|undefined} value
 * @returns {string} the formatted rate, or an em dash when there is none to show
 */
export function fmtRate(value) {
	if (value === null || value === undefined) return "—";
	if (!Number.isFinite(value)) return "—";

	const magnitude = Math.abs(value);

	if (magnitude >= 0.01) {
		return value.toLocaleString("en-US", {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		});
	}

	// Below a cent, the integer part is almost always "0", so grouping it would
	// print "0" immediately before the significant digits and make the number
	// harder to read, not easier.
	if (magnitude === 0) return "0";
	return String(value);
}

/**
 * `1 USD = 1,330.64 NGN`, or an em dash when any part of that is unknown.
 *
 * The pair comes first because it is what the reader is looking up; the rate is
 * qualified by it. A rate printed without its pair is not yet a measurement, which
 * is why this refuses rather than substituting a placeholder.
 *
 * "1 USD = — NGN" is refused too, not just the missing pair. A rate with an em dash
 * in the middle of it looks like a figure that failed to format; the whole line
 * reads as "nothing to show here", which is the truth.
 *
 * @param {string|null} base
 * @param {string|null} quote
 * @param {number|null} rate
 */
export function fmtRateLine(base, quote, rate) {
	if (!base || !quote) return "—";
	if (rate === null || rate === undefined || !Number.isFinite(rate)) return "—";
	return `1 ${base} = ${fmtRate(rate)} ${quote}`;
}

/** `USD → NGN`, for a column that already carries the rate beside it. */
export function fmtPair(base, quote) {
	if (!base || !quote) return "—";
	return `${base} → ${quote}`;
}

export { grouped };