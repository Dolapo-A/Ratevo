const API_BASE_URL =
	import.meta.env.VITE_RATEVO_API_URL ||
	"https://currency-exchange-api-eight.vercel.app";

export async function fetchCurrencies() {
	const response = await fetch(`${API_BASE_URL}/api/currencies`);
	if (!response.ok) {
		throw new Error("Unable to load the currency list");
	}

	const { currencies } = await response.json();
	return currencies;
}

/**
 * The live cross rate for one pair.
 *
 * Scoped deliberately: the app only ever needs the two currencies on screen, so
 * it asks for two. Rates are read from our own daily snapshot rather than
 * fetched live from the upstream provider, which keeps the provider's dataset
 * off our public surface and means the number does not shift mid-conversion.
 */
export async function fetchQuote(baseCurrency, toCurrency) {
	const response = await fetch(
		`${API_BASE_URL}/api/quote?base=${encodeURIComponent(
			baseCurrency
		)}&quote=${encodeURIComponent(toCurrency)}`
	);

	if (!response.ok) {
		throw new Error("Unable to load the current exchange rate");
	}

	return response.json();
}

export async function convertCurrencyApi(fromCurrency, toCurrency, amount) {
	const response = await fetch(
		`${API_BASE_URL}/api/convert?from=${encodeURIComponent(
			fromCurrency
		)}&to=${encodeURIComponent(toCurrency)}&amount=${encodeURIComponent(amount)}`
	);
	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`);
	}
	const data = await response.json();
	return data.result; // Assuming the result is in the 'result' field
}

export async function getconversionHistoryApi(currencyA, currencyB, period) {
	const response = await fetch(
		`${API_BASE_URL}/api/history?currencyA=${encodeURIComponent(
			currencyA
		)}&currencyB=${encodeURIComponent(currencyB)}&period=${encodeURIComponent(
			period
		)}`
	);

	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`);
	}
	const data = await response.json();
	return data;
}
