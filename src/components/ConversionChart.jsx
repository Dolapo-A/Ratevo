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

	// Title and rate on the left, the control on the right, sharing one baseline
	// row. The filter sits opposite the figures it changes them, and above it on
	// narrow screens rather than squeezing the chart.
	return (
		<div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3 p-4 pb-0 mb-8">
			<div className="min-w-0">
				<h1 className="text-lg font-semibold tracking-tight">{rangeLabel}</h1>
				<h3 className="mt-1 text-base font-semibold text-gray-500">
					{hasRate
						? `1 ${base} = ${formatRate(conversionRate)} ${quote}`
						: "Loading current rate…"}
				</h3>
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
					<div className="content-center">
						<LoadingComponent />
					</div>
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
