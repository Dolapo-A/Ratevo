import { Analytics } from "@vercel/analytics/react";
import { useState, useEffect } from "react";
import { useFetchCurrencies } from "./hooks/useFetchCurrencies";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ChevronDownIcon, ArrowsUpDownIcon } from "@heroicons/react/24/outline";
import { currencyFlag } from "./currencyFlag";
import CurrencyModal from "./components/CurrencyModal";
import { Toaster, toast } from "react-hot-toast";
import { useUserLocation } from "./hooks/useUserLocation";
import { useConversionHistory } from "./hooks/useConversionHistory";
import ConversionChart from "./components/ConversionChart";
import formatRate from "./services/rateFormatter";

function App() {
	const {
		currencies,
		queryError,
		isLoading: isLoadingCurrencies,
	} = useFetchCurrencies();
	const { locationData, isLoadingLocation } = useUserLocation();

	const [amount, setAmount] = useState("");
	const [fromCurrency, setFromCurrency] = useState("USD");
	const [toCurrency, setToCurrency] = useState("");
	const [convertedAmount, setConvertedAmount] = useState(null);
	const [isFromModalOpen, setIsFromModalOpen] = useState(false);
	const [isToModalOpen, setIsToModalOpen] = useState(false);
	const [hasSetInitialCurrency, setHasSetInitialCurrency] = useState(false);
	const [period, setPeriod] = useState(6);

	const {
		history,
		queryError: historyError,
		isLoading: isLoadingHistory,
	} = useConversionHistory(fromCurrency, toCurrency, period);

	useEffect(() => {
		if (!amount || amount <= 0 || fromCurrency === toCurrency) {
			setConvertedAmount(amount ? Number(amount) : null);
			return;
		}

		if (!toCurrency) {
			setConvertedAmount(null);
			return;
		}

		const fromRate = currencies[fromCurrency]?.rate;
		const toRate = currencies[toCurrency]?.rate;

		if (fromRate && toRate) {
			const conversionRate = toRate / fromRate;
			const result = amount * conversionRate;
			setConvertedAmount(result);
		} else {
			setConvertedAmount(null);
		}
	}, [amount, fromCurrency, toCurrency, currencies]);

	useEffect(() => {
		if (
			!hasSetInitialCurrency &&
			!isLoadingLocation &&
			!isLoadingCurrencies &&
			currencies
		) {
			if (locationData?.currency && currencies[locationData.currency]) {
				setToCurrency(locationData.currency);
			} else {
				setToCurrency("USD");

				if (locationData?.currency) {
					console.warn(
						`Detected currency ${locationData.currency} is not supported`
					);
					toast.error(
						"Your local currency is not supported. Using USD instead."
					);
				}
			}
			setHasSetInitialCurrency(true);
		}
	}, [
		locationData,
		currencies,
		isLoadingLocation,
		isLoadingCurrencies,
		hasSetInitialCurrency,
	]);

	const fromRate = currencies[fromCurrency]?.rate;
	const toRate = currencies[toCurrency]?.rate;
	const conversionRate = fromRate && toRate ? toRate / fromRate : null;

	const LoadingButton = () => (
		<div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-full animate-pulse">
			<div className="w-7 h-5 bg-gray-200 rounded"></div>
			<div className="w-4 h-4 text-gray-400 animate-spin" />
		</div>
	);

	// Add this function to handle swapping
	const handleSwapCurrencies = () => {
		if (!toCurrency) return;
		setFromCurrency(toCurrency);
		setToCurrency(fromCurrency);
	};


	return (
		<>
			
			{import.meta.env.DEV ? <ReactQueryDevtools initialIsOpen={false} /> : null}
			<Toaster
				position="top-center"
				gutter={12}
				containerStyle={{ margin: "8px" }}
				toastOptions={{
					success: {
						duration: 3000,
					},
					error: {
						duration: 5000,
					},
					style: {
						fontSize: "16px",
						maxWidth: "500px",
						padding: "16px 24px",
						backgroundColor: "white",
						color: "black",
					},
				}}
			/>

			<div className="flex flex-col min-h-screen">
				<Analytics />
				{queryError ? (
					<div className="mx-4 mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-800">
						Unable to load current exchange rates. Please try again shortly.
					</div>
				) : null}

				{/* Add Navigation Bar */}
				<nav className="w-full bg-white border-b border-gray-200 mb-4">
					<div className="max-w-lg mx-auto py-4">
						<img
							src="/logo.svg"
							alt="Currency Exchange Logo"
							className="h-8 mx-auto"
						/>
					</div>
				</nav>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-4 lg:px-6 px-4">
					<div className="p-4 flex-grow bg-slate-100 rounded-2xl">
						<div className="max-w-lg mx-auto">
							{/* Title */}
							<h1 className="text-2xl font-semibold mb-2">
								Compare Different Currency Rates
							</h1>
							<p className="text-gray-600 mb-6">
								Enter amount and select currency to convert to
							</p>

							{/* Amount Input Section */}
							<div className="mb-4">
								<label className="block text-gray-600 mb-2">Amount</label>
								<div className="p-4 rounded-2xl bg-white border border-gray-200 flex justify-between items-center">
									<div className="flex items-center gap-2">
										<button
											className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-full hover:bg-slate-100 transition-colors"
											onClick={() => setIsFromModalOpen(true)}
										>
											<img
												src={`/flags/${currencyFlag[
													fromCurrency
												]?.toLowerCase()}.png`}
												alt={fromCurrency}
												className="w-7 h-5 object-cover border border-gray-300 shadow-sm rounded"
												onError={(e) => {
													e.target.src = "/flags/default-flag.png";
												}}
											/>
											<span>{fromCurrency}</span>
											<ChevronDownIcon className="w-4 h-4 text-gray-400" />
										</button>
									</div>
									<input
										type="number"
										min="0"
										value={amount}
										onChange={(e) => setAmount(e.target.value)}
										className="text-2xl text-right w-32 focus:outline-none"
										placeholder="0.00"
									/>
								</div>
							</div>

							{/* Swap Button */}
							<div className="flex justify-center -my-2 relative">
								<button
									onClick={handleSwapCurrencies}
									className="bg-white border border-gray-200 rounded-full p-2 hover:bg-gray-50 transition-colors"
								>
									<ArrowsUpDownIcon className="w-5 h-5 text-gray-400" />
								</button>
							</div>

							{/* Amount to Receive */}
							<div className="mb-6">
								<label className="block text-gray-600 mb-2">
									Converted Amount
								</label>
								<div className="p-4 rounded-2xl bg-white border border-gray-200 flex justify-between items-center">
									{isLoadingLocation || isLoadingCurrencies ? (
										<LoadingButton />
									) : (
										<button
											className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-full hover:bg-slate-100 transition-colors"
											onClick={() => setIsToModalOpen(true)}
										>
											<img
												src={`/flags/${currencyFlag[
													toCurrency
												]?.toLowerCase()}.png`}
												alt={toCurrency}
												className="w-7 h-5 object-cover border border-gray-300 shadow-sm rounded"
												onError={(e) => {
													e.target.src = "/flags/default-flag.png";
													e.target.onerror = null;
												}}
											/>
											<span>{toCurrency}</span>
											<ChevronDownIcon className="w-4 h-4 text-gray-400" />
										</button>
									)}
									<span className="text-2xl text-gray-400">
										{convertedAmount
											? `${convertedAmount
													.toFixed(2)
													.replace(/\B(?=(\d{3})+(?!\d))/g, ",")} ${toCurrency}`
											: `0.00 ${toCurrency}`}
									</span>
								</div>
							</div>

							{/* Conversion Details */}
							<div className="bg-gray-50 rounded-2xl p-4 mb-6 space-y-3">
								<div className="flex justify-between">
									<span className="text-gray-600">Converting</span>
									<span>
										{amount || 0} {fromCurrency}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-gray-600">Exchange Rate</span>
									<span>
										{1} {fromCurrency} ={" "}
										{conversionRate ? formatRate(conversionRate) : "X"}{" "}
										{toCurrency}
									</span>
								</div>
							</div>

							{/* Add Currency Modals */}
							<CurrencyModal
								isOpen={isFromModalOpen}
								onClose={() => setIsFromModalOpen(false)}
								onSelect={setFromCurrency}
								currencies={currencies}
								selectedCurrency={fromCurrency}
							/>

							<CurrencyModal
								isOpen={isToModalOpen}
								onClose={() => setIsToModalOpen(false)}
								onSelect={setToCurrency}
								currencies={currencies}
								selectedCurrency={toCurrency}
							/>
						</div>
					</div>

					<div className="bg-slate-100 rounded-2xl h-full flex justify-center overflow-hidden">
						<ConversionChart
							data={history.data}
							base={history.base}
							quote={history.quote}
							conversionRate={conversionRate}
							isLoading={isLoadingHistory}
							error={historyError}
							period={period}
							setPeriod={setPeriod}
						/>
					</div>
				</div>

				{/* Footer */}
				{/* <footer className="bg-slate-100 text-center py-4">
					<BottomAd />

					<p className="text-sm">Developed by Dolapo Araoye</p>
					<div className="flex justify-center space-x-4 mt-2">
						<a
							href="https://github.com/Dolapo-A"
							target="_blank"
							rel="noopener noreferrer"
							className="text-blue-600 hover:underline"
						>
							GitHub
						</a>
						<a
							href="https://linkedin.com/in/dolapo-araoye-86ba31219/"
							target="_blank"
							rel="noopener noreferrer"
							className="text-blue-600 hover:underline"
						>
							LinkedIn
						</a>
					</div>
				</footer> */}
			</div>
		</>
	);
}

export default App;
