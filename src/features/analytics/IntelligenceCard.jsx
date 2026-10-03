import { useEffect, useState } from "react";
import { FieldLabel, RegisterPill } from "./primitives";
import RangeExtremes from "./RangeExtremes";
import { useCountUp } from "../../hooks/useCountUp";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";

/**
 * The intelligence summary — one card, one reading.
 *
 * Range, trend and volatility sit side by side as a three-column readout, and the
 * composite score runs underneath behind a rule. That is the whole point of the
 * layout: they answer three parts of a single question, so they are read
 * together, and the score that summarises them belongs directly under it rather
 * than in a card of its own several rows away.
 *
 * It replaces the former multi-window performance strip. That strip asked the
 * engine for six windows at once and showed a row of figures, which duplicated
 * the chart filter — the same numbers were already legible under each chip — and
 * pushed the classifications and the score below the fold. The windows remain
 * available; they live where the window is chosen.
 *
 * Every figure here comes from the engine. Nothing is derived in this component.
 */

/**
 * Fixed decimals, grouped thousands.
 *
 * Grouping is not decoration here. Rates run from 0.000008 to four figures per
 * unit, so a bare 1321.23 beside a low of 1321.23 is genuinely harder to compare
 * at a glance than 1,321.23 — and the range reads as one number unless the
 * grouping makes the shared leading digits obvious.
 */
function fmt(value, digits = 2) {
	if (value === null || value === undefined || !Number.isFinite(value)) return "—";
	return Number(value).toLocaleString("en-US", {
		minimumFractionDigits: digits,
		maximumFractionDigits: digits,
	});
}

/** One column of the summary grid. Renders honestly when unmeasurable. */
function Measure({ label, value, detail, unavailable, children }) {
	const missing = value === null || value === undefined;

	return (
		<div className="min-w-0 px-5 py-4" data-measure={label}>
			<FieldLabel>{label}</FieldLabel>
			{missing ? (
				<>
					<p
						className="mt-1.5 text-[19px] font-bold leading-tight text-slate-300"
						title={unavailable}
					>
						—
					</p>
					<p className="mt-1.5 text-[12px] leading-snug text-slate-400">
						{unavailable || "Not enough history yet"}
					</p>
				</>
			) : (
				<>
					<p className="num mt-1.5 text-[19px] font-bold leading-tight tabular-nums text-slate-900">
						{value}
					</p>
					{detail && (
						<p className="mt-1.5 text-[12px] leading-snug text-slate-500">{detail}</p>
					)}
					{children}
				</>
			)}
		</div>
	);
}

/**
 * One end of the range track.
 *
 * Pinned just outside the track rather than on it, so a 6px dot cannot be
 * swallowed by a 4px-tall bar at either extreme. `start`/`end` rather than a
 * left percentage, because the two positions are 0% and 100% — anything else
 * would be a number pretending to be a measurement.
 *
 * The low is the smaller dot and the high the larger. Size is doing real work
 * here: it is the part of this distinction that survives with no colour
 * perception at all, and it also stops the two from looking like a decorative
 * repeat of the same dot.
 */
function ExtremeMarker({ at, revealed, reducedMotion }) {
	const isLow = at === "low";

	return (
		<span
			aria-hidden="true"
			data-extreme={at}
			data-shown={revealed ? "yes" : "no"}
			className={`absolute top-1/2 -translate-y-1/2 rounded-full ring-2 ring-white ${
				isLow
					? "left-0 h-1.5 w-1.5 -translate-x-1/2 bg-slate-400"
					: "right-0 h-2 w-2 translate-x-1/2 bg-measured-deep"
			}`}
			style={{
				opacity: revealed || reducedMotion ? 1 : 0,
				transition: reducedMotion ? undefined : "opacity 400ms ease-out",
			}}
		/>
	);
}

/**
 * The score, as a semicircle that fills as the number counts up.
 *
 * A gauge earns its place only if the arc means something — which is why the
 * full track is drawn at full length and the fill is a proportion of exactly
 * that, rather than being scaled to whichever value happens to be showing. A
 * score of 40 fills two fifths of a fixed track, every time.
 *
 * The arc sweeps with a CSS transition rather than per-frame: it is a stroke
 * property changing between two rendered values, which the compositor handles.
 * Only the number needs a value per frame.
 *
 * The figure is exposed to assistive technology once, through the label, so a
 * screen reader hears "36 out of 100" rather than the intermediate counts.
 */
