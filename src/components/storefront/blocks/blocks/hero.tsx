import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Section, BlockImage } from "../shared";
import type { BlockComponentProps } from "../types";

/* ---------- HeroSplit ---------- */
export interface HeroSplitProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  ctaLabel: string;
  ctaHref: string;
  imageUrl?: string;
}
export function HeroSplit({ props }: BlockComponentProps<HeroSplitProps>) {
  return (
    <Section className="py-16 md:py-24">
      <div className="grid items-center gap-10 md:grid-cols-2">
        <div>
          {props.eyebrow ? (
            <span className="mb-4 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
              {props.eyebrow}
            </span>
          ) : null}
          <h1 className="font-display text-4xl font-bold tracking-tight md:text-6xl">
            {props.title}
          </h1>
          {props.subtitle ? (
            <p className="mt-4 max-w-xl text-lg text-muted-foreground">{props.subtitle}</p>
          ) : null}
          <Button asChild size="lg" className="mt-8">
            <a href={props.ctaHref}>{props.ctaLabel}</a>
          </Button>
        </div>
        <BlockImage src={props.imageUrl} alt={props.title} aspect="square" />
      </div>
    </Section>
  );
}

/* ---------- HeroCentered ---------- */
export interface HeroCenteredProps {
  title: string;
  subtitle?: string;
  ctaLabel: string;
  ctaHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
}
export function HeroCentered({ props }: BlockComponentProps<HeroCenteredProps>) {
  return (
    <Section className="py-20 md:py-28">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="font-display text-4xl font-bold tracking-tight md:text-6xl">
          {props.title}
        </h1>
        {props.subtitle ? (
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">{props.subtitle}</p>
        ) : null}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <a href={props.ctaHref}>{props.ctaLabel}</a>
          </Button>
          {props.secondaryLabel && props.secondaryHref ? (
            <Button asChild size="lg" variant="outline">
              <a href={props.secondaryHref}>{props.secondaryLabel}</a>
            </Button>
          ) : null}
        </div>
      </div>
    </Section>
  );
}

/* ---------- HeroVideo ---------- */
export interface HeroVideoProps {
  title: string;
  subtitle?: string;
  videoUrl: string;
  posterUrl?: string;
  ctaLabel?: string;
  ctaHref?: string;
}
export function HeroVideo({ props }: BlockComponentProps<HeroVideoProps>) {
  return (
    <section className="relative h-[80vh] min-h-[500px] w-full overflow-hidden">
      <video
        src={props.videoUrl}
        poster={props.posterUrl}
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/50 to-transparent" />
      <div className="relative z-10 mx-auto flex h-full max-w-5xl flex-col items-center justify-end px-4 pb-20 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="font-display text-4xl font-bold tracking-tight text-foreground md:text-6xl"
        >
          {props.title}
        </motion.h1>
        {props.subtitle ? (
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{props.subtitle}</p>
        ) : null}
        {props.ctaLabel && props.ctaHref ? (
          <Button asChild size="lg" className="mt-8">
            <a href={props.ctaHref}>{props.ctaLabel}</a>
          </Button>
        ) : null}
      </div>
    </section>
  );
}

/* ---------- HeroGradient ---------- */
export interface HeroGradientProps {
  title: string;
  subtitle?: string;
  ctaLabel: string;
  ctaHref: string;
  gradientFrom: string;
  gradientTo: string;
}
export function HeroGradient({ props }: BlockComponentProps<HeroGradientProps>) {
  return (
    <section
      className="relative overflow-hidden py-24 md:py-32"
      style={{
        background: `linear-gradient(135deg, ${props.gradientFrom}, ${props.gradientTo})`,
      }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.3),transparent_50%)]" />
      <div className="relative mx-auto max-w-4xl px-4 text-center">
        <h1 className="font-display text-4xl font-bold tracking-tight text-white drop-shadow-md md:text-7xl">
          {props.title}
        </h1>
        {props.subtitle ? (
          <p className="mx-auto mt-5 max-w-2xl text-lg text-white/90">{props.subtitle}</p>
        ) : null}
        <Button asChild size="lg" variant="secondary" className="mt-8">
          <a href={props.ctaHref}>{props.ctaLabel}</a>
        </Button>
      </div>
    </section>
  );
}
