import { useEffect, useRef, useState } from "react";

/**
 * Animates a number from 0 (or previous value) up to `target` over `duration` ms.
 * Optional `delay` (ms) defers the start of the animation.
 */
export function useCountUp(target: number, duration = 1200, delay = 0): number {
  const [value, setValue] = useState(0);
  const fromRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const from = fromRef.current;
    const to = Number.isFinite(target) ? target : 0;
    let startTs: number | null = null;
    let timeoutId: number | undefined;

    const step = (ts: number) => {
      if (startTs === null) startTs = ts;
      const elapsed = ts - startTs;
      const progress = Math.min(1, elapsed / duration);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = from + (to - from) * eased;
      setValue(to >= 1 ? Math.round(current) : current);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        fromRef.current = to;
      }
    };

    timeoutId = window.setTimeout(() => {
      rafRef.current = requestAnimationFrame(step);
    }, Math.max(0, delay));

    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration, delay]);

  return value;
}

export default useCountUp;
