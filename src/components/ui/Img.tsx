import { useState } from "react";
import { cn } from "@/lib/utils";
import { optimizeImageUrl } from "@/lib/images/optimize";

interface ImgProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src" | "alt"> {
  src: string | null | undefined;
  alt: string;
  width?: number;
  height?: number;
  quality?: number;
}

export function Img({ src, alt, className, width, height, quality = 80, ...rest }: ImgProps) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const optimized = optimizeImageUrl(src, { width, height, quality });

  if (!optimized || errored) {
    return (
      <div
        className={cn("bg-gradient-to-br from-muted to-muted/50", className)}
        aria-hidden
      />
    );
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {!loaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted/50 animate-pulse" />
      )}
      <img
        src={optimized}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setErrored(true)}
        className={cn("transition-opacity duration-300 w-full h-full object-cover", loaded ? "opacity-100" : "opacity-0")}
        {...rest}
      />
    </div>
  );
}
