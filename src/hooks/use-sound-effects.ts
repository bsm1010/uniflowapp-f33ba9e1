import { useCallback } from "react";
import { playSound } from "@/lib/sounds";
import type { SoundName } from "@/lib/sounds";

export function useSoundEffects() {
  const sound = useCallback((name: SoundName) => playSound(name), []);
  return { sound };
}
