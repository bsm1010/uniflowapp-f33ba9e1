import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

/** Standard section wrapper with semantic spacing & entrance animation. */
export function Section({
  children,
  className,
  fullBleed,
  ...rest
}: HTMLMotionProps<"section"> & { fullBleed?: boolean }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn("w-full py-12 md:py-16", className)}
      {...rest}
    >
      <div className={cn(fullBleed ? "" : "mx-auto w-full max-w-7xl px-4 md:px-6")}>
        {children}
      </div>
    </motion.section>
  );
}

/** Heading + optional eyebrow + subheading. */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
}) {
  return (
    <div
      className={cn(
        "mb-10 max-w-2xl",
        align === "center" ? "mx-auto text-center" : "text-left",
      )}
    >
      {eyebrow ? (
        <span className="mb-3 inline-block rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {eyebrow}
        </span>
      ) : null}
      <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">{title}</h2>
      {subtitle ? <p className="mt-3 text-base text-muted-foreground">{subtitle}</p> : null}
    </div>
  );
}

/** Safe image with fallback to gradient placeholder. */
export function BlockImage({
  src,
  alt,
  className,
  aspect = "video",
}: {
  src?: string;
  alt: string;
  className?: string;
  aspect?: "square" | "video" | "portrait" | "wide";
}) {
  const aspectClass = {
    square: "aspect-square",
    video: "aspect-video",
    portrait: "aspect-[3/4]",
    wide: "aspect-[21/9]",
  }[aspect];

  if (!src) {
    return (
      <div
        className={cn(
          aspectClass,
          "w-full rounded-lg bg-gradient-to-br from-muted via-muted/60 to-accent/30",
          className,
        )}
        aria-label={alt}
      />
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={cn(aspectClass, "w-full rounded-lg object-cover", className)}
    />
  );
}
