import { Analytics } from "@vercel/analytics/react";
import { useState, useEffect, useRef } from "react";
import { useFetchCurrencies } from "./hooks/useFetchCurrencies";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ChevronDownIcon, ArrowsUpDownIcon } from "@heroicons/react/24/outline";
import CurrencyFlag from "./components/CurrencyFlag";
import CurrencyModal from "./components/CurrencyModal";
import { Toaster, toast } from "react-hot-toast";
import { useUserLocation } from "./hooks/useUserLocation";
import { useQuote } from "./hooks/useQuote";
import { useConversionHistory } from "./hooks/useConversionHistory";
import ConversionChart from "./components/ConversionChart";
import AnalyticsPanel from "./features/analytics/AnalyticsPanel";
import IntelligenceCard from "./features/analytics/IntelligenceCard";
import { FEATURES } from "./config/features";
import formatRate from "./services/rateFormatter";
import {
	groupDigits,
	sanitizeAmountInput,
	formatConverted,
	figureSizeClass,
} from "./services/amountFormat";
import { DEFAULT_PERIOD, getPeriod } from "./config/periods";
import { useAnalytics } from "./hooks/useAnalytics";
import ErrorBoundary from "./components/ErrorBoundary";
import {
	AmountSkeleton,
	CurrencyChipSkeleton,
	InlineValueSkeleton,
	IntelligenceCardSkeleton,
	LoadingRegion,
} from "./components/Skeleton";

/**
 * Where to point when the visitor's own currency cannot be used — either it is
 * unsupported, or it is already the base currency on screen. Ordered so the most
 * widely traded pair comes first.
 */
