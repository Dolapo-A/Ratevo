const API_BASE_URL =
	import.meta.env.VITE_RATEVO_API_URL ||
	"https://currency-exchange-api-eight.vercel.app";

export async function fetchCurrencies() {
	const response = await fetch(`${API_BASE_URL}/api/rates`);
	if (!response.ok) {
		throw new Error("Unable to load current exchange rates");
	}

	const currencies = await response.json();
	console.log(`Currency count: ${Object.keys(currencies).length}`);
	return currencies;
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