function ScoreGauge({ score, band }) {
	const reducedMotion = usePrefersReducedMotion();
	const radius = 40;
	const circumference = Math.PI * radius;

	const shown = useCountUp(score, reducedMotion ? 0 : 900, 120);

	// One flag, one transition. The element renders at its empty state first and
	// flips to filled on the next frame, so the browser interpolates.
	const [revealed, setRevealed] = useState(reducedMotion);
	useEffect(() => {
		if (reducedMotion) {
			setRevealed(true);
			return undefined;
		}
		const frame = requestAnimationFrame(() => setRevealed(true));
		return () => cancelAnimationFrame(frame);
	}, [reducedMotion, score]);

	const track = "M12,50 A40,40 0 0 1 92,50";
	const filledFraction = Math.max(0, Math.min(1, score / 100));

	return (
		<svg
			width="104"
			height="60"
			viewBox="0 0 104 60"
			role="img"
			aria-label={`Ratevo score ${score} out of 100, ${band}`}
			className="shrink-0 overflow-visible"
		>
			<path d={track} fill="none" stroke="#eef2f7" strokeWidth="9" strokeLinecap="round" />
			<path
				d={track}
				fill="none"
				stroke="#2b4ed8"
				strokeWidth="9"
				strokeLinecap="round"
				strokeDasharray={circumference}
				strokeDashoffset={revealed ? circumference * (1 - filledFraction) : circumference}
				style={
					reducedMotion
						? undefined
						: { transition: "stroke-dashoffset 900ms cubic-bezier(0.22, 1, 0.36, 1)" }
				}
			/>
			<text
				x="52"
				y="46"
				textAnchor="middle"
				aria-hidden="true"
				style={{ fontSize: "26px", fontWeight: 800, fill: "#0f172a" }}
			>
				{Math.round(shown)}
			</text>
		</svg>
	);
}

