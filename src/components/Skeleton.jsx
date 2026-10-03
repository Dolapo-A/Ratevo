/**
 * Loading skeletons.
 *
 * One primitive, and per-region compositions that match the shape of what they
 * stand in for. A skeleton that does not occupy the space its content will
 * causes the page to jump when the data lands — which is worse than the wait it
 * was meant to cover.
 *
 * Each region is wired to its own request, so a slow quote does not hold up the
 * chart and a slow chart does not hold up the intelligence card.
 *
 * Everything here is `aria-hidden` with the busy state on the region itself: the
 * shapes carry no information a screen reader should read aloud, and announcing
 * "loading" four times over would be noise.
 */

/** A placeholder block. `w`/`h` accept any Tailwind size class. */
export function SkeletonBlock({ className = "", rounded = "rounded-md", line = false }) {
	return (
		<div
			aria-hidden="true"
			className={`${line ? "skeleton-line" : "skeleton"} ${rounded} ${className}`}
		/>
	);
}

/**
 * Marks a region as busy without changing its layout.
 *
 * Kept separate from the skeleton shapes so the two decisions are independent:
 * a region can be busy with no skeleton in it, and a skeleton can be rendered
 * inside a region that is no longer busy.
 */
export function LoadingRegion({ isLoading, label, children, className = "" }) {
	return (
		<div
			aria-busy={isLoading || undefined}
			aria-label={isLoading ? `${label}, loading` : undefined}
			className={className}
		>
			{children}
		</div>
	);
}

/* -------------------------------------------------------------------------- *
 * Per-region compositions
 * -------------------------------------------------------------------------- */

/** The currency chips inside the converter's input rows. */
export function CurrencyChipSkeleton() {
	return (
		<SkeletonBlock className="h-9 w-[104px]" rounded="rounded-full" />
	);
}

/**
 * A figure standing in for the converted amount.
 *
 * Sized by the same type scale the real figure uses, so the row does not change
 * height when the number arrives. Never shows "0.00" — a zero reads as a real
 * result, and the whole product refuses to present a number it has not measured.
 */
export function AmountSkeleton({ widthClass = "w-40" }) {
	return <SkeletonBlock className={`h-7 ${widthClass}`} rounded="rounded-md" />;
}

/** A short inline value, for the exchange-rate row. */
export function InlineValueSkeleton({ widthClass = "w-24" }) {
	return <SkeletonBlock className={`h-3.5 ${widthClass}`} rounded="rounded" />;
}

/**
 * The intelligence card: three measurement columns over a score row.
 *
 * Mirrors `IntelligenceCard` section for section so the card's height is already
 * correct when the figures land.
 */
export function IntelligenceCardSkeleton() {
	return (
		<div
			aria-hidden="true"
			className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card"
		>
			<div className="grid sm:grid-cols-3">
				{[0, 1, 2].map((col) => (
					<div
						key={col}
						className="space-y-2.5 border-slate-200 px-5 py-4 sm:border-r sm:last:border-r-0"
					>
						<SkeletonBlock className="h-2.5 w-16" rounded="rounded" />
						<SkeletonBlock className="h-5 w-28" rounded="rounded-md" />
						<SkeletonBlock className="h-3 w-24" rounded="rounded" />
						{/* The range column also carries a position bar. */}
						{col === 0 && (
							<SkeletonBlock className="h-1 w-full" rounded="rounded-full" />
						)}
					</div>
				))}
			</div>

			<div className="flex items-center gap-4 border-t border-slate-200 px-5 py-4">
				<SkeletonBlock className="h-7 w-10" rounded="rounded-md" />
				<div className="flex-1 space-y-2">
					<SkeletonBlock className="h-3.5 w-44" rounded="rounded" />
					<SkeletonBlock className="h-3 w-36" rounded="rounded" />
				</div>
			</div>
		</div>
	);
}

/** The "What changed?" card: headline, two bars, sentence, context. */
export function WhatChangedSkeleton() {
	return (
		<div aria-hidden="true" className="space-y-3">
			<SkeletonBlock className="h-2.5 w-28" rounded="rounded" />
			<SkeletonBlock className="h-4 w-40" rounded="rounded-md" />

			<div className="space-y-2 pt-1">
				{[0, 1].map((row) => (
					<div key={row} className="grid grid-cols-[72px_1fr_58px] items-center gap-3">
						<SkeletonBlock className="h-3 w-16" rounded="rounded" />
						<SkeletonBlock className="h-5 w-full" rounded="rounded-md" />
						<SkeletonBlock className="h-3 w-10" rounded="rounded" />
					</div>
				))}
			</div>

			<div className="space-y-2 border-l-2 border-slate-100 pl-3 pt-1">
				<SkeletonBlock className="h-3 w-full" rounded="rounded" />
				<SkeletonBlock className="h-3 w-11/12" rounded="rounded" />
			</div>
		</div>
	);
}

/** The small disclosures below the panel: coverage and missing dates. */
export function NoteSkeleton({ lines = 1 }) {
	return (
		<div aria-hidden="true" className="space-y-2">
			{Array.from({ length: lines }).map((_, i) => (
				<SkeletonBlock
					key={i}
					className={`h-2.5 ${i === lines - 1 ? "w-2/5" : "w-full"}`}
					rounded="rounded"
				/>
			))}
		</div>
	);
}