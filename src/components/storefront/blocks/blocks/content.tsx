import { Check, ChevronDown } from "lucide-react";
import { Section, SectionHeading, BlockImage } from "../shared";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import type { BlockComponentProps } from "../types";

/* ---------- FAQ ---------- */
export interface FAQProps {
  title: string;
  items: Array<{ question: string; answer: string }>;
}
export function FAQ({ props }: BlockComponentProps<FAQProps>) {
  return (
    <Section>
      <SectionHeading title={props.title} />
      <div className="mx-auto max-w-3xl">
        <Accordion type="single" collapsible>
          {props.items.map((it, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger>{it.question}</AccordionTrigger>
              <AccordionContent>{it.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </Section>
  );
}

/* ---------- Features ---------- */
export interface FeaturesProps {
  title: string;
  subtitle?: string;
  items: Array<{ title: string; description: string; icon?: string }>;
}
export function Features({ props }: BlockComponentProps<FeaturesProps>) {
  return (
    <Section>
      <SectionHeading title={props.title} subtitle={props.subtitle} />
      <div className="grid gap-6 md:grid-cols-3">
        {props.items.map((f, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-6">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Check className="h-5 w-5" />
            </div>
            <h3 className="font-semibold">{f.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{f.description}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ---------- ComparisonTable ---------- */
export interface ComparisonTableProps {
  title: string;
  columns: string[];
  rows: Array<{ feature: string; values: Array<boolean | string> }>;
}
export function ComparisonTable({ props }: BlockComponentProps<ComparisonTableProps>) {
  return (
    <Section>
      <SectionHeading title={props.title} />
      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-4 text-left font-medium">Feature</th>
              {props.columns.map((c) => (
                <th key={c} className="p-4 text-center font-medium">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {props.rows.map((r, i) => (
              <tr key={i} className="border-t border-border">
                <td className="p-4 font-medium">{r.feature}</td>
                {r.values.map((v, j) => (
                  <td key={j} className="p-4 text-center">
                    {typeof v === "boolean" ? (
                      v ? <Check className="mx-auto h-4 w-4 text-primary" /> : <span className="text-muted-foreground">—</span>
                    ) : (
                      v
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

/* ---------- Pricing ---------- */
export interface PricingProps {
  title: string;
  plans: Array<{
    name: string;
    price: string;
    period?: string;
    features: string[];
    ctaLabel: string;
    ctaHref: string;
    highlighted?: boolean;
  }>;
}
export function Pricing({ props }: BlockComponentProps<PricingProps>) {
  return (
    <Section>
      <SectionHeading title={props.title} />
      <div className="grid gap-6 md:grid-cols-3">
        {props.plans.map((p, i) => (
          <div
            key={i}
            className={`rounded-2xl border p-6 ${
              p.highlighted
                ? "border-primary bg-primary text-primary-foreground shadow-xl"
                : "border-border bg-card"
            }`}
          >
            <h3 className="text-lg font-semibold">{p.name}</h3>
            <p className="mt-3 font-display text-4xl font-bold">
              {p.price}
              {p.period ? <span className="text-base font-normal opacity-70">/{p.period}</span> : null}
            </p>
            <ul className="mt-5 space-y-2 text-sm">
              {p.features.map((f, j) => (
                <li key={j} className="flex gap-2">
                  <Check className="h-4 w-4 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Button
              asChild
              className="mt-6 w-full"
              variant={p.highlighted ? "secondary" : "default"}
            >
              <a href={p.ctaHref}>{p.ctaLabel}</a>
            </Button>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ---------- BentoGrid ---------- */
export interface BentoGridProps {
  title: string;
  items: Array<{ title: string; description: string; imageUrl?: string }>;
}
export function BentoGrid({ props }: BlockComponentProps<BentoGridProps>) {
  return (
    <Section>
      <SectionHeading title={props.title} />
      <div className="grid auto-rows-[180px] grid-cols-1 gap-4 md:grid-cols-3">
        {props.items.map((it, i) => (
          <div
            key={i}
            className={`group relative overflow-hidden rounded-2xl border border-border bg-card p-5 ${
              i === 0 ? "md:col-span-2 md:row-span-2" : ""
            }`}
          >
            {it.imageUrl ? (
              <BlockImage src={it.imageUrl} alt={it.title} aspect="video" className="absolute inset-0 h-full w-full rounded-none opacity-40" />
            ) : null}
            <div className="relative">
              <h3 className="font-semibold">{it.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{it.description}</p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ---------- InteractiveCards ---------- */
export interface InteractiveCardsProps {
  title: string;
  cards: Array<{ title: string; description: string; href: string }>;
}
export function InteractiveCards({ props }: BlockComponentProps<InteractiveCardsProps>) {
  return (
    <Section>
      <SectionHeading title={props.title} />
      <div className="grid gap-4 md:grid-cols-3">
        {props.cards.map((c, i) => (
          <a
            key={i}
            href={c.href}
            className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-lg"
          >
            <h3 className="font-semibold">{c.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{c.description}</p>
            <ChevronDown className="mt-4 h-5 w-5 -rotate-90 text-primary transition-transform group-hover:translate-x-1" />
          </a>
        ))}
      </div>
    </Section>
  );
}
