import { FEATURES } from "../../config/features";
import { useAnalytics } from "../../hooks/useAnalytics";
import { AnalyticsCard } from "./primitives";
import AnomalyList from "./AnomalyList";
import WhatChanged from "./WhatChanged";
import CoverageNote from "./CoverageNote";
import MissingDays from "./MissingDays";
import IntelligenceCard from "./IntelligenceCard";

/**
 * The analytics panel — composed from independently flagged pieces.
 *
 * Every child is a separate, tested component behind its own flag, so a release
 * is a one-line environment change rather than a code change. If nothing is
 * enabled the panel renders nothing at all, including no empty shell, so the
 * converter looks exactly as it did before any of this shipped.
 */

function Skeleton() {
	return (
		<div className="space-y-3" aria-hidden="true">
			<div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
				<div className="grid sm:grid-cols-3">
					{[0, 1, 2].map((i) => (
						<div key={i} className="space-y-2 px-5 py-4">
							<div className="h-2 w-16 animate-pulse rounded bg-slate-100" />
							<div className="h-5 w-28 animate-pulse rounded bg-slate-100" />
							<div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
						</div>
					))}
				</div>
				<div className="border-t border-slate-200 px-5 py-4">
					<div className="flex items-center gap-4">
						<div className="h-7 w-12 animate-pulse rounded bg-slate-100" />
						<div className="flex-1 space-y-2">
							<div className="h-3 w-40 animate-pulse rounded bg-slate-100" />
							<div className="h-3 w-32 animate-pulse rounded bg-slate-100" />
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export default function AnalyticsPanel({ base, quote, period }) {
	const enabled = Object.values(FEATURES).some(Boolean);
	const { analytics, isLoading } = useAnalytics(base, quote, period, enabled);

	if (!enabled) return null;

	return (
		<div className="space-y-4">
			{/* One card for the three measurements and the score that summarises
			    them. The former multi-window performance strip is gone: it repeated
			    the numbers already printed under each chart filter chip, and pushed
			    everything below it out of the first screen. */}
			{FEATURES.INTELLIGENCE && analytics && (
				<IntelligenceCard
					analytics={analytics}
					baseCurrency={base}
					quoteCurrency={quote}
				/>
			)}

			<div className="grid gap-4 md:grid-cols-2">
				{/* ---- anomalies, only when there are any ---- */}
				{FEATURES.ANOMALIES && analytics?.anomalies?.length > 0 && (
					<AnalyticsCard pill={null}>
						<AnomalyList analytics={analytics} />
					</AnalyticsCard>
				)}

				{/* ---- what changed ---- */}
				{FEATURES.WHAT_CHANGED && (
					<AnalyticsCard>
						{isLoading ? (
							<Skeleton />
						) : analytics ? (
							<WhatChanged analytics={analytics} />
						) : null}
					</AnalyticsCard>
				)}

				{/* ---- the dates the snapshot job did not record ---- */}
				{FEATURES.MISSING_DAYS && analytics && <MissingDays analytics={analytics} />}
			</div>

			{FEATURES.COVERAGE && analytics && <CoverageNote analytics={analytics} />}
		</div>
	);
}
