/**
 * Feature flags for progressive release.
 *
 * Ratevo ships analytics a piece at a time, so every analytics surface has to be
 * independently switchable without a code change and without a rebuild of the
 * components that surround it.
 *
 * Set a flag in `.env` or in the Vercel project settings:
 *
 *   VITE_FEATURE_INTELLIGENCE=true
 *   VITE_FEATURE_COMPARE=false
 *
 * An unset flag falls back to the default below. That means the shipped default
 * is recorded in one readable place rather than being implied by a set of `&&`
 * expressions scattered through the components.
 *
 * Ordering note: everything in PHASE_1 is measured data produced by
 * ratevo-analytics. Nothing in that phase makes a claim the engine did not
 * calculate, which is why it can go out ahead of anything conversational.
 */

/** Phase 1 — the analytics foundation. All measured, all deterministic. */
export const PHASE_1 = {
	INTELLIGENCE: true, // range + trend + volatility, and the score beneath them
	ANOMALIES: true, // statistically unusual sessions, when any exist
	COVERAGE: true, // an honest statement about what history does not support
	MISSING_DAYS: true, // the specific dates the snapshot job did not record
};

/**
 * Later phases. Off by default. Each is a component that already exists and is
 * tested; turning it on is a one-line environment change.
 */
export const PHASE_2_PLUS = {
	WHAT_CHANGED: true, // needs two full windows of history, so it self-hides until then
	INSIGHT_PANEL: false, // the measured | interpretation split
	SCORE_METHOD: true, // the "how this is calculated" disclosure
	STRENGTH: false, // basket-relative index, needs a multi-currency endpoint
	COMPARE: false, // side-by-side pair intelligence
	HISTORICAL_VALUE: false, // what a conversion was worth on a past date
};

const env = import.meta.env || {};

function flag(name, fallback) {
	const raw = env[`VITE_FEATURE_${name}`];
	if (raw === undefined || raw === "") return fallback;
	return String(raw).toLowerCase() === "true";
}

export const FEATURES = Object.fromEntries(
	Object.entries({ ...PHASE_1, ...PHASE_2_PLUS }).map(([key, fallback]) => [
		key,
		flag(key, fallback),
	])
);

/** True when at least one analytics surface is on, so we can skip the request. */
export const ANY_ANALYTICS = Object.values(FEATURES).some(Boolean);
