import { useQuery } from "@tanstack/react-query";
import { fetchAnalytics } from "../services/analyticsService";

/**
 * Analytics for the pair currently on screen.
 *
 * Refetches when the pair or the window changes, and not otherwise. The engine
 * version is part of the response, so when the analytics method is bumped a new
 * score cannot masquerade as an old one.
 */
export function useAnalytics(baseCurrency, toCurrency, period = 30, enabled = true) {
	const {
		data: analytics = null,
		error: queryError,
		isLoading,
		isFetching,
	} = useQuery({
		queryKey: ["analytics", baseCurrency, toCurrency, period],
		queryFn: () => fetchAnalytics(baseCurrency, toCurrency, period),
		enabled: enabled && !!baseCurrency && !!toCurrency && baseCurrency !== toCurrency,
		// The underlying snapshot refreshes once a day. Polling faster would spend
		// requests re-reading the same numbers.
		staleTime: 1000 * 60 * 10,
		refetchInterval: 1000 * 60 * 30,
		retry: 1,
	});

	return {
		analytics,
		queryError,
		isLoading,
		isFetching,
		/** True when the engine declined to answer because history is too short. */
		isHistoryUnavailable: queryError?.code === "HISTORY_UNAVAILABLE",
	};
}
