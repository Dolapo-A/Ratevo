import { useQuery } from "@tanstack/react-query";
import { userLocationApi } from "../services/locationService";

export function useUserLocation() {
	const {
		data: locationData,
		error: locationError,
		isLoading: isLoadingLocation,
	} = useQuery({
		queryKey: ["userLocation"],
		queryFn: userLocationApi,
		retry: 1,
		staleTime: 24 * 60 * 60 * 1000, // Consider location data fresh for 24 hours
	});

	return { locationData, locationError, isLoadingLocation };
}
