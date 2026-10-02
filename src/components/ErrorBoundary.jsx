import { Component } from "react";

/**
 * Contains a render failure to the branch it happened in.
 *
 * React unmounts the entire tree when a component throws during render. That
 * turns any stray `null.toFixed()` into a blank page and loses the converter,
 * the navigation and everything else the user was doing.
 *
 * This is not a substitute for fixing the underlying error — it is what stops
 * one unhandled value from taking the whole product down with it.
 */
export default class ErrorBoundary extends Component {
	constructor(props) {
		super(props);
		this.state = { error: null };
	}

	static getDerivedStateFromError(error) {
		return { error };
	}

	componentDidCatch(error, info) {
		 
		console.error("Caught in ErrorBoundary:", error, info?.componentStack);
	}

	render() {
		if (!this.state.error) return this.props.children;

		return (
			<div className="m-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
				<p className="font-semibold">Something went wrong loading this section.</p>
				<p className="mt-1 text-red-700/80">{this.props.label || "Please try again."}</p>
				<button
					type="button"
					onClick={() => this.setState({ error: null })}
					className="pressable mt-2 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 active:bg-red-200"
				>
					Try again
				</button>
			</div>
		);
	}
}
