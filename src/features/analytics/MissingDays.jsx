import { useState } from "react";
import { AnalyticsCard } from "./primitives";

/**
 * The dates the snapshot job did not record.
 *
 * A gap in a daily series is not cosmetic. Every window in this product is
 * defined in calendar days, so a missing day changes what "30 days" means —
 * which makes it the sort of thing that has to be visible rather than inferred
 * from a number that looks slightly off.
 *
 * The engine now matches windows on dates rather than counting rows backwards,
 * so a gap no longer corrupts a measurement; it only shortens the span, and the
 * span is named. This panel is where the remaining holes are accounted for.
 *
 * It collapses to a single line when the series is complete, so it costs nothing
 * once the history is whole.
 */

function friendlyDate(iso) {
	const d = new Date(`${iso}T00:00:00`);
	if (Number.isNaN(d.getTime())) return iso;
	return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function MissingDays({ analytics }) {
	const coverage = analytics?.coverage;
	const days = coverage?.missingDays || [];

	const [expanded, setExpanded] = useState(false);

	if (!coverage) return null;

	// Nothing missing: state it and stop. No disclosure to click.
	if (!days.length) {
		return (
			<p className="text-[11px] text-slate-400">
				Every calendar day in this period has a recorded rate · {coverage.available} observations ·{" "}
				{coverage.first} to {coverage.last}
			</p>
		);
	}

	return (
		<AnalyticsCard
			title="Data coverage"
			note={`${days.length} day${days.length === 1 ? "" : "s"} without a recorded rate`}
		>
			<p className="text-[11.5px] leading-relaxed text-slate-500">
				Ratevo could not record a rate on {days.length} of the{" "}
				{coverage.calendarSpan + 1} days in this period. Windows are matched by date rather
				than by counting backwards, so these gaps shorten the span that can be measured
				without distorting what is measured — and the span used is always stated.
			</p>

			<button
				type="button"
				onClick={() => setExpanded((v) => !v)}
				className="pressable mt-2.5 text-[11px] font-bold uppercase tracking-wider text-measured underline underline-offset-2 hover:opacity-70 active:opacity-60"
				aria-expanded={expanded}
			>
				{expanded ? "Hide dates" : `Show the ${days.length} dates`}
			</button>

			{expanded && (
				<ul className="mt-2.5 flex flex-wrap gap-1.5">
					{days.map((iso) => (
						<li
							key={iso}
							className="num rounded-md border border-possible-line bg-possible-soft px-2 py-1 text-[11px] font-semibold text-possible"
							title={`No rate recorded for ${friendlyDate(iso)}`}
						>
							{iso}
						</li>
					))}
				</ul>
			)}
		</AnalyticsCard>
	);
}