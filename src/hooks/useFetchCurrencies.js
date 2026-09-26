import { useQuery } from "@tanstack/react-query";
import { fetchCurrencies } from "../services/currencyService";

export function useFetchCurrencies() {
	const {
		data: currencies = {},
		error: queryError,
		isLoading,
	} = useQuery({
		queryKey: ["currencies"],
		queryFn: fetchCurrencies,
        staleTime: 120000,
        refetchInterval: 360000,
		retry: true,
	});

	return { currencies, queryError, isLoading };
}
