import "@testing-library/jest-dom/vitest";

// jsdom has no matchMedia, and the analytics surfaces branch on the reduced
// motion and reduced transparency preferences.
if (!window.matchMedia) {
	window.matchMedia = (query) => ({
		matches: false,
		media: query,
		onchange: null,
		addEventListener() {},
		removeEventListener() {},
		addListener() {},
		removeListener() {},
		dispatchEvent: () => false,
	});
}
