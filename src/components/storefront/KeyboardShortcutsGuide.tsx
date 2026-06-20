import { useEffect, useState } from "react";
import { X, Keyboard } from "lucide-react";
import { cn } from "@/lib/utils";

const shortcuts = [
  { keys: ["Ctrl", "K"], desc: "Open command palette" },
  { keys: ["?"], desc: "Keyboard shortcuts" },
  { keys: ["Esc"], desc: "Close modal / drawer" },
  { keys: ["←", "→"], desc: "Previous / Next image" },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsGuide({ open, onClose }: Props) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[210] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" />
      <div
        className="relative w-full max-w-sm bg-card rounded-3xl shadow-2xl border border-border/50 p-6 animate-in zoom-in-95 fade-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 h-8 w-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 mb-5">
          <Keyboard className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-bold">Keyboard Shortcuts</h3>
        </div>

        <div className="space-y-3">
          {shortcuts.map((s) => (
            <div key={s.desc} className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{s.desc}</span>
              <div className="flex gap-1">
                {s.keys.map((k) => (
                  <kbd
                    key={k}
                    className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 text-[11px] font-mono font-semibold bg-muted border border-border rounded-lg shadow-sm"
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Hook that listens for `?` key to open shortcuts guide */
export function useKeyboardShortcutsGuide() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "?") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return { open, setOpen };
}
