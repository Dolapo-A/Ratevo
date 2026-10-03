/**
 * Date formatting for engine-supplied ISO dates.
 *
 * Three things this has to get right, all of which were previously got wrong in
 * three different places:
 *
 *   1. The engine sends calendar dates (`2026-09-08`), not instants. Parsed bare,
 *      `new Date("2026-09-08")` is UTC midnight; parsed as local time it can land
 *      on the 7th for anyone west of Greenwich, so the panel would say the low
 *      fell on a day it did not. Every reader here parses in UTC and formats in
 *      UTC, which is the only combination that round-trips.
 *
 *   2. The year is included only when it is not the current one. "8 Sep" is
 *      readable; "8 Sep 2026" next to "8 Sep" for a different year is noise, and
 *      the 1Y window exists precisely to compare across years.
 *
 *   3. An unusable date returns the em dash rather than "Invalid Date". A panel
 *      that prints NaN or a raw exception string has claimed a measurement it
 *      does not have.
 */

const MS_PER_DAY = 86400000;

/** Today in UTC, as `YYYY-MM-DD`. */
function todayUTC() {
	return new Date().toISOString().slice(0, 10);
}

/** True when `iso` is a real `YYYY-MM-DD` calendar date. */
export function isValidISODate(iso) {
	if (typeof iso !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
	const parsed = new Date(`${iso}T00:00:00Z`);
	if (Number.isNaN(parsed.getTime())) return false;
	// Rejects 2026-02-30 and friends, which Date would silently roll over.
	return parsed.toISOString().slice(0, 10) === iso;
}

/**
 * `8 Sep`, or `8 Sep 2025` when the date is in a different year from today.
 *
 * @param {string|null} iso
 * @param {{long?: boolean}} options `long` adds the year unconditionally
 * @returns {string} the formatted date, or an em dash when there is none to show
 */
export function formatDate(iso, { long = false } = {}) {
	if (!isValidISODate(iso)) return "—";

	const date = new Date(`${iso}T00:00:00Z`);
	const sameYear = iso.slice(0, 4) === todayUTC().slice(0, 4);

	return date.toLocaleDateString("en-GB", {
		day: "numeric",
		month: "short",
		...(long || !sameYear ? { year: "numeric" } : {}),
		timeZone: "UTC",
	});
}

/**
 * Whether two calendar dates fall in the same year, used to decide if a range
 * spans a year boundary and therefore needs its years spelled out.
 */
export function spansYearBoundary(firstISO, lastISO) {
	if (!isValidISODate(firstISO) || !isValidISODate(lastISO)) return false;
	return firstISO.slice(0, 4) !== lastISO.slice(0, 4);
}

/** Whole days between two calendar dates, ignoring clock time and DST. */
export function daysBetweenISODate(firstISO, lastISO) {
	if (!isValidISODate(firstISO) || !isValidISODate(lastISO)) return null;
	const a = Date.parse(`${firstISO}T00:00:00Z`);
	const b = Date.parse(`${lastISO}T00:00:00Z`);
	return Math.round((b - a) / MS_PER_DAY);
}