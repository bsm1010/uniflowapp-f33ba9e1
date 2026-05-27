import { useEffect, useState } from "react";
import Lottie from "lottie-react";
import successAnimation from "@/assets/success.json";

interface SuccessAnimationProps {
  onComplete: () => void;
}

export function SuccessAnimation({ onComplete }: SuccessAnimationProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onComplete();
    }, 1800);
    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-64 h-64">
        <Lottie animationData={successAnimation} loop={false} autoplay />
      </div>
    </div>
  );
}
