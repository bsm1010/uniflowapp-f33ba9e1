import Lottie from "lottie-react";
import animationData from "@/assets/orbit.json";

export function LottieStrip() {
  return (
    <div className="w-full overflow-hidden">
      <Lottie
        animationData={animationData}
        loop={true}
        className="w-full"
      />
    </div>
  );
}
