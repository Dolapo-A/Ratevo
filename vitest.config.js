import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

/**
 * Component tests.
 *
 * The frontend had none, and that is how a filter rendered six perfectly styled
 * chips that did nothing when clicked: correct markup, no behaviour, no failure.
 * These tests exist to make an inert control impossible to merge silently.
 */
export default defineConfig({
	plugins: [react()],
	test: {
		environment: "jsdom",
		globals: true,
		setupFiles: ["./src/test/setup.js"],
		include: ["src/**/*.test.{js,jsx}"],
	},
});
