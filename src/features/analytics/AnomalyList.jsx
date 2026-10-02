
/**
 * Unusually large sessions — spec §18.
 *
 * The detector measures each session against that pair's own trailing 60-session
 * baseline, so the card states the z-score rather than asserting "unusual". It
 * renders nothing at all when there are none, because a permanent "no anomalies"
 * panel teaches people to stop reading it.
 */
export default function AnomalyList({ analytics }) {
	const anomalies = analytics?.anomalies || [];
	if (!anomalies.length) return null;

	const fmtDate = (iso) => {
		if (!iso) return "—";
		const d = new Date(`${iso}T00:00:00Z`);
		return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
	};

	const recent = [...anomalies].reverse().slice(0, 3);

	return (
		<div>
			<div className="mb-2.5 flex items-center gap-2">
				<span className="rounded bg-possible-soft px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-possible">
					Unusual movement
				</span>
				<span className="text-[12.5px] font-bold text-slate-900">
					{anomalies.length} session{anomalies.length > 1 ? "s" : ""} flagged
				</span>
			</div>

			<ul className="space-y-2.5">
				{recent.map((a) => (
					<li key={`${a.date}-${a.pct}`} className="flex items-start gap-2.5">
						<span className="pt-1 text-[11px] text-possible">▲</span>
						<div className="min-w-0">
							<p className="text-[12.5px] text-slate-800">
								<b className="num font-bold tabular-nums">
									{a.pct >= 0 ? "+" : "−"}
									{Math.abs(a.pct).toFixed(2)}%
								</b>{" "}
								in one session on {fmtDate(a.date)} — {Math.abs(a.z).toFixed(1)}{" "}
								standard deviations from its own 60-session average
								<span
									className={`ml-1.5 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
										a.severity === "high"
											? "bg-possible-soft text-possible"
											: "bg-slate-100 text-slate-500"
									}`}
								>
									{a.severity}
								</span>
							</p>
							<p className="mt-0.5 text-[11px] leading-relaxed text-slate-400">
								Detected from the published rate series alone. This is a measurement, not a
								story about why.
							</p>
						</div>
					</li>
				))}
			</ul>
		</div>
	);
}
