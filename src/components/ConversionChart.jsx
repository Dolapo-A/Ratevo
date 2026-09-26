/* eslint-disable react/prop-types */
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

export default function ConversionChart({
	data,
	base,
	quote,
	conversionRate,
	isLoading,
	error,
	period,
	setPeriod,
}) {
	if (isLoading)
		return (
			<div className="content-center">
				<LoadingComponent />
			</div>
		);

	if (error)
		return (
			<div className="p-6 text-center text-gray-600">
				Unable to load exchange-rate history. Please try again shortly.
			</div>
		);

	if (!data || data.length === 0)
		return (
			<div className="p-6 text-center text-gray-600">
				No exchange-rate history is available for this currency pair yet.
			</div>
		);

	return (
		<div className="w-full h-full flex flex-col">
			<div className="p-4 pb-0">
				<div className="flex mb-2">
					<h1 className="text-xl font-semibold">
						{`Rates from ${new Date(data[0].date).toLocaleDateString("en-US", {
							year: "numeric",
							month: "short",
							day: "numeric",
						})}  ‒ ${new Date(data[data.length - 1].date).toLocaleDateString(
							"en-US",
							{
								year: "numeric",
								month: "short",
								day: "numeric",
							}
						)}`}
					</h1>
				</div>
				<h3 className="text-base font-semibold mb-2 text-gray-500">
					{`1 ${base} = ${formatRate(conversionRate)} ${quote}`}
				</h3>
				{period >= 6 ? (
					<div className="flex gap-2 mb-4">
						<PeriodFilter value={period} onchange={setPeriod} />
					</div>
				) : (
					<></>
				)}
			</div>

			<div className="flex-1 min-h-[450px] lg:min-h-96 pr-4 pb-4">
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
							formatter={(value) => value.toFixed(4)}
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
			</div>
		</div>
	);
}
