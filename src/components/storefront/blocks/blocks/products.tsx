import { Button } from "@/components/ui/button";
import { Section, SectionHeading, BlockImage } from "../shared";
import type { BlockComponentProps } from "../types";
import { formatPrice } from "@/lib/storeTheme";

interface ProductLite {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  badge?: string;
}

/* ---------- ProductGrid ---------- */
export interface ProductGridProps {
  title: string;
  subtitle?: string;
  columns: number;
  products: ProductLite[];
  ctaLabel: string;
}
export function ProductGrid({ props, context }: BlockComponentProps<ProductGridProps>) {
  const cols = Math.min(Math.max(props.columns ?? 4, 2), 5);
  return (
    <Section>
      <SectionHeading title={props.title} subtitle={props.subtitle} />
      <div
        className="grid gap-6"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {props.products.map((p) => (
          <a
            key={p.id}
            href={`/s/${context.storeSlug}/p/${p.id}`}
            className="group block rounded-xl border border-border bg-card p-3 transition-all hover:-translate-y-1 hover:shadow-lg"
          >
            <BlockImage src={p.imageUrl} alt={p.name} aspect="square" />
            <h3 className="mt-3 line-clamp-1 font-medium">{p.name}</h3>
            <p className="mt-1 text-sm font-semibold text-primary">
              {formatPrice(p.price, context.currency)}
            </p>
          </a>
        ))}
      </div>
    </Section>
  );
}

/* ---------- ProductCarousel ---------- */
export interface ProductCarouselProps {
  title: string;
  products: ProductLite[];
}
export function ProductCarousel({ props, context }: BlockComponentProps<ProductCarouselProps>) {
  return (
    <Section>
      <SectionHeading title={props.title} align="left" />
      <div className="-mx-4 flex snap-x gap-5 overflow-x-auto px-4 pb-4 scrollbar-thin">
        {props.products.map((p) => (
          <a
            key={p.id}
            href={`/s/${context.storeSlug}/p/${p.id}`}
            className="group w-64 shrink-0 snap-start rounded-xl border border-border bg-card p-3"
          >
            <BlockImage src={p.imageUrl} alt={p.name} aspect="square" />
            <h3 className="mt-3 line-clamp-1 font-medium">{p.name}</h3>
            <p className="mt-1 text-sm font-semibold text-primary">
              {formatPrice(p.price, context.currency)}
            </p>
          </a>
        ))}
      </div>
    </Section>
  );
}

/* ---------- FeaturedProduct ---------- */
export interface FeaturedProductProps {
  product: ProductLite;
  description: string;
  ctaLabel: string;
}
export function FeaturedProduct({ props, context }: BlockComponentProps<FeaturedProductProps>) {
  return (
    <Section>
      <div className="grid items-center gap-10 md:grid-cols-2">
        <BlockImage src={props.product.imageUrl} alt={props.product.name} aspect="square" />
        <div>
          <h2 className="font-display text-3xl font-bold md:text-4xl">{props.product.name}</h2>
          <p className="mt-3 text-2xl font-semibold text-primary">
            {formatPrice(props.product.price, context.currency)}
          </p>
          <p className="mt-4 text-muted-foreground">{props.description}</p>
          <Button asChild size="lg" className="mt-6">
            <a href={`/s/${context.storeSlug}/p/${props.product.id}`}>{props.ctaLabel}</a>
          </Button>
        </div>
      </div>
    </Section>
  );
}

/* ---------- BentoProducts ---------- */
export interface BentoProductsProps {
  title: string;
  products: ProductLite[];
}
export function BentoProducts({ props, context }: BlockComponentProps<BentoProductsProps>) {
  const items = props.products.slice(0, 5);
  const spans = ["row-span-2 col-span-2", "", "", "col-span-2", ""];
  return (
    <Section>
      <SectionHeading title={props.title} />
      <div className="grid grid-cols-3 gap-4 md:grid-cols-4">
        {items.map((p, i) => (
          <a
            key={p.id}
            href={`/s/${context.storeSlug}/p/${p.id}`}
            className={`group relative overflow-hidden rounded-2xl border border-border bg-card ${spans[i] ?? ""}`}
          >
            <BlockImage
              src={p.imageUrl}
              alt={p.name}
              aspect={i === 0 ? "square" : "video"}
              className="rounded-none transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
              <p className="font-medium text-white">{p.name}</p>
              <p className="text-sm text-white/80">{formatPrice(p.price, context.currency)}</p>
            </div>
          </a>
        ))}
      </div>
    </Section>
  );
}
