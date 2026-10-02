/**
 * The period vocabulary — the single place it is defined.
 *
 * The chart's filter and the analytics window used to be two independent
 * controls, so picking "90D" on the chart still left you to find and click
 * "90D" again in the performance strip. Two vocabularies for one idea is also
 * the kind of inconsistency that quietly erodes trust in every other number on
 * the page. So the filter is the control and the analytics follows it.
 *
 *   label          what the user sees
 *   historyDays    window sent to /api/history — its own convention, days back
 *   analyticsDays  window sent to /api/analytics — calendar days between
 *                  published snapshots
 *
 * They differ by one because /api/history selects `date >= today - n` and so
 * returns n+1 points, while an analytics window of n days needs n+1 points too.
 * "7D" therefore means 7 points of history and a 7-day analytics window; both
 * cover the same span on screen.
 *
 * These are the windows the engine publishes (see WINDOWS in the API's
 * lib/analytics.js). Nothing outside that set can be requested, so nothing
 * outside it belongs in this list — a filter option with no window behind it is
 * a control that cannot do what it says.
 */
export const PERIODS = [
	// 24H asks the chart for 2 snapshots — today's and the previous one. Zero days
	// back is not available: /api/history rejects a window under one day, and
	// asking for it returned a blank chart with no error, which is the worst
	// possible failure for a control.
	{ label: "24H", historyDays: 1, analyticsDays: 1, short: "24H" },
	{ label: "7D", historyDays: 6, analyticsDays: 7, short: "7D" },
	{ label: "30D", historyDays: 30, analyticsDays: 30, short: "30D" },
	{ label: "90D", historyDays: 90, analyticsDays: 90, short: "90D" },
	{ label: "6M", historyDays: 180, analyticsDays: 180, short: "6M" },
	{ label: "1Y", historyDays: 365, analyticsDays: 365, short: "1Y" },
];

export const DEFAULT_PERIOD = PERIODS[2]; // 30D

export function getPeriod(historyDays) {
	return PERIODS.find((p) => p.historyDays === historyDays) || DEFAULT_PERIOD;
}
