import { useEffect, useRef } from "react";

interface ConfettiPiece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
  life: number;
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"];

export function Confetti({ active, onDone }: { active: boolean; onDone?: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const pieces: ConfettiPiece[] = [];
    const count = 80;

    for (let i = 0; i < count; i++) {
      pieces.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 200,
        y: canvas.height / 2 - 50,
        vx: (Math.random() - 0.5) * 12,
        vy: Math.random() * -14 - 4,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: Math.random() * 8 + 4,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 12,
        life: 1,
      });
    }

    let frame = 0;
    let raf: number;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;

      for (const p of pieces) {
        if (p.life <= 0) continue;
        alive = true;

        p.x += p.vx;
        p.vy += 0.3; // gravity
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.life -= 0.008;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      }

      if (alive && frame < 180) {
        frame++;
        raf = requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        onDone?.();
      }
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [active, onDone]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[999] pointer-events-none"
      style={{ width: "100vw", height: "100vh" }}
    />
  );
}

/** Call this to trigger confetti globally */
let _onDone: (() => void) | undefined;
let _active = false;

export function triggerConfetti(onDone?: () => void) {
  _active = true;
  _onDone = onDone;

  // Create a temporary container
  const container = document.createElement("div");
  container.id = "confetti-root";
  document.body.appendChild(container);

  // We'll render via a simple approach: just animate with canvas directly
  const canvas = document.createElement("canvas");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.cssText =
    "position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:999;pointer-events:none;";
  container.appendChild(canvas);

  const ctx = canvas.getContext("2d")!;
  const pieces: ConfettiPiece[] = [];
  const count = 100;

  for (let i = 0; i < count; i++) {
    pieces.push({
      x: canvas.width / 2 + (Math.random() - 0.5) * 300,
      y: canvas.height * 0.4,
      vx: (Math.random() - 0.5) * 16,
      vy: Math.random() * -16 - 6,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: Math.random() * 10 + 4,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 14,
      life: 1,
    });
  }

  let frame = 0;

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;

    for (const p of pieces) {
      if (p.life <= 0) continue;
      alive = true;
      p.x += p.vx;
      p.vy += 0.35;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;
      p.life -= 0.007;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    }

    if (alive && frame < 200) {
      frame++;
      requestAnimationFrame(draw);
    } else {
      container.remove();
      onDone?.();
    }
  };

  requestAnimationFrame(draw);
}
