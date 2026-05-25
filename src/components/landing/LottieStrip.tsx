import Lottie from "lottie-react";
import { useState, useEffect, useRef } from "react";

export function LottieStrip() {
  const [animationData, setAnimationData] = useState<object | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          import("@/assets/orbit.json").then((data) => {
            setAnimationData(data.default);
          });
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="w-full overflow-hidden">
      {animationData && (
        <Lottie
          animationData={animationData}
          loop={true}
          className="w-full"
          rendererSettings={{ preserveAspectRatio: "xMidYMid slice" }}
        />
      )}
    </div>
  );
}
