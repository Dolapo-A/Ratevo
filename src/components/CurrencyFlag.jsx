import { currencyFlag } from "../currencyFlag";

/**
 * The flag for a currency code.
 *
 * Written as its own component because the same `<img>` with the same error
 * handler was about to be pasted into a third and fourth place, and the fourth
 * would be the one that broke: the analytics card has no visible chrome to fall
 * back on, so a failed load there shows a broken-image glyph rather than a
 * placeholder that looks deliberate.
 *
 * The sizing is smaller than the converter's `w-7 h-5` on purpose. These sit
 * inline before a three-letter code inside a dense column, and a 28px flag beside
 * 12px text reads as an icon for the column rather than a property of the
 * currency.
 *
 * The fallback is a neutral tile rather than a second image request. `/flags/default-flag.png`
 * is referenced by the converter and does not exist on disk, so anything that
 * relied on it was making a request that 404s and swapping in another 404. That
 * is why this renders a styled element instead — one less round trip, and nothing
 * to fail.
 */
export default function CurrencyFlag({ code, className = "w-4 h-3" }) {
	const region = currencyFlag[code];
	const initials = code ? code.slice(0, 1) : "?";

	// `hidden` rather than a broken image. A flag is a decorative convenience —
	// the three-letter code beside it is the actual identifier — so when there is
	// no flag to show, the honest result is its absence, not a placeholder that
	// implies one exists.
	if (!region) {
		return (
			<span
				aria-hidden="true"
				data-flag="none"
				title={code ? `No flag published for ${code}` : "No currency selected"}
				className={`${className} flex shrink-0 items-center justify-center rounded-[2px] border border-slate-200 bg-slate-100 text-[7px] font-bold leading-none text-slate-400`}
			>
				{initials}
			</span>
		);
	}

	return (
		<img
			src={`/flags/${region.toLowerCase()}.png`}
			alt=""
			aria-hidden="true"
			data-flag={region.toLowerCase()}
			className={`${className} shrink-0 rounded-[2px] border border-slate-200 object-cover`}
		/>
	);
}