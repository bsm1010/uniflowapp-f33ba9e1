import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface UndoToastProps {
  message: string;
  duration?: number;
  onUndo: () => void;
  onDismiss: () => void;
}

export function UndoToast({ message, duration = 5000, onUndo, onDismiss }: UndoToastProps) {
  const [remaining, setRemaining] = useState(duration);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const pct = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(pct);
      setRemaining(Math.max(0, duration - elapsed));
      if (elapsed < duration) {
        requestAnimationFrame(tick);
      } else {
        onDismiss();
      }
    };
    const id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [duration, onDismiss]);

  return (
    <div className="flex items-center gap-3 min-w-[320px]">
      <p className="text-sm font-medium flex-1">{message}</p>
      <button
        onClick={() => { onUndo(); onDismiss(); }}
        className="text-sm font-bold text-primary hover:underline shrink-0"
      >
        Undo
      </button>
      <button
        onClick={onDismiss}
        className="text-xs text-muted-foreground hover:text-foreground shrink-0"
      >
        Dismiss
      </button>
      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] overflow-hidden rounded-b-xl">
        <div
          className="h-full bg-primary/40 transition-none"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Shows an undo toast. Call this from any component:
 *   showUndoToast({ message: "Item deleted", duration: 5000, onUndo: () => { ... } })
 */
export function showUndoToast(opts: {
  message: string;
  duration?: number;
  onUndo: () => void;
}) {
  // We'll dynamically import sonner and render our custom content via a wrapper
  // For now, use a simple DOM-based approach
  const id = `undo-${Date.now()}`;
  const container = document.createElement("div");
  container.id = id;
  container.className = "fixed bottom-6 right-6 z-[300] pointer-events-auto";
  document.body.appendChild(container);

  let dismissed = false;

  const dismiss = () => {
    if (dismissed) return;
    dismissed = true;
    container.style.opacity = "0";
    container.style.transform = "translateY(10px)";
    setTimeout(() => container.remove(), 200);
  };

  container.style.cssText =
    "opacity:0;transform:translateY(10px);transition:all 0.2s ease;background:var(--card);border:1px solid var(--border);border-radius:16px;padding:12px 16px;box-shadow:0 20px 40px -10px rgba(0,0,0,0.15);min-width:320px;position:relative;overflow:hidden;";

  const duration = opts.duration ?? 5000;
  const progressDuration = duration;

  container.innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;">
      <p style="font-size:14px;font-weight:500;flex:1;color:var(--foreground);">${opts.message}</p>
      <button id="${id}-undo" style="font-size:14px;font-weight:700;color:var(--primary);cursor:pointer;background:none;border:none;padding:0;">Undo</button>
      <button id="${id}-dismiss" style="font-size:12px;color:var(--muted-foreground);cursor:pointer;background:none;border:none;padding:0;">Dismiss</button>
    </div>
    <div style="position:absolute;bottom:0;left:0;right:0;height:3px;overflow:hidden;">
      <div id="${id}-bar" style="height:100%;background:var(--primary);opacity:0.4;width:100%;transition:none;"></div>
    </div>
  `;

  // Animate in
  requestAnimationFrame(() => {
    container.style.opacity = "1";
    container.style.transform = "translateY(0)";
  });

  // Progress bar
  const bar = document.getElementById(`${id}-bar`);
  if (bar) {
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const pct = Math.max(0, 100 - (elapsed / progressDuration) * 100);
      bar.style.width = `${pct}%`;
      if (elapsed < progressDuration && !dismissed) {
        requestAnimationFrame(tick);
      } else {
        dismiss();
      }
    };
    requestAnimationFrame(tick);
  }

  document.getElementById(`${id}-undo`)?.addEventListener("click", () => {
    opts.onUndo();
    dismiss();
  });

  document.getElementById(`${id}-dismiss`)?.addEventListener("click", dismiss);
}
