import { useEffect, useState } from "react";

const STORAGE_KEY = "fennecly:login-popup-seen";

export function LoginPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY)) return;
    } catch {
      return;
    }
    const timer = setTimeout(() => setOpen(true), 600);
    return () => clearTimeout(timer);
  }, []);

  const close = () => {
    setOpen(false);
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {}
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={close}
    >
      <div
        className="relative max-w-lg w-full animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={close}
          className="absolute -top-3 -right-3 z-10 h-8 w-8 rounded-full bg-background border border-border shadow-md flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          ✕
        </button>
        <img
          src="/pic.png"
          alt="Welcome"
          className="w-full rounded-xl shadow-lg"
        />
      </div>
    </div>
  );
}
