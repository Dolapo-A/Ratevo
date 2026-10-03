import { FieldLabel, RegisterPill } from "./primitives";
import { FEATURES } from "../../config/features";

/**
 * "What changed?" — spec §10.
 *
 * Built in layers, because the two kinds of statement must never be mistaken for
 * each other:
 *
 *   Layer 1  MEASURED. Both windows, the difference between them, and the
 *            momentum / trend / volatility context they sit in. Every figure is
 *            produced by the engine; the sentence is assembled there too, so the
 *            phrasing cannot drift from the number above it.
 *
 *   Layer 2  INTERPRETED. "Why does it matter." Reserved for a model, flagged
 *            off, and structurally separate so a generated claim can never be
 *            mistaken for a measurement.
 *
 * The context line is not decoration. A bare "+2.9pp" invites a reader to supply
 * their own story; naming the trend and volatility alongside it states what was
 * measured and leaves the interpretation to them — until Phase 2 offers one
 * explicitly, and labels it.
 *
 * Comparing two windows needs enough history to fill three of them. Where that is
 * not available the engine returns null and this says so, rather than quietly
 * rendering nothing and leaving the reader to wonder whether the comparison was
 * made and found unremarkable.
 */

/** The figures that stop a delta being read in isolation. */
function ContextLine({ analytics }) {
	const rows = [
		["Momentum", analytics.momentumLabel],
		["Trend", analytics.trendLabel],
		["Volatility", analytics.volatilityLabel],
	].filter(([, value]) => value !== null && value !== undefined);

	if (!rows.length) return null;

	return (
		<div className="mt-3">
			<p className="mb-1.5 text-[11.5px] leading-relaxed text-slate-500">
				Read alongside, so the figure above is not taken on its own:
			</p>
			<dl className="border-l-2 border-slate-200 pl-3">
				{rows.map(([label, value]) => (
					<div key={label} className="flex items-baseline gap-1.5">
						<dt className="text-[12px] font-bold text-slate-700">{label}:</dt>
						<dd className="text-[12px] text-slate-600">{value}</dd>
					</div>
				))}
			</dl>
		</div>
	);
}

/**
 * Layer 2, reserved.
 *
 * Deliberately empty. When a model writes here it will be told to speak only
 * about the figures in Layer 1, to mark uncertainty as uncertainty, and to avoid
 * causal claims it cannot cite — §25. The border and the register pill are the
 * affordance that will carry that distinction once there is something to show.
 */
function InterpretationLayer({ analytics }) {
	if (!FEATURES.INSIGHT_PANEL) return null;

	// Naming the inputs is the point. The model's scope is bounded by what the
	// engine measured, so the boundary is visible before anything is generated
	// into it.
	const inputs = [
		analytics?.changePct === null || analytics?.changePct === undefined
			? null
			: `${Math.abs(analytics.changePct).toFixed(2)}% this window`,
		analytics?.priorPeriod === null || analytics?.priorPeriod === undefined
			? null
			: `${Math.abs(analytics.priorPeriod).toFixed(2)}% the window before`,
		analytics?.trendLabel || null,
		analytics?.volatilityLabel || null,
		analytics?.momentumLabel || null,
	].filter(Boolean);

	return (
		<div className="mt-4 rounded-xl border border-ai-line bg-ai-soft/60 p-3">
			<div className="mb-1.5 flex items-center gap-2">
				<FieldLabel>Why does it matter?</FieldLabel>
				<RegisterPill kind="ai">Ratevo Intelligence</RegisterPill>
			</div>
			<p className="text-[12px] leading-relaxed text-slate-600">
				Interpretation is not switched on. When it is, it will speak only about these
				figures — {inputs.join(" · ")} — and will not assert a cause Ratevo cannot
				cite.
			</p>
		</div>
	);
}

/**
 * The two windows as diverging bars.
 *
 * This is the scan; the sentence below it is the explanation. Keeping both is
 * deliberate rather than redundant — a bar carries direction and relative
 * magnitude in a glance, and prose carries the same two facts as something a
 * reader can be sure of. Removing either loses a way of reading the comparison.
 *
 * Bars are scaled against the larger of the two, so the longer one always fills
 * half the track and the shorter is read relative to it.
 */
function WindowBars({ now, prior, periodLabel }) {
	const maxAbs = Math.max(Math.abs(now), Math.abs(prior), 0.1);

	const bar = (value, isNow) => {
		const half = (Math.abs(value) / maxAbs) * 48;
		const left = value >= 0 ? 50 : 50 - half;

		return (
			<div className="grid grid-cols-[72px_1fr_58px] items-center gap-3">
				<span
					className={`text-[11.5px] ${
						isNow ? "font-bold text-slate-700" : "text-slate-400"
					}`}
				>
					{isNow ? `Last ${periodLabel}` : `Prior ${periodLabel}`}
				</span>
				<span className="relative block h-5 overflow-hidden rounded-md bg-slate-50">
					{/* The zero line, so direction is legible without reading the sign. */}
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

	return (
		<div className="space-y-1.5">
			{bar(now, true)}
			{bar(prior, false)}
		</div>
	);
}

export default function WhatChanged({ analytics }) {
	const summary = analytics?.changeSummary;
	const delta = analytics?.deltaPp;

	// The engine only composes a sentence when both windows were measured.
	if (!summary) {
		return (
			<div>
				<FieldLabel className="mb-2">What changed</FieldLabel>
				<div className="rounded-xl border border-possible-line bg-possible-soft px-3 py-2.5">
					<p className="text-[12px] font-bold text-possible">
						Not enough history to compare windows
					</p>
					<p className="mt-0.5 text-[11.5px] leading-relaxed text-possible/90">
						This comparison needs three full {analytics?.periodLabel} windows. Ratevo has{" "}
						{analytics?.coverage?.available ?? 0} observations so far, so it is not shown
						rather than estimated.
					</p>
				</div>
			</div>
		);
	}

	const up = delta > 0;

	return (
		<div>
			<div className="mb-2.5 flex items-baseline gap-2">
				<FieldLabel>What changed</FieldLabel>
				<span className="text-[11px] text-slate-400">
					this window against the one before it
				</span>
			</div>

			{/* ---- Layer 1: measured ---- */}
			<p
				className={`num text-[17px] font-bold leading-tight tabular-nums ${
					up ? "text-direction-up" : "text-direction-down"
				}`}
			>
				{up ? "+" : "−"}
				{Math.abs(delta).toFixed(1)} percentage points
			</p>

			<div className="mt-3">
				<WindowBars
					now={analytics.changePct}
					prior={analytics.priorPeriod}
					periodLabel={analytics.periodLabel}
				/>
			</div>

			<blockquote className="mt-3 border-l-2 border-slate-200 pl-3 text-[12.5px] leading-relaxed text-slate-600">
				{summary.text}
			</blockquote>

			<ContextLine analytics={analytics} />

			{/* ---- Layer 2: interpreted, flagged off ---- */}
			<InterpretationLayer analytics={analytics} />
		</div>
	);
}