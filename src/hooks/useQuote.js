import { useQuery } from "@tanstack/react-query";
import { fetchQuote } from "../services/currencyService";

/**
 * The live cross rate for the pair currently on screen.
 *
 * Kept separate from the currency list on purpose: the list is our own static
 * reference data and changes only on deploy, while the rate changes as the
 * daily snapshot refreshes. Splitting them means changing currency re-runs one
 * cheap cached request instead of refetching everything.
 */
export function useQuote(baseCurrency, toCurrency) {
	const {
		data: quote = null,
		error: queryError,
		isLoading,
		isFetching,
	} = useQuery({
		queryKey: ["quote", baseCurrency, toCurrency],
		queryFn: () => fetchQuote(baseCurrency, toCurrency),
		enabled: !!baseCurrency && !!toCurrency && baseCurrency !== toCurrency,
		// The underlying snapshot updates once a day, so there is nothing to gain
		// from polling often. Ten minutes keeps the displayed rate comfortably
		// fresh against that cadence.
		staleTime: 1000 * 60 * 10,
		refetchInterval: 1000 * 60 * 30,
		retry: true,
	});

	return { quote, queryError, isLoading, isFetching };
}
