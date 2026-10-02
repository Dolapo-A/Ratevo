import { useState, useEffect, useRef, useCallback } from "react";
import { currencyFlag } from "/src/currencyFlag";

/**
 * The currency picker.
 *
 * Rebuilt around three things the previous version did not have, all of which
 * are the difference between a dialog you can operate and one you can only
 * operate with a mouse:
 *
 *   1. **It can be left.** Escape closes it, the scrim closes it, and focus
 *      returns to the button that opened it. Previously the only exits were the
 *      12-pixel close glyph and clicking the scrim, so a keyboard user could
 *      open the picker and have no way out.
 *
 *   2. **Focus is contained while it is open.** Tab cycles inside the dialog
 *      rather than walking into the page behind it, which is still visible
 *      through the translucent surface and still focusable underneath.
 *
 *   3. **It acknowledges being touched.** Rows and the close button press
 *      immediately, and the surface fades and scales in from the trigger rather
 *      than appearing at full size instantly.
 *
 * The search field is untouched behaviourally — filtering is unchanged.
 */

const FOCUSABLE =
	'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function CurrencyModal({
	isOpen,
	onClose,
	onSelect,
	currencies,
	selectedCurrency,
	/**
	 * The control that opened this dialog, so focus can be handed back to it.
	 *
	 * Passing this explicitly rather than recording `document.activeElement` is
	 * deliberate. A mouse user never focuses the button they clicked — Chrome
	 * only focuses on keyboard activation — so capturing whatever happened to be
	 * focused reliably records `<body>`, and restoring focus to `<body>` is the
	 * same as not restoring it at all. The user closes the dialog and is dropped
	 * at the top of the page with no idea where they were.
	 */
	returnFocusTo,
}) {
	const [searchTerm, setSearchTerm] = useState("");
	const [filteredCurrencies, setFilteredCurrencies] = useState([]);

	const panelRef = useRef(null);
	const searchRef = useRef(null);

	const toOptions = useCallback(
		() =>
			Object.entries(currencies || {}).map(([code, data]) => ({
				code,
				name: data.name,
			})),
		[currencies]
	);

	// Initialize filteredCurrencies when currencies prop changes
	useEffect(() => {
		if (currencies) {
			setFilteredCurrencies(toOptions());
		}
	}, [currencies, toOptions]);

	function handleSearch(e) {
		const term = e.target.value.toLowerCase();
		setSearchTerm(e.target.value);

		if (!currencies) return;

		setFilteredCurrencies(
			toOptions().filter(
				(currency) =>
					currency.code.toLowerCase().includes(term) ||
					currency.name.toLowerCase().includes(term)
			)
		);
	}

	const handleSelect = (currency) => {
		onSelect(currency);
		setSearchTerm("");
		setFilteredCurrencies(toOptions());
		onClose();
	};

	// ---- dialog behaviour ------------------------------------------------

	// Remember what had focus, and hand it back on close. Without this, focus
	// falls to the top of the document and the user loses their place entirely.
	useEffect(() => {
		if (!isOpen) return;

		// The trigger, captured while it is certainly still mounted.
		const trigger = returnFocusTo?.current ?? null;

		// Fall back to whatever genuinely had focus. Never <body>: focusing it is a
		// no-op, so "restore to body" silently discards the user's place — which is
		// exactly what a mouse user would otherwise get, since clicking a button
		// does not focus it.
		const fallback =
			document.activeElement && document.activeElement !== document.body
				? document.activeElement
				: null;

		return () => {
			const target = trigger ?? fallback;
			// `isConnected` guards the one case the capture above cannot cover: the
			// target-currency trigger is replaced by a loading skeleton while its
			// quote is in flight, so the node captured on open is gone by the time it
			// is needed. Focus then lands on <body>, which is the previous behaviour
			// rather than a regression.
			if (target && typeof target.focus === "function" && target.isConnected) {
				target.focus();
			}
		};
	}, [isOpen, returnFocusTo]);

	// Escape to dismiss, Tab contained. Bound on the document rather than the
	// panel so it works no matter where focus has ended up inside.
	useEffect(() => {
		if (!isOpen) return;

		function onKeyDown(e) {
			if (e.key === "Escape") {
				e.preventDefault();
				onClose();
				return;
			}

			if (e.key !== "Tab") return;

			const panel = panelRef.current;
			if (!panel) return;

			const items = [...panel.querySelectorAll(FOCUSABLE)].filter(
				(el) => el.offsetParent !== null
			);
			if (items.length === 0) return;

			const first = items[0];
			const last = items[items.length - 1];
			const active = document.activeElement;

			// Wrap at both ends, so Tab never escapes the dialog.
			if (e.shiftKey && (active === first || !panel.contains(active))) {
				e.preventDefault();
				last.focus();
			} else if (!e.shiftKey && active === last) {
				e.preventDefault();
				first.focus();
			}
		}

		document.addEventListener("keydown", onKeyDown);
		return () => document.removeEventListener("keydown", onKeyDown);
	}, [isOpen, onClose]);

	// Lock the page behind the sheet, compensating for the scrollbar so the
	// content does not jump sideways as it disappears.
	useEffect(() => {
		if (!isOpen) return;
		const { body } = document;
		const previousOverflow = body.style.overflow;
		const previousPadding = body.style.paddingRight;
		const gap = window.innerWidth - document.documentElement.clientWidth;

		body.style.overflow = "hidden";
		if (gap > 0) body.style.paddingRight = `${gap}px`;

		return () => {
			body.style.overflow = previousOverflow;
			body.style.paddingRight = previousPadding;
		};
	}, [isOpen]);

	if (!isOpen) return null;

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 motion-safe:animate-[fadeIn_180ms_ease-out]"
			onClick={onClose}
			role="presentation"
		>
			<div
				ref={panelRef}
				role="dialog"
				aria-modal="true"
				aria-labelledby="currency-modal-title"
				onClick={(e) => e.stopPropagation()}
				className="sheet-surface flex w-[90%] max-w-md max-h-[70vh] flex-col overflow-hidden rounded-2xl motion-safe:animate-[sheetIn_240ms_cubic-bezier(0.2,0,0.2,1)]"
			>
				<div className="sticky top-0 z-10 px-4 py-3">
					<div className="mb-3 flex items-center justify-between">
						<h2
							id="currency-modal-title"
							className="text-lg font-semibold tracking-tight"
						>
							Select Currency
						</h2>
						<button
							type="button"
							onClick={onClose}
							aria-label="Close currency picker"
							className="pressable -mr-2 flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 active:bg-gray-200"
						>
							<svg
								viewBox="0 0 20 20"
								fill="none"
								stroke="currentColor"
								strokeWidth="1.75"
								strokeLinecap="round"
								className="h-5 w-5"
								aria-hidden="true"
							>
								<path d="M5 5l10 10M15 5L5 15" />
							</svg>
						</button>
					</div>

					<div className="mb-3">
						<label htmlFor="currency-search" className="sr-only">
							Search currencies
						</label>
						<input
							id="currency-search"
							ref={searchRef}
							autoFocus
							type="search"
							placeholder="Search currencies..."
							className="w-full rounded-lg border border-gray-200 bg-white/70 px-3 py-2 text-sm placeholder:text-gray-400 focus-ring focus:outline-none"
							value={searchTerm}
							onChange={handleSearch}
						/>
					</div>
				</div>

				<div className="scrollbar-thin scrollbar-track-transparent overflow-y-auto scrollbar-thumb-gray-300">
					<div className="px-4 pb-4">
						{filteredCurrencies.length === 0 ? (
							<p className="px-1 py-6 text-center text-sm text-gray-500">
								No currency matches “{searchTerm}”.
							</p>
						) : (
							<ul className="grid gap-1" role="listbox" aria-label="Currencies">
								{filteredCurrencies.map((currency) => (
									<li key={currency.code}>
										<button
											type="button"
											role="option"
											aria-selected={selectedCurrency === currency.code}
											onClick={() => handleSelect(currency.code)}
											className={`pressable-soft flex w-full items-center gap-3 rounded-lg p-3 text-left hover:bg-gray-50 active:bg-gray-100 ${
												selectedCurrency === currency.code
													? "bg-gray-100 ring-1 ring-inset ring-gray-300"
													: ""
											}`}
										>
											<img
												src={`/flags/${currencyFlag[
													currency.code
												]?.toLowerCase()}.png`}
												alt=""
												aria-hidden="true"
												className="h-5 w-7 rounded border border-gray-300 object-cover shadow-sm"
												onError={(e) => {
													e.target.src = "/flags/default-flag.png";
													e.target.onerror = null;
												}}
											/>
											<span className="flex flex-col items-start">
												<span className="font-medium">{currency.code}</span>
												<span className="text-sm text-gray-500">
													{currency.name || currency.code}
												</span>
											</span>
										</button>
									</li>
								))}
							</ul>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

export default CurrencyModal;