import Lottie, { type LottieRefCurrentProps } from "lottie-react";
import { useState, useEffect, useRef } from "react";

export function PhoneLottie() {
  const [animationData, setAnimationData] = useState<object | null>(null);
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const lottieRef = useRef<LottieRefCurrentProps>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const inView = entries[0].isIntersecting;
        setVisible(inView);
        if (inView && !animationData) {
          import("@/assets/phone.json").then((data) => {
            setAnimationData(data.default);
          });
        }
      },
      { rootMargin: "200px", threshold: 0.01 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [animationData]);

  useEffect(() => {
    if (!lottieRef.current) return;
    if (visible) lottieRef.current.play();
    else lottieRef.current.pause();
  }, [visible, animationData]);

  return (
    <div ref={ref} className="w-full overflow-hidden contain-paint" style={{ minHeight: 200 }}>
      {animationData && (
        <Lottie
          lottieRef={lottieRef}
          animationData={animationData}
          loop
          autoplay={false}
          className="w-full max-w-lg mx-auto"
          rendererSettings={{
            preserveAspectRatio: "xMidYMid slice",
            progressiveLoad: true,
          }}
        />
      )}
    </div>
  );
}
