import fennecyLogo from "@/assets/fennecly-logo.webp";

interface LogoLoaderProps {
  fullScreen?: boolean;
  className?: string;
}

/**
 * Branded loading indicator that shows the Fennecly logo with a soft pulse
 * instead of a generic spinner.
 */
export function LogoLoader({ fullScreen = true, className }: LogoLoaderProps) {
  const wrapperClass = fullScreen
    ? "min-h-screen flex items-center justify-center bg-background"
    : "flex items-center justify-center py-10";

  return (
    <div className={`${wrapperClass} ${className ?? ""}`}>
      <img
        src={fennecyLogo}
        alt="Fennecly"
        width={180}
        height={56}
        className="h-14 w-auto object-contain dark:brightness-0 dark:invert animate-pulse"
        decoding="async"
      />
    </div>
  );
}