export default function IntelligenceCard({ analytics, baseCurrency, quoteCurrency }) {
	const [showBreakdown, setShowBreakdown] = useState(false);
	const reducedMotion = usePrefersReducedMotion();
	// A primitive, not `analytics.range` — a property access in a dependency list
	// is evaluated even on the path where analytics is null.
	const rangePosition = analytics?.range?.positionPct ?? null;

	const [barRevealed, setBarRevealed] = useState(reducedMotion);
	useEffect(() => {
		if (reducedMotion) {
			setBarRevealed(true);
			return undefined;
		}
		const frame = requestAnimationFrame(() => setBarRevealed(true));
		return () => cancelAnimationFrame(frame);
	}, [reducedMotion, rangePosition]);

	if (!analytics) return null;

	const range = analytics.range;
	const score = analytics.score;
	const detail = analytics.scoreDetail;
	const components = detail?.components || [];

	const scoreMissing = score === null || score === undefined;
	const days = range?.days ?? analytics.period;

	// A score is a statement about a period, so a number without its period is
	// not yet a fact the user can check against anything.
	const windowNote = (() => {
		const measured = analytics.measured;
		if (!measured || measured.spanDays === null) return null;
		if (!measured.substituted && !analytics.coverage?.missingCount) return null;
		if (measured.substituted) {
			return `Measured over ${measured.spanDays} days — the ${measured.requested}-day window is not yet available.`;
		}
		return `Measured over ${measured.spanDays} calendar days.`;
	})();

	return (
		<section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
			{/* ---- the three measurements, read together ---- */}
			<div className="grid divide-y divide-slate-200 sm:grid-cols-3 sm:divide-y-0 sm:divide-x">
				<Measure
					label={`${days}-day range`}
					value={
						range
							? `${fmt(range.low)} – ${fmt(range.high)}`
							: null
					}
					detail={range ? `${range.label} · ${range.positionPct}%` : null}
					unavailable="Not enough history to measure a range yet"
				>
					{range && (
						<>
							{/* The two ends are pinned to the track itself, so the bar becomes the
							    axis the dates are read against rather than decoration beside
							    them. They sit at 0% and 100% because that is where the low and
							    the high are by definition; the fill between them is where the
							    rate sits right now. */}
							<span className="relative mt-2.5 block h-1 w-full rounded-full bg-slate-100">
								<ExtremeMarker at="low" revealed={barRevealed} reducedMotion={reducedMotion} />
								<ExtremeMarker at="high" revealed={barRevealed} reducedMotion={reducedMotion} />
								<span
									className="block h-full rounded-full bg-measured"
									style={{
										width: `${barRevealed ? Math.max(0, Math.min(100, range.positionPct)) : 0}%`,
										transition: reducedMotion
											? undefined
											: "width 800ms cubic-bezier(0.22, 1, 0.36, 1)",
									}}
								/>
							</span>
							<RangeExtremes range={range} />
						</>
					)}
				</Measure>

				<Measure
					label="Trend"
					value={analytics.trendLabel || null}
					detail={
						analytics.persistence === null || analytics.persistence === undefined
							? null
							: `${Math.round(analytics.persistence * 100)}% of sessions closed higher`
					}
					unavailable="Not enough history to measure a trend yet"
				/>

				<Measure
					label="Volatility"
					value={analytics.volatilityLabel || null}
					detail={
						analytics.annualisedVolPct === null ||
						analytics.annualisedVolPct === undefined
							? null
							: `${fmt(analytics.annualisedVolPct, 1)}% annualised`
					}
					unavailable="Not enough history to measure volatility yet"
				/>
			</div>

			{/* ---- the score, directly beneath what it summarises ---- */}
			<div className="border-t border-slate-200 px-5 py-4">
				<div className="flex items-start gap-4">
					{scoreMissing ? (
						<div className="min-w-0">
							<div className="flex items-center gap-2">
								<span className="text-[13px] font-bold text-slate-400">
									Ratevo score
								</span>
								<RegisterPill kind="possible">Not published</RegisterPill>
							</div>
							<p className="mt-1 text-[12px] leading-snug text-possible">
								{detail?.reason || "Not enough history to measure every component."}
							</p>
						</div>
					) : (
						<>
							<ScoreGauge score={score} band={analytics.scoreBand} />
							<div className="min-w-0 flex-1">
								<p className="text-[13px] font-bold text-slate-900">
									Ratevo score
									<span className="text-slate-400"> · </span>
									<span className="text-measured">{analytics.scoreBand}</span>
								</p>
								<p className="mt-1 text-[12px] leading-snug text-slate-500">
									A trend rating, not a forecast.
								</p>
								{windowNote && (
									<p className="mt-1 text-[11px] leading-snug text-slate-400">
										{windowNote}
									</p>
								)}
							</div>
						</>
					)}

					{/* Far right, as designed. Only offered when there is a breakdown
					    to open — a disclosure that reveals nothing is worse than none. */}
					{!scoreMissing && components.length > 0 && (
						<button
							type="button"
							onClick={() => setShowBreakdown((v) => !v)}
							aria-expanded={showBreakdown}
							className="pressable ml-auto flex shrink-0 items-center gap-1 self-center rounded-lg px-2 py-1.5 text-[13px] font-semibold text-measured hover:bg-measured-soft active:bg-measured-line"
						>
							{showBreakdown ? "Hide breakdown" : "See breakdown"}
							<span aria-hidden="true" className="text-[15px] leading-none">
								{showBreakdown ? "−" : "›"}
							</span>
						</button>
					)}
				</div>

				{showBreakdown && !scoreMissing && (
					<div className="mt-4 border-t border-slate-100 pt-4">
						<div className="space-y-0.5">
							{components.map((c) => (
								<div
									key={c.key}
									title={`${c.note} · weight ${Math.round(c.weight * 100)}%`}
									className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)_26px] items-center gap-2.5 py-1"
								>
									<span className="flex min-w-0 items-center gap-1.5 text-[11.5px] font-semibold text-slate-500">
										<span className="truncate">{c.label}</span>
										<span className="shrink-0 text-[10px] font-bold text-slate-300">
											{Math.round(c.weight * 100)}%
										</span>
									</span>
									<span className="block h-1.5 overflow-hidden rounded-full bg-slate-100">
										<span
											className={`block h-full rounded-full ${
												c.key === "stability" && c.value < 50
													? "bg-possible"
													: "bg-measured"
											}`}
											style={{ width: `${c.value}%` }}
										/>
									</span>
									<span className="num text-right text-[12px] font-bold tabular-nums text-slate-900">
										{c.value}
									</span>
								</div>
							))}
						</div>

						<div className="mt-3 text-[11.5px] leading-relaxed text-slate-500">
							<div className="num rounded-lg bg-slate-50 px-2.5 py-2 text-[11px] text-slate-600">
								score = 0.30·performance + 0.25·momentum + 0.25·trend + 0.20·stability
							</div>
							<p className="mt-2">
								Each component is normalised to 0–100 from the measured analytics for the
								window on screen, then combined with fixed published weights. The weights and
								bands are versioned as v{detail?.version || "1.0.0"}, so the same inputs
								always produce the same score.
							</p>
						</div>
					</div>
				)}
			</div>

			{/* The quote currency is named here so the range above is never a bare
			    pair of numbers with nothing to attach them to. */}
			<p className="sr-only">
				Range, trend and volatility for {baseCurrency} to {quoteCurrency}, and the composite
				Ratevo score.
			</p>
		</section>
	);
}
