// components/ConversionChart.jsx
import {
	AreaChart,
	XAxis,
	YAxis,
	Tooltip,
	CartesianGrid,
	ResponsiveContainer,
	Area,
} from "recharts";
import { LoadingRegion } from "./Skeleton";
import LoadingComponent from "./LoadingComponent";
import PeriodFilter from "./PeriodFilter";
import formatRate from "../services/rateFormatter";

/**
 * The header — title, live rate and the period filter — always renders.
 *
 * Previously this component returned early for loading, error and empty states,
 * which unmounted the filter along with the chart. That made the filter
 * disappear for the duration of every refetch, so a user who wanted to change
 * the window again had to wait for the fetch they had just triggered to finish.
 * Only the chart body swaps now; the control that drives it stays put.
 */
function ChartHeader({
	base,
	quote,
	conversionRate,
	period,
	setPeriod,
	rangeLabel,
	change,
	changeLabel,
}) {
	// The rate is legitimately null while the quote loads or the pair is changing.
	const hasRate = conversionRate !== null && Number.isFinite(conversionRate);

	// A rate is only meaningful between two named currencies. During a window change
	// the history query drops to undefined for a frame while the quote survives it,
	// which used to print "1 undefined = 1330.64 undefined". "Loading current rate…"
	// is the honest answer for that frame: the figure exists, the pair it belongs to
	// does not yet.
	const pairKnown =
		typeof base === "string" &&
		base.length > 0 &&
		typeof quote === "string" &&
		quote.length > 0;
	const rateLine = hasRate && pairKnown
		? `1 ${base} = ${formatRate(conversionRate)} ${quote}`
		: "Loading current rate…";

	// Title and rate on the left, the control on the right, sharing one baseline
	// row. The filter sits opposite the figures it changes them, and above it on
	// narrow screens rather than squeezing the chart.
	//
	// `min-w-0` on the figures column is load-bearing. The filter is a fixed-width
	// segmented control with six options and will not compress, so without it the
	// text column refused to shrink below its content width and pushed the control
	// off the right edge of the card entirely — the 1Y option was simply not on
	// screen, with no scrollbar to reveal it.
	return (
		<div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3 p-4 pb-0 mb-8">
			<div className="min-w-0 flex-1">
				<p className="text-lg font-semibold tracking-tight">{rangeLabel}</p>
				<p className="mt-1 text-base font-semibold text-gray-500">{rateLine}</p>
			</div>

			<PeriodFilter
				value={period}
				onchange={setPeriod}
				change={change}
				changeLabel={changeLabel}
			/>
		</div>
	);
}

export default function ConversionChart({
	data,
	base,
	quote,
	conversionRate,
	isLoading,
	error,
	period,
	setPeriod,
	change,
	changeLabel,
}) {
	const hasData = Array.isArray(data) && data.length > 0;

	let rangeLabel;
	if (hasData) {
		const from = new Date(data[0].date).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
		const to = new Date(data[data.length - 1].date).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
		rangeLabel = `${from} ‒ ${to}`;
	} else {
		rangeLabel = "Exchange-rate history";
	}

	return (
		<div className="w-full h-full flex flex-col">
			<ChartHeader
				base={base}
				quote={quote}
				conversionRate={conversionRate}
				period={period}
				setPeriod={setPeriod}
				rangeLabel={rangeLabel}
				change={change}
				changeLabel={changeLabel}
			/>

			<div className="flex-1 min-h-[450px] lg:min-h-96 pr-4 pb-4">
				{isLoading && (
					<LoadingRegion isLoading label="Rate history">
						<div className="content-center">
							<LoadingComponent />
						</div>
					</LoadingRegion>
				)}

				{!isLoading && error && (
					<div className="p-6 text-center text-gray-600">
						Unable to load exchange-rate history. Please try again shortly.
					</div>
				)}

				{!isLoading && !error && !hasData && (
					<div className="p-6 text-center text-gray-600">
						No exchange-rate history is available for this currency pair yet.
					</div>
				)}

				{!isLoading && !error && hasData && (
					<ResponsiveContainer width="100%" height="100%">
						<AreaChart data={data}>
							<defs>
								<linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
									<stop offset="5%" stopColor="#007BFF" stopOpacity={0.8} />
									<stop offset="95%" stopColor="#007BFF" stopOpacity={0} />
								</linearGradient>
							</defs>
							<CartesianGrid strokeDasharray="4" />
							<XAxis
								dataKey="date"
								tickFormatter={(d) =>
									new Date(d).toLocaleDateString("en-GB", {
										day: "2-digit",
										month: "2-digit",
									})
								}
								fontSize={14}
							/>
							<YAxis
								domain={["auto", "auto"]}
								tickFormatter={(v) => formatRate(v)}
								width={65}
								fontSize={14}
							/>
							<Tooltip
								formatter={(value) =>
									value === null || value === undefined ? "—" : formatRate(value)
								}
								cursorStyle={{ opacity: 0.1 }}
								wrapperStyle={{ backgroundColor: "#000" }}
								labelFormatter={(label) =>
									`Date: ${new Date(label).toLocaleDateString("en-US", {
										year: "numeric",
										month: "short",
										day: "numeric",
									})}`
								}
							/>

							<Area
								type="monotone"
								dataKey="value"
								stroke="#007BFF"
								strokeWidth={2}
								fillOpacity={1}
								fill="url(#colorRate)"
							/>
						</AreaChart>
					</ResponsiveContainer>
				)}
			</div>
		</div>
	);
}
