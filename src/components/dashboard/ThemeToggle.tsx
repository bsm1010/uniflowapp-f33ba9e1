import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

// Inject transition styles once into <html> so every
// element smoothly cross-fades when the theme changes.
function injectTransition() {
  const id = "theme-transition-style";
  if (document.getElementById(id)) return;
  const style = document.createElement("style");
  style.id = id;
  style.textContent = `
    *, *::before, *::after {
      transition:
        background-color 150ms ease,
        border-color 150ms ease,
        color 150ms ease,
        fill 150ms ease,
        stroke 150ms ease,
        box-shadow 150ms ease !important;
    }
  `;
  document.head.appendChild(style);
}

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const dark = stored === "dark" ||
      (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setIsDark(dark);
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  const toggle = () => {
    const next = !isDark;

    // 1. Inject transition CSS so the swap looks smooth
    injectTransition();

    // 2. Apply theme instantly
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");

    // 3. Remove transition styles after animation completes
    //    so they don't interfere with other UI interactions
    setTimeout(() => {
      const style = document.getElementById("theme-transition-style");
      style?.remove();
    }, 200);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="h-9 w-9"
    >
      <Sun
        className="h-4 w-4 transition-all duration-200"
        style={{
          opacity: isDark ? 1 : 0,
          transform: isDark ? "rotate(0deg) scale(1)" : "rotate(90deg) scale(0.5)",
          position: isDark ? "relative" : "absolute",
        }}
      />
      <Moon
        className="h-4 w-4 transition-all duration-200"
        style={{
          opacity: isDark ? 0 : 1,
          transform: isDark ? "rotate(-90deg) scale(0.5)" : "rotate(0deg) scale(1)",
          position: isDark ? "absolute" : "relative",
        }}
      />
    </Button>
  );
}
