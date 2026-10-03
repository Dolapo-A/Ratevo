import { useEffect, useState } from "react";
import { formatDate, spansYearBoundary } from "../../services/dateFormat";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";

/**
 * The low and the high, each with the day it happened.
 *
 * The range figure alone is half an answer. "1,321.23 – 1,335.69" tells you how
 * far the pair moved; it does not tell you whether the low was last Tuesday or
 * three weeks ago, and those are very different situations for someone deciding
 * what a rate means. Both figures come from the engine — this component only
 * decides how they are arranged.
 *
 * Colour is never the only signal. Each end carries a word as well as a hue,
 * because a blue-to-green pair is exactly the kind of distinction that collapses
 * for a red-green colourblind reader, and the ends differ in position as well as
 * colour so the layout still reads with no colour perception at all.
 */

/** The dot at each end of the track. Size, not just hue, so they differ without colour. */
function ExtremeDot({ tone, className = "" }) {
	return (
		<span
			aria-hidden="true"
			className={`block h-1.5 w-1.5 shrink-0 rounded-full ring-2 ring-white ${className}`}
			data-tone={tone}
		/>
	);
}

function Extreme({ label, date, tone, align }) {
	return (
		<div
			className={`flex min-w-0 items-center gap-1.5 ${align === "right" ? "justify-end text-right" : ""}`}
		>
			{align === "right" && <ExtremeDot tone={tone} />}
			<span className="min-w-0 truncate text-[11px] leading-tight text-slate-500">
				<span className="font-semibold text-slate-700">{label}</span>
				<span className="whitespace-nowrap"> {formatDate(date)}</span>
			</span>
			{align !== "right" && <ExtremeDot tone={tone} />}
		</div>
	);
}

export default function RangeExtremes({ range }) {
	const reducedMotion = usePrefersReducedMotion();
	const lowDate = range?.lowDate ?? null;
	const highDate = range?.highDate ?? null;

	// A window that never moved has no low day and no high day, so there is
	// nothing to place on the track. The engine sends null rather than a
	// substituted date for exactly this reason, and printing the em dash is
	// honouring that rather than papering over it.
	const hasExtremes = Boolean(range && lowDate && highDate);

	const [shown, setShown] = useState(reducedMotion);
	useEffect(() => {
		if (reducedMotion) {
			setShown(true);
			return undefined;
		}
		// One frame behind the track's own reveal, so the dates arrive after the
		// bar they annotate rather than alongside it.
		const frame = requestAnimationFrame(() => setShown(true));
		return () => cancelAnimationFrame(frame);
	}, [reducedMotion, lowDate, highDate]);

	if (!hasExtremes) return null;

	const boundary = spansYearBoundary(lowDate, highDate);

	return (
		<div
			className="mt-1.5 flex items-baseline justify-between gap-2 transition-opacity duration-300"
			data-shown={shown ? "yes" : "no"}
			style={{
				opacity: shown || reducedMotion ? 1 : 0,
				transition: reducedMotion ? undefined : "opacity 300ms ease-out",
			}}
		>
			<Extreme label="Low" date={lowDate} tone="low" align="left" />
			<Extreme label="High" date={highDate} tone="high" align="right" />
			{boundary && (
				<span className="sr-only">
					This range spans more than one calendar year.
				</span>
			)}
		</div>
	);
}