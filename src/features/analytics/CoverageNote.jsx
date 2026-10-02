import { useState } from "react";

/**
 * An honest statement about what the history does not yet support.
 *
 * This is the component people will want to delete, and it is the one that most
 * protects the product. Every window the engine returns as null is a window the
 * engine declined to fabricate, and if that is invisible the panel looks like it
 * is making claims it is not.
 *
 * It collapses to a single line once the dataset is mature.
 */
export default function CoverageNote({ analytics }) {
	const coverage = analytics?.coverage;
	const change = analytics?.change || {};
	const missing = Object.entries(change)
		.filter(([, value]) => value === null)
		.map(([key]) => analytics.changeLabel?.[key] || key);

	const [expanded, setExpanded] = useState(false);

	if (!coverage) return null;

	if (!missing.length && coverage.complete) {
		return (
			<p className="text-[11px] text-slate-400">
				{coverage.available} daily observations · {coverage.first} to {coverage.last} ·{" "}
				{analytics.provenance?.engine}
			</p>
		);
	}

	return (
		<div className="rounded-xl border border-possible-line bg-possible-soft">
			<button
				type="button"
				onClick={() => setExpanded((v) => !v)}
				className="pressable-soft flex w-full items-center gap-2 px-3 py-2.5 text-left active:opacity-80"
			>
				<span className="text-[12px] font-bold text-possible">
					History starts {coverage.first}
				</span>
				<span className="ml-auto text-[11px] font-bold text-possible/70">
					{expanded ? "Hide" : "Why?"}
				</span>
			</button>

			{expanded && (
				<div className="px-3 pb-3">
					<p className="text-[11.5px] leading-relaxed text-possible/90">
						Ratevo has {coverage.available} daily observation
						{coverage.available === 1 ? "" : "s"} for this pair, covering{" "}
						{coverage.measurableDays} days. The {missing.join(", ")} windows are not shown
						rather than estimated.
					</p>
					<p className="mt-1.5 text-[11.5px] leading-relaxed text-possible/80">
						A daily snapshot job builds this history over time. Until a window can be
						measured, Ratevo reports that it cannot measure it rather than filling the gap.
					</p>
				</div>
			)}
		</div>
	);
}
