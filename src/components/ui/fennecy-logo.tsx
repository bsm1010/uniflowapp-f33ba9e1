import fennecyLogo from "@/assets/fennecly-logo-original.png";
import { cn } from "@/lib/utils";

/**
 * Renders the Fennecly wordmark as a CSS-masked div so it can be tinted
 * to follow the theme. Purple (primary) in both light and dark modes;
 * special parent classes (e.g. `sidebar-purple:bg-white`) can override.
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
      className={cn("bg-primary", className)}
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
