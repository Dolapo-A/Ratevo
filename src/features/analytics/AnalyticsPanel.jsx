import { FEATURES } from "../../config/features";
import { AnalyticsCard } from "./primitives";
import { NoteSkeleton, WhatChangedSkeleton } from "../../components/Skeleton";
import AnomalyList from "./AnomalyList";
import WhatChanged from "./WhatChanged";
import CoverageNote from "./CoverageNote";
import MissingDays from "./MissingDays";

/**
 * The analytics panel — composed from independently flagged pieces.
 *
 * Every child is a separate, tested component behind its own flag, so a release
 * is a one-line environment change rather than a code change. If nothing is
 * enabled the panel renders nothing at all, including no empty shell, so the
 * converter looks exactly as it did before any of this shipped.
 */

export default function AnalyticsPanel({ analytics, isLoading }) {
	const enabled = Object.values(FEATURES).some(Boolean);

	if (!enabled) return null;

	return (
		<div className="space-y-4">
			{/* The intelligence card is not here: it sits above the converter in
			    App.jsx, because the thing that differentiates Ratevo should be the
			    first thing on the page rather than something below the fold. */}

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
							<WhatChangedSkeleton />
						) : analytics ? (
							<WhatChanged analytics={analytics} />
						) : null}
					</AnalyticsCard>
				)}

				{/* ---- the dates the snapshot job did not record ---- */}
				{FEATURES.MISSING_DAYS && analytics && <MissingDays analytics={analytics} />}
			</div>

			{FEATURES.COVERAGE &&
				(analytics ? (
					<CoverageNote analytics={analytics} />
				) : (
					<NoteSkeleton lines={2} />
				))}
		</div>
	);
}
