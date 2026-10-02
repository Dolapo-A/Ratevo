import { FieldLabel } from "./primitives";

/**
 * "What changed?" — spec §10.
 *
 * Comparing this window with the one before it needs two full windows of
 * history. With 31 observations and a 30-day window there is only one, so the
 * engine returns null and this component says exactly that. The alternative —
 * quietly omitting the section — would leave a user wondering whether the
 * comparison was made and found unremarkable.
 */
export default function WhatChanged({ analytics }) {
	const now = analytics?.changePct;
	const prior = analytics?.priorPeriod;
	const delta = analytics?.deltaPp;

	if (now === null || now === undefined) return null;

	if (prior === null || prior === undefined || delta === null) {
		return (
			<div>
				<FieldLabel className="mb-2">What changed</FieldLabel>
				<div className="rounded-xl border border-possible-line bg-possible-soft px-3 py-2.5">
					<p className="text-[12px] font-bold text-possible">
						Not enough history to compare windows
					</p>
					<p className="mt-0.5 text-[11.5px] leading-relaxed text-possible/90">
						This comparison needs two full {analytics.periodLabel} windows. Ratevo has{" "}
						{analytics.coverage?.available ?? 0} observations so far, so it is not shown
						rather than estimated.
					</p>
				</div>
			</div>
		);
	}

	const maxAbs = Math.max(Math.abs(now), Math.abs(prior), 0.1);
	const bar = (value, isNow) => {
		const half = (Math.abs(value) / maxAbs) * 48;
		const left = value >= 0 ? 50 : 50 - half;
		return (
			<div className={`grid grid-cols-[84px_1fr_62px] items-center gap-3 ${isNow ? "" : ""}`}>
				<span className={`text-[11.5px] ${isNow ? "font-bold text-slate-700" : "text-slate-400"}`}>
					{isNow ? `Last ${analytics.periodLabel}` : `Prior ${analytics.periodLabel}`}
				</span>
				<span className="relative block h-5 overflow-hidden rounded-md bg-slate-50">
					<span className="absolute inset-y-0 left-1/2 w-px bg-slate-200" />
					<span
						className="absolute inset-y-0 rounded-md"
						style={{
							left: `${left}%`,
							width: `${half}%`,
							background:
								value >= 0 ? "rgba(15,122,83,.22)" : "rgba(179,38,63,.2)",
						}}
					/>
				</span>
				<span
					className={`num text-right text-[11.5px] font-bold tabular-nums ${
						value >= 0 ? "text-direction-up" : "text-direction-down"
					}`}
				>
					{value >= 0 ? "+" : "−"}
					{Math.abs(value).toFixed(1)}%
				</span>
			</div>
		);
	};

	const verb = delta >= 0 ? "accelerated" : "decelerated";

	return (
		<div>
			<div className="mb-2.5 flex items-baseline gap-2">
				<FieldLabel>What changed</FieldLabel>
				<span className="text-[11px] text-slate-400">this window against the one before it</span>
			</div>

			<div className="space-y-2">
				{bar(now, true)}
				{bar(prior, false)}
			</div>

			<p className="mt-2.5 text-[11.5px] leading-relaxed text-slate-500">
				Movement {verb} by {Math.abs(delta).toFixed(1)} percentage points — the recent window is{" "}
				{analytics.acceleration}.
			</p>
		</div>
	);
}
