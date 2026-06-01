export type SoundName = "click" | "success" | "error" | "whoosh" | "pop" | "chime" | "ring";

let enabled = false;
try {
  enabled = typeof window !== "undefined" && localStorage.getItem("fennecly_sound") !== "off";
} catch {}
let ctx: AudioContext | null = null;

function getCtx() {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function playTone(freq: number, duration: number, type: OscillatorType = "sine", volume = 0.15) {
  const c = getCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime);
  gain.gain.setValueAtTime(volume, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + duration);
}

function playSweep(startFreq: number, endFreq: number, duration: number, volume = 0.08) {
  const c = getCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(startFreq, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(endFreq, c.currentTime + duration);
  gain.gain.setValueAtTime(volume, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + duration);
}

function playMulti(tones: [number, number, number][], volume = 0.12) {
  const c = getCtx();
  tones.forEach(([freq, delay, dur]) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, c.currentTime + delay);
    gain.gain.setValueAtTime(volume, c.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + dur);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(c.currentTime + delay);
    osc.stop(c.currentTime + delay + dur);
  });
}

let ringAudio: HTMLAudioElement | null = null;
function getRingAudio() {
  if (!ringAudio) {
    ringAudio = new Audio("/cash-register.mp3");
    ringAudio.volume = 0.6;
  }
  return ringAudio;
}

const sounds: Record<SoundName, () => void> = {
  click: () => playTone(1200, 0.05, "square", 0.04),
  pop: () => playTone(600, 0.08, "sine", 0.1),
  success: () => playMulti([[523, 0, 0.15], [659, 0.1, 0.15], [784, 0.2, 0.2]], 0.12),
  error: () => playMulti([[200, 0, 0.15], [150, 0.12, 0.2]], 0.1),
  whoosh: () => playSweep(800, 200, 0.25, 0.06),
  chime: () => playMulti([[880, 0, 0.3], [1100, 0.08, 0.3], [1320, 0.16, 0.4]], 0.1),
  ring: () => {
    const a = getRingAudio();
    a.currentTime = 0;
    a.play().catch(() => {});
  },
};

export function playSound(name: SoundName) {
  if (!enabled) return;
  try { sounds[name](); } catch {}
}

export function toggleSound(): boolean {
  enabled = !enabled;
  localStorage.setItem("fennecly_sound", enabled ? "on" : "off");
  return enabled;
}

export function isSoundEnabled(): boolean {
  return enabled;
}
