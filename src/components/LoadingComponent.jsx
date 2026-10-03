import Lottie from "lottie-react";
// import graphLoader from '../assets/lotties/Financial_Graph_Loader.json'
import loading from "../assets/lotties/loading.json";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";

/**
 * The loading animation for the rate history region.
 *
 * The reduced-motion case is the reason this is not simply `autoplay` in JSX. The
 * global stylesheet stops CSS animations, but a Lottie renders as SVG with its own
 * timeline, so that block never reaches it — the animation would keep playing for
 * someone who asked for less motion, which is the opposite of what the preference
 * is asking for.
 *
 * A frozen Lottie is also worse than a static placeholder: a moving graphic that
 * has stopped reads as a graphic that has broken. So the first frame is rendered
 * once and left there, which still reads as "loading".
 */
function LoadingComponent() {
	const reducedMotion = usePrefersReducedMotion();

	return (
		<Lottie
			animationData={loading}
			loop={!reducedMotion}
			autoplay={!reducedMotion}
			className="w-80 h-80 mx-auto"
			style={{ maxWidth: "100%", maxHeight: "100%" }}
			rendererSettings={{
				preserveAspectRatio: "xMidYMid slice",
			}}
		/>
	);
}

export default LoadingComponent;