import { Star } from "lucide-react";
import { Section, SectionHeading } from "../shared";
import type { BlockComponentProps } from "../types";

/* ---------- Testimonials ---------- */
export interface TestimonialsProps {
  title: string;
  items: Array<{ name: string; role?: string; quote: string; avatarUrl?: string }>;
}
export function Testimonials({ props }: BlockComponentProps<TestimonialsProps>) {
  return (
    <Section>
      <SectionHeading title={props.title} />
      <div className="grid gap-6 md:grid-cols-3">
        {props.items.map((t, i) => (
          <figure
            key={i}
            className="rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="mb-3 flex gap-1 text-amber-500">
              {[0, 1, 2, 3, 4].map((s) => (
                <Star key={s} className="h-4 w-4 fill-current" />
              ))}
            </div>
            <blockquote className="text-foreground">&ldquo;{t.quote}&rdquo;</blockquote>
            <figcaption className="mt-4 flex items-center gap-3">
              {t.avatarUrl ? (
                <img src={t.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <div className="h-10 w-10 rounded-full bg-muted" />
              )}
              <div>
                <p className="text-sm font-medium">{t.name}</p>
                {t.role ? <p className="text-xs text-muted-foreground">{t.role}</p> : null}
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </Section>
  );
}

/* ---------- ReviewsSlider ---------- */
export interface ReviewsSliderProps {
  title: string;
  reviews: Array<{ stars: number; text: string; author: string }>;
}
export function ReviewsSlider({ props }: BlockComponentProps<ReviewsSliderProps>) {
  return (
    <Section>
      <SectionHeading title={props.title} />
      <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-4">
        {props.reviews.map((r, i) => (
          <article
            key={i}
            className="w-80 shrink-0 snap-start rounded-2xl border border-border bg-card p-5"
          >
            <div className="mb-2 flex gap-0.5 text-amber-500">
              {Array.from({ length: r.stars }).map((_, s) => (
                <Star key={s} className="h-4 w-4 fill-current" />
              ))}
            </div>
            <p className="text-sm">{r.text}</p>
            <p className="mt-3 text-xs font-medium text-muted-foreground">— {r.author}</p>
          </article>
        ))}
      </div>
    </Section>
  );
}

/* ---------- BrandLogos ---------- */
export interface BrandLogosProps {
  title?: string;
  logos: Array<{ name: string; url?: string }>;
}
export function BrandLogos({ props }: BlockComponentProps<BrandLogosProps>) {
  return (
    <Section className="py-10">
      {props.title ? (
        <p className="mb-6 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {props.title}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6 opacity-70">
        {props.logos.map((l, i) =>
          l.url ? (
            <img key={i} src={l.url} alt={l.name} className="h-8 w-auto" />
          ) : (
            <span key={i} className="font-display text-xl font-semibold">
              {l.name}
            </span>
          ),
        )}
      </div>
    </Section>
  );
}

/* ---------- StatsCounter ---------- */
export interface StatsCounterProps {
  stats: Array<{ value: string; label: string }>;
}
export function StatsCounter({ props }: BlockComponentProps<StatsCounterProps>) {
  return (
    <Section>
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4">
        {props.stats.map((s, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-6 text-center">
            <p className="font-display text-4xl font-bold text-primary">{s.value}</p>
            <p className="mt-2 text-sm text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ---------- UGCWall ---------- */
export interface UGCWallProps {
  title: string;
  posts: Array<{ imageUrl: string; handle: string }>;
}
export function UGCWall({ props }: BlockComponentProps<UGCWallProps>) {
  return (
    <Section>
      <SectionHeading title={props.title} />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
        {props.posts.map((p, i) => (
          <a
            key={i}
            href="#"
            className="group relative aspect-square overflow-hidden rounded-lg"
          >
            <img
              src={p.imageUrl}
              alt={p.handle}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <span className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent p-2 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
              @{p.handle}
            </span>
          </a>
        ))}
      </div>
    </Section>
  );
}