const DEFAULT_TARGET_CURRENCIES = ["EUR", "GBP", "JPY", "CAD", "AUD"];

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
	// The dialogs hand focus back to these on close. Capturing whatever happened
	// to be focused instead would record <body> for every mouse user, and
	// "restore focus to <body>" is the same as losing the user's place.
	const fromTriggerRef = useRef(null);
	const toTriggerRef = useRef(null);
	const [hasSetInitialCurrency, setHasSetInitialCurrency] = useState(false);
	// One period, driving both the chart and the analytics. Selecting 3M on the
	// chart now gives 3M analytics without a second click.
	const [period, setPeriod] = useState(DEFAULT_PERIOD.historyDays);
	const analyticsPeriod = getPeriod(period).analyticsDays;

	// The period filter shows each window's own change under its label. The
	// engine returns `change` for every window on every request, so one fetch
	// serves all six options. React Query shares the cache entry with
	// AnalyticsPanel — same key, so this adds no request.
	// One analytics request for the page. The period filter and the intelligence
	// card both read from it, and the panel below receives it rather than asking
	// again — so there is one source for the figures on screen.
	const { analytics, isLoadingAnalytics } = useAnalytics(
		fromCurrency,
		toCurrency,
		analyticsPeriod
	);

	const {
		history,
		queryError: historyError,
		isLoading: isLoadingHistory,
	} = useConversionHistory(fromCurrency, toCurrency, period);

	const {
		quote,
		queryError: quoteError,
		isLoading: isLoadingQuote,
	} = useQuote(fromCurrency, toCurrency);

	// The input is held as raw digits and grouped for display, so grouping commas
	// never re-enter the value on the next keystroke.
	const amountNumber = Number(amount) || 0;

	// Derived once and reused by the figure, its title, and its type scale, so the
	// three can never disagree about what is on screen.
	const convertedFigure = formatConverted(convertedAmount);

	useEffect(() => {
		if (!amount || amountNumber <= 0 || fromCurrency === toCurrency) {
			setConvertedAmount(amount ? amountNumber : null);
			return;
		}

		if (!toCurrency || !quote) {
			setConvertedAmount(null);
			return;
		}

		setConvertedAmount(amountNumber * quote.rate);
	}, [amount, amountNumber, fromCurrency, toCurrency, quote]);

	useEffect(() => {
		if (
			hasSetInitialCurrency ||
			isLoadingLocation ||
			isLoadingCurrencies ||
			!currencies
		) {
			return;
		}

		// A currency pair needs two *different* currencies. The detected currency
		// is only usable if we support it and it is not the base already on
		// screen — otherwise a visitor in the US, or anyone whose location could
		// not be resolved, was left looking at USD → USD.
		const detected = locationData?.currency;
		const isDetectedUsable =
			detected && currencies[detected] && detected !== fromCurrency;

		if (isDetectedUsable) {
			setToCurrency(detected);
		} else {
			const fallback =
				DEFAULT_TARGET_CURRENCIES.find((c) => currencies[c] && c !== fromCurrency) ||
				"EUR";
			setToCurrency(fallback);

			if (detected && !currencies[detected]) {
				console.warn(`Detected currency ${detected} is not supported`);
				toast.error(
					`Your local currency (${detected}) is not supported. Showing ${fallback} instead.`
				);
			}
		}

		setHasSetInitialCurrency(true);
	}, [
		locationData,
		currencies,
		isLoadingLocation,
		isLoadingCurrencies,
		hasSetInitialCurrency,
		fromCurrency,
	]);

	const conversionRate = quote?.rate ?? null;

	// What the converter is still waiting on. Kept separate from the analytics and
	// history states because those have their own regions — a slow chart must not
	// hold up the amount the user is typing.
	const isConvertingRate =
		isLoadingQuote || isLoadingCurrencies || isLoadingLocation;
	const quoteAsOf = quote?.base?.asOf ?? null;

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

			<div className="flex flex-col min-h-screen bg-slate-50 px-4 lg:px-6">
				<Analytics />
				{queryError ? (
					<div className="mb-4 rounded-xl border border-red-200 bg-red-50 py-3 text-red-800">
						Unable to load the currency list. Please try again shortly.
					</div>
				) : null}

				{quoteError ? (
					<div className="mb-4 rounded-xl border border-red-200 bg-red-50 py-3 text-red-800">
						Unable to load the current exchange rate for {fromCurrency}/{toCurrency}. Please try again shortly.
					</div>
				) : null}

				<nav className="w-full bg-white border-b border-gray-200 mb-4">
					<div className="max-w-lg mx-auto py-4">
						<img src="/logo.svg" alt="Ratevo" className="h-8 mx-auto" />
					</div>
				</nav>

				{/* The page says what Ratevo is before it asks for anything.
				    The converter is how people arrive, but a converter is the one
				    thing every competitor does too — so the differentiator is stated
				    up front rather than left below the fold to be found. */}
				<header className="px-4 lg:px-6 mt-4 mb-10 max-w-screen-lg m-auto">
					<h1 className="text-[22px] font-semibold leading-tight tracking-tight text-center text-slate-900 sm:text-2xl">
						What a currency rate actually means, not just what it is.
					</h1>
					<p className="mt-1.5 text-[13.5px] leading-relaxed text-slate-500">
						A daily indicative snapshot for 161 currencies, with the range, trend and
						volatility behind it. Where Ratevo cannot measure something, it says so
						rather than guessing.
					</p>
				</header>

				
				<div className="max-w-screen-xl m-auto">
					{/* The intelligence card sits above the converter deliberately: it is
				    the reason to stay, and putting it first makes the first screen the
				    pitch and the tool at once. */}
				{FEATURES.INTELLIGENCE && (
					<div className="mb-4">
						<LoadingRegion
							isLoading={isLoadingAnalytics && !analytics}
							label="Rate intelligence"
						>
							{analytics ? (
								<IntelligenceCard
									analytics={analytics}
									baseCurrency={fromCurrency}
									quoteCurrency={toCurrency}
								/>
							) : (
								<IntelligenceCardSkeleton />
							)}
						</LoadingRegion>
					</div>
				)}
				{/* `min-w-0` on the children, not just on this grid.
						    Without it the chart column refused to shrink below its content
						    width, and the converter column — which has an amount input that
						    sizes to its content — took the rest. On a 390px phone the chart
						    cell collapsed to 159px, which is what pushed the period filter's
						    last option off the right edge. A grid item defaults to
						    `min-width: auto`, so it must be told it may shrink. */}
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-4 ">
						<LoadingRegion
							isLoading={isConvertingRate}
							label="Conversion"
							className="min-w-0 p-4 flex-grow bg-slate-100 rounded-2xl"
						>
						<div className="min-w-0 max-w-lg mx-auto">
							{/* Title */}
							<h2 className="text-lg font-semibold mb-2 tracking-tight">
								Convert
							</h2>
							<p className="text-gray-500 text-[13px] mb-4">
								Enter an amount and pick your currencies
							</p>

							{/* Amount Input Section */}
							<div className="mb-4">
								<label className="block text-gray-600 mb-2">Amount</label>
								<div className="p-4 rounded-2xl bg-white border border-gray-200 flex justify-between items-center gap-3 figure-fit">
									<div className="flex items-center gap-2">
										<button
											type="button"
										ref={fromTriggerRef}
											aria-label={`Select base currency, currently ${fromCurrency}`}
											className="pressable-soft flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-full hover:bg-slate-100 active:bg-slate-200"
											onClick={() => setIsFromModalOpen(true)}
										>
										{/* CurrencyFlag rather than an inline <img>: `toCurrency` starts as an
										    empty string, so `currencyFlag[""]` was undefined and this used to
										    request `/flags/undefined.png`. The old fallback pointed at
										    `/flags/default-flag.png`, which is not in public/flags — so a miss
										    became one 404 and then another, with no image either way. */}
										<CurrencyFlag code={fromCurrency} className="w-7 h-5" />
											<span>{fromCurrency}</span>
											<ChevronDownIcon className="w-4 h-4 text-gray-400" />
										</button>
									</div>
									<input
										type="text"
										inputMode="decimal"
										aria-label="Amount to convert"
										value={groupDigits(amount)}
										onChange={(e) => setAmount(sanitizeAmountInput(e.target.value))}
										className={`figure-fit__value focus-ring min-w-0 flex-1 bg-transparent text-right focus:outline-none ${figureSizeClass(groupDigits(amount))}`}
										placeholder="0.00"
									/>
								</div>
							</div>

							{/* Swap Button */}
							<div className="flex justify-center -my-2 relative">
								<button
									type="button"
									onClick={handleSwapCurrencies}
									disabled={!toCurrency}
									aria-label={`Swap currencies: ${fromCurrency} and ${toCurrency || "none selected"}`}
									className="pressable bg-white border border-gray-200 rounded-full p-2 hover:bg-gray-50 active:bg-gray-100"
								>
									<ArrowsUpDownIcon className="w-5 h-5 text-gray-400" />
								</button>
							</div>

							{/* Amount to Receive */}
							<div className="mb-6">
								<label className="block text-gray-600 mb-2">
									Converted Amount
								</label>
								<div className="p-4 rounded-2xl bg-white border border-gray-200 flex justify-between items-center gap-3 figure-fit">
									{isLoadingLocation || isLoadingCurrencies || isLoadingQuote ? (
										<CurrencyChipSkeleton />
									) : (
										<button
											type="button"
											ref={toTriggerRef}
											aria-label={`Select target currency, currently ${toCurrency}`}
											className="pressable-soft flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-full hover:bg-slate-100 active:bg-slate-200"
											onClick={() => setIsToModalOpen(true)}
										>
										<CurrencyFlag code={toCurrency} className="w-7 h-5" />
											<span>{toCurrency}</span>
											<ChevronDownIcon className="w-4 h-4 text-gray-400" />
										</button>
									)}
									<span className="figure-fit__value min-w-0 flex-1 text-right font-bold text-slate-900">
										{isConvertingRate ? (
											<span className="inline-block align-middle">
												<AmountSkeleton />
											</span>
										) : (
											<>
												<span
													className={figureSizeClass(convertedFigure)}
													title={convertedFigure ?? undefined}
												>
													{convertedFigure ?? "—"}
												</span>
												<span className="figure-fit__unit ml-1.5 text-lg font-semibold text-gray-400">
													{toCurrency}
												</span>
											</>
										)}
									</span>
								</div>
							</div>

							{/* Conversion Details */}
							<div className="bg-gray-50 rounded-2xl p-4 mb-6 space-y-3">
								<div className="flex justify-between gap-4">
									<span className="text-gray-600">Converting</span>
									<span className="num tabular-nums">
										{amount ? groupDigits(amount) : 0} {fromCurrency}
									</span>
								</div>
								<div className="flex justify-between gap-4">
									<span className="text-gray-600">Exchange Rate</span>
									{isConvertingRate ? (
										<InlineValueSkeleton widthClass="w-28" />
									) : (
										<span className="num tabular-nums">
											{1} {fromCurrency} ={" "}
											{conversionRate ? formatRate(conversionRate) : "—"}{" "}
											{toCurrency}
										</span>
									)}
								</div>
							</div>

							{/* Add Currency Modals */}
							<CurrencyModal
								isOpen={isFromModalOpen}
								onClose={() => setIsFromModalOpen(false)}
								onSelect={setFromCurrency}
								currencies={currencies}
								selectedCurrency={fromCurrency}
								returnFocusTo={fromTriggerRef}
							/>

							<CurrencyModal
								isOpen={isToModalOpen}
								onClose={() => setIsToModalOpen(false)}
								onSelect={setToCurrency}
								currencies={currencies}
								selectedCurrency={toCurrency}
								returnFocusTo={toTriggerRef}
							/>
							</div>
						</LoadingRegion>

					<div className="min-w-0 bg-slate-100 rounded-2xl h-full flex justify-center overflow-hidden">
						<ErrorBoundary label="The chart could not be displayed.">
							<ConversionChart
								data={history.data}
								/* The selected pair, not `history.base` / `history.quote`.
								   The history payload echoes them back, but only once it has
								   resolved — and changing the window changes the query key, which
								   drops `data` back to undefined for a frame. The quote is keyed
								   separately and survives that, so the header had a rate to print
								   and no currencies to print it between: "1 undefined = 1330.64
								   undefined". State cannot disagree with itself that way. */
								base={fromCurrency}
								quote={toCurrency}
								conversionRate={conversionRate}
								isLoading={isLoadingHistory}
								error={historyError}
								period={period}
								setPeriod={setPeriod}
								change={analytics?.change}
								changeLabel={analytics?.changeLabel}
							/>
						</ErrorBoundary>
					</div>
				</div>

				{/* Analytics. Every surface below is independently flagged in
				    src/config/features.js, so this block can ship a piece at a
				    time. With every flag off it renders nothing at all and the
				    converter looks exactly as it did before. */}
				<div className="grid">
					<ErrorBoundary label="The analytics panel could not be displayed.">
						<AnalyticsPanel analytics={analytics} isLoading={isLoadingAnalytics} />
					</ErrorBoundary>
				</div>
				</div>

				{/* Footer. The ExchangeRate-API attribution link is a licence
				    requirement of the free tier we depend on, not decoration —
				    do not remove it without moving to a different feed. */}
				<footer className="bg-slate-100 text-center py-5 mt-2">
					{/* <div className="flex justify-center space-x-4 text-sm">
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
					</div> */}

					<p className="text-xs text-gray-500 mt-3">
						Rates by{" "}
						<a
							href="https://www.exchangerate-api.com"
							target="_blank"
							rel="noopener noreferrer"
							className="underline hover:text-gray-700"
						>
							Exchange Rate API
						</a>
						{quoteAsOf ? ` · snapshot ${quoteAsOf}` : ""}
					</p>
					<p className="text-xs text-gray-500">
						Indicative mid-rates for information only. Not investment advice.
					</p>
					{/* <p className="text-xs text-gray-400 mt-1">Developed by Dolapo Araoye</p> */}
				</footer>
			</div>
		</>
	);
}

export default App;
