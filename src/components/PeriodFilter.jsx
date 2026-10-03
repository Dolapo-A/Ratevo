import { PERIODS } from "../config/periods";

/**
 * The chart's period filter — a segmented control, and the single control for
 * both the chart and the analytics panel.
 *
 * Each option carries the change for its own window beneath the label, so the
 * control also answers "what did this period do?" without a second lookup. The
 * numbers come from the analytics response's `change` map, which the engine
 * populates for every window on every request — so all of them are shown
 * whatever period is selected, and nothing here recomputes a percentage.
 *
 * A window the engine could not measure reads as a dash rather than 0%, and the
 * reason is on the title. That is the same rule the rest of the panel follows.
 *
 * Options come from src/config/periods.js so this component and the analytics
 * can never disagree about what "90D" means.
 */
function PeriodFilter({ value, onchange, change, changeLabel }) {
	if (value === undefined || value === null || !onchange) return null;

	return (
		<div
			role="group"
			aria-label="Chart period"
			className="flex w-full items-stretch rounded-full border border-slate-200 bg-slate-100 p-1 sm:w-auto sm:shrink-0"
		>
			{PERIODS.map((option) => {
				const days = option.analyticsDays;
				const label = option.label;
				const pct = change?.[days];
				// Compared on historyDays because that is what the caller holds.
				// 24H is historyDays 0 — a legitimate value, not an absent one, which
				// is why the guard above checks for null rather than falsiness.
				const isActive = option.historyDays === value;

				const hasPct = pct !== null && pct !== undefined && Number.isFinite(pct);
				const up = hasPct && pct >= 0;

				// On the selected segment the percentage sits on a solid blue field,
				// where the usual direction colours have too little contrast to be
				// worth reading. The selection itself already carries the meaning.
				const pctTone = isActive
					? "text-blue-100"
					: !hasPct
						? "text-slate-400"
						: pct > 0
							? "text-direction-up"
							: pct < 0
								? "text-direction-down"
								: "text-slate-500";

				const unavailable = hasPct
					? undefined
					: `Not enough history to measure a ${changeLabel?.[days] || days} window yet`;

				return (
					<button
						key={option.analyticsDays}
						type="button"
						aria-pressed={isActive}
						onClick={() => onchange(option.historyDays)}
						title={
							unavailable ||
							`${label}: ${pct >= 0 ? "+" : "−"}${Math.abs(pct).toFixed(2)}% · measured by ratevo-analytics`
						}
						className={`pressable flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-full px-1 py-1.5 text-[10px] font-bold uppercase tracking-wide transition-colors sm:min-w-[3.75rem] sm:flex-none sm:px-2.5 sm:text-xs ${
							isActive
								? "bg-blue-500 text-white"
								: "text-slate-600 hover:bg-slate-200 active:bg-slate-300"
						}`}
					>
						<span className="leading-tight">{label}</span>
						<span
							className={`num text-[9.5px] font-bold leading-tight tabular-nums sm:text-[10px] ${pctTone}`}
						>
							{hasPct
								? `${up ? "↑" : "↓"} ${Math.abs(pct).toFixed(2)}%`
								: "—"}
						</span>
					</button>
				);
			})}
		</div>
	);
}

export default PeriodFilter;
