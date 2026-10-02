/**
 * services/amountFormat.js
 *
 * Thousands separators for the figures the converter shows.
 *
 * Without them, 898989898989898898989898 is read as one unbroken token, and a
 * reader has to count digits in groups of three to know its magnitude. The
 * converted figure is the entire answer the product exists to give, so it has to
 * be legible at a glance at any size.
 *
 * The input is kept as raw digits and formatted on the way out. Storing the
 * formatted string instead would put grouping commas back into the value on the
 * next keystroke, which is the usual way this goes wrong.
 */

/**
 * Insert grouping separators into the integer part, leaving any decimals alone.
 *
 * Anything that is not a digit in the integer part is dropped, so a stray comma,
 * a pasted currency symbol or a stray letter cannot corrupt the figure.
 *
 * @param {string|number} raw unformatted, e.g. "1234567.5"
 * @returns {string} e.g. "1,234,567.5", or "" for empty input
 */
export function groupDigits(raw) {
	if (raw === null || raw === undefined) return "";

	const text = String(raw);
	if (text === "") return "";

	const dot = text.indexOf(".");
	const integerPart = dot === -1 ? text : text.slice(0, dot);
	const decimals = dot === -1 ? "" : text.slice(dot);

	const digits = integerPart.replace(/\D/g, "");
	// No integer digits yet — the user is mid-typing a decimal, so the point
	// itself must survive. `/[^\d.]/` rather than `/\D/`, which would strip it.
	if (digits === "") return decimals ? decimals.replace(/[^\d.]/g, "") : "";

	const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	return grouped + decimals.replace(/[^\d.]/g, "");
}

/**
 * The largest amount the converter will accept.
 *
 * 10^15 is a quadrillion — far beyond any real quantity of currency — and it sits
 * comfortably inside Number.MAX_SAFE_INTEGER. Above that, two things break at
 * once and neither announces itself:
 *
 *   - `Number.prototype.toFixed` stops returning a fixed-point string above 1e21
 *     and falls back to `ToString`, producing "1.1935709090909092e+27".
 *   - beyond 2^53 the double can no longer represent consecutive integers, so
 *     the converted figure is not the product of the two numbers on screen.
 *
 * Refusing the input is the only honest option. Silently converting to a figure
 * that is not what was typed would be the worst outcome available, because it
 * looks right.
 */
export const MAX_AMOUNT = 1e15;

/**
 * Reduce typed input to something `groupDigits` can format safely, within the
 * amount the converter can actually represent.
 *
 * Keeps at most one decimal point and drops the second if one is typed after the
 * first. The trailing point is deliberately preserved so a decimal can be typed
 * in the first place — stripping it would make "12." impossible to reach.
 *
 * Over-long input is truncated from the right rather than rejected outright, so
 * the field keeps responding while someone is still typing. Typing left to
 * right therefore stops accepting digits at the ceiling instead of silently
 * discarding what came before.
 *
 * @param {string} typed raw value from the input
 * @returns {string} digits, with at most one trailing decimal point
 */
export function sanitizeAmountInput(typed) {
	if (typed === null || typed === undefined) return "";

	const cleaned = String(typed)
		.replace(/[^\d.]/g, "")
		.replace(/(\..*)\./g, "$1");

	const dot = cleaned.indexOf(".");
	const integerPart = (dot === -1 ? cleaned : cleaned.slice(0, dot)).replace(/\D/g, "");
	const decimals = dot === -1 ? "" : cleaned.slice(dot + 1);

	if (Number(integerPart || "0") <= MAX_AMOUNT) {
		return integerPart + (dot === -1 ? "" : `.${decimals}`);
	}

	// Keep the most significant digits; the result is always <= MAX_AMOUNT.
	const capped = String(MAX_AMOUNT).slice(0, -1);
	return capped + (dot === -1 ? "" : `.${decimals}`);
}

/**
 * The converted figure: fixed to two decimals and grouped.
 *
 * Returns null rather than a zero when there is nothing to show, so the caller
 * can distinguish "no amount entered" from "an amount of zero".
 *
 * There is deliberately no exponential fallback. Scientific notation looked like
 * the tidier answer for very large inputs, but "1.19e+27" cannot be run through
 * grouping without becoming nonsense, and a converter whose output format
 * changes with magnitude is one nobody can check by eye.
 *
 * @param {number|null|undefined} value
 * @param {string} [currency] appended separately by the caller
 */
export function formatConverted(value, currency) {
	if (value === null || value === undefined || !Number.isFinite(value)) return null;

	const fixed = value.toFixed(2);
	return currency ? `${groupDigits(fixed)} ${currency}` : groupDigits(fixed);
}

/**
 * A type scale keyed to how many characters the figure has.
 *
 * A currency figure has no natural length — 100 USD and a converted value of
 * 677,113,384,994,802,176.00 are both ordinary — so a fixed size either wastes
 * the row or pushes the long one onto a second line and out of its card.
 *
 * CSS alone cannot solve this: `cqi` measures the container, not the string, so
 * it cannot know whether the content is eight characters or thirty. The length
 * is known here, so the size is chosen here and the result is deterministic.
 *
 * The thresholds are deliberately generous — each step down buys roughly four
 * more characters on a phone-width card — because a figure that is one size too
 * small is a far better failure than one that wraps.
 *
 * @param {string} text the figure as it will be displayed, separators included
 * @returns {string} a Tailwind font-size class
 */
export function figureSizeClass(text) {
	const length = (text || "").length;
	if (length <= 11) return "text-2xl";
	if (length <= 15) return "text-xl";
	if (length <= 19) return "text-lg";
	if (length <= 25) return "text-base";
	return "text-sm";
}
