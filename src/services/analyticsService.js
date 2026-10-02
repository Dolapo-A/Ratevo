import { fetchCurrencies, fetchQuote } from "./currencyService";

/**
 * The analytics service.
 *
 * Every number the UI shows about a pair comes from here, and every one of them
 * is computed by ratevo-analytics on the server. This layer does no arithmetic
 * of its own — it fetches, and it hands the response over untouched. If a value
 * is missing it is because the engine said it could not be measured, and the UI
 * is responsible for showing that honestly rather than substituting a zero.
 */

const API_BASE_URL =
	import.meta.env.VITE_RATEVO_API_URL ||
	"https://currency-exchange-api-eight.vercel.app";

/** The windows the engine reports, in the order they should be shown. */
export const WINDOW_ORDER = ["1", "7", "30", "90", "180", "365"];

/**
 * @param {string} base
 * @param {string} quote
 * @param {number} period the window currently on screen
 */
export async function fetchAnalytics(base, quote, period = 30) {
	const response = await fetch(
		`${API_BASE_URL}/api/analytics?base=${encodeURIComponent(base)}&quote=${encodeURIComponent(
			quote
		)}&period=${encodeURIComponent(period)}`
	);

	if (!response.ok) {
		// 503 means the history table cannot answer this pair yet. That is a
		// normal state for a young dataset, not a crash, so it is surfaced as
		// its own message rather than a generic failure.
		if (response.status === 503) {
			const body = await response.json().catch(() => ({}));
			const error = new Error(body.hint || "Rate history is unavailable");
			error.code = "HISTORY_UNAVAILABLE";
			throw error;
		}
		throw new Error("Unable to load analytics for this pair");
	}

	return response.json();
}

export { fetchCurrencies, fetchQuote };
