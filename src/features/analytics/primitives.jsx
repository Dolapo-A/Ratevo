
/**
 * Shared primitives for the analytics surfaces.
 *
 * These encode the two rules the rest of the panel relies on:
 *
 *   1. Measured values are numeric and carry the MEASURED register pill.
 *   2. A window the engine could not measure renders as an em dash with a
 *      tooltip explaining why. Never as 0, never blank, never omitted —
 *      because a missing figure that looks like a real one is a fabricated one.
 */

/** The register pill. The only sanctioned way to label a kind of statement. */
export function RegisterPill({ kind = "measured", children }) {
	const styles = {
		measured: "bg-measured-soft text-measured",
		ai: "bg-ai-soft text-ai",
		evidence: "bg-evidence-soft text-evidence",
		possible: "bg-possible-soft text-possible",
	};
	const dot = {
		measured: "bg-measured",
		ai: "bg-ai",
		evidence: "bg-evidence",
		possible: "bg-possible",
	};
	return (
		<span
			className={`inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${styles[kind]}`}
		>
			<span className={`h-[2.5px] w-[2.5px] rounded-full ${dot[kind]}`} />
			{children}
		</span>
	);
}

/** Small uppercase label used for field names and column heads. */
export function FieldLabel({ children, className = "" }) {
	return (
		<span
			className={`block text-[11px] font-bold uppercase tracking-[.08em] text-slate-400 ${className}`}
		>
			{children}
		</span>
	);
}

/**
 * A value the engine measured, or an honest absence.
 *
 * `value === null` is a real state and it has a real explanation, so it is
 * rendered as a dash with the reason attached rather than silently dropped.
 */
export function MeasuredValue({ value, unavailableReason = "Not enough history yet", className = "" }) {
	if (value === null || value === undefined) {
		return (
			<span
				className={`text-slate-300 ${className}`}
				title={unavailableReason}
				aria-label={unavailableReason}
			>
				—
			</span>
		);
	}
	return <span className={className}>{value}</span>;
}

/** Signed percentage with a direction colour. Colour is never the only signal. */
export function ChangeValue({ value, digits = 2, unavailableReason }) {
	if (value === null || value === undefined) {
		return <MeasuredValue value={null} unavailableReason={unavailableReason} />;
	}
	const up = value >= 0;
	const tone = up ? "text-direction-up" : "text-direction-down";
	return (
		<span className={`num font-bold tabular-nums ${tone}`}>
			<span aria-hidden="true">{up ? "↑" : "↓"}</span>{" "}
			{Math.abs(value).toFixed(digits)}%
		</span>
	);
}

/** A labelled measured figure, the unit the panel is built from. */
export function MeasuredRow({ label, value, unavailableReason, valueClassName = "" }) {
	return (
		<div className="flex items-baseline justify-between gap-4 py-1.5">
			<span className="text-[12.5px] text-slate-500">{label}</span>
			<MeasuredValue
				value={value}
				unavailableReason={unavailableReason}
				className={`num text-[12.5px] font-bold tabular-nums text-slate-900 ${valueClassName}`}
			/>
		</div>
	);
}

/** The card every analytics surface sits in. */
export function AnalyticsCard({ title, note, pill = "measured", children, className = "", action }) {
	return (
		<section className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-card ${className}`}>
			{(title || action) && (
				<header className="mb-4 flex items-center gap-3">
					{title && <h3 className="text-[15px] font-bold text-slate-900">{title}</h3>}
					{note && <span className="text-[11.5px] text-slate-400">{note}</span>}
					{pill && (
						<div className="ml-auto">
							<RegisterPill kind={pill}>{pill === "measured" ? "Measured" : pill}</RegisterPill>
						</div>
					)}
					{action}
				</header>
			)}
			{children}
		</section>
	);
}
