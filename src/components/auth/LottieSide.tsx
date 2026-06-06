import Lottie from "lottie-react";
import lottieData from "@/assets/Scene_clean.json";

export function LottieSide() {
  return (
    <div className="hidden lg:flex items-center justify-center w-1/2 min-h-screen relative overflow-hidden bg-background">
      <div className="absolute inset-0 flex items-center" style={{ left: "-8%" }}>
        <Lottie
          animationData={lottieData}
          loop
          autoplay
          style={{ width: "116%", height: "100%" }}
        />
      </div>
    </div>
  );
}
