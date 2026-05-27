import { FennecyLogo } from "@/components/ui/fennecy-logo";

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
      <FennecyLogo className="h-14 w-[180px] animate-pulse" />
    </div>
  );
}
