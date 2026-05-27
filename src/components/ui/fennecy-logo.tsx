import fennecyLogo from "@/assets/fennecly-logo.webp";
import { cn } from "@/lib/utils";

/**
 * Renders the Fennecly wordmark as a CSS-masked div so it can be tinted
 * to follow the theme: purple (primary) in light mode, white in dark mode.
 */
export function FennecyLogo({
  className,
  ariaLabel = "Fennecly",
}: {
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <div
      role="img"
      aria-label={ariaLabel}
      className={cn("bg-primary dark:bg-white", className)}
      style={{
        WebkitMaskImage: `url(${fennecyLogo})`,
        maskImage: `url(${fennecyLogo})`,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        WebkitMaskSize: "contain",
        maskSize: "contain",
      }}
    />
  );
}
