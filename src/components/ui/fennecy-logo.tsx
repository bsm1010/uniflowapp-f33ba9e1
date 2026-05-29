import fennecyLogo from "@/assets/fennecly-logo-original.png";
import { cn } from "@/lib/utils";

/**
 * Renders the original Fennecly logo as an <img>, unmodified.
 */
export function FennecyLogo({
  className,
  ariaLabel = "Fennecly",
}: {
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <img
      src={fennecyLogo}
      alt={ariaLabel}
      className={cn("object-contain", className)}
    />
  );
}
