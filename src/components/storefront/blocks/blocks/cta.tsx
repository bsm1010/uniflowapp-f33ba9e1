import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Section, SectionHeading } from "../shared";
import type { BlockComponentProps } from "../types";

/* ---------- CTASection ---------- */
export interface CTASectionProps {
  title: string;
  subtitle?: string;
  ctaLabel: string;
  ctaHref: string;
}
export function CTASection({ props }: BlockComponentProps<CTASectionProps>) {
  return (
    <Section>
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-accent p-12 text-center text-primary-foreground md:p-20">
        <h2 className="font-display text-3xl font-bold md:text-5xl">{props.title}</h2>
        {props.subtitle ? (
          <p className="mx-auto mt-4 max-w-2xl text-lg opacity-90">{props.subtitle}</p>
        ) : null}
        <Button asChild size="lg" variant="secondary" className="mt-8">
          <a href={props.ctaHref}>{props.ctaLabel}</a>
        </Button>
      </div>
    </Section>
  );
}

/* ---------- Newsletter ---------- */
export interface NewsletterProps {
  title: string;
  subtitle?: string;
  placeholder: string;
  ctaLabel: string;
}
export function Newsletter({ props }: BlockComponentProps<NewsletterProps>) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  return (
    <Section>
      <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-8 text-center">
        <SectionHeading title={props.title} subtitle={props.subtitle} />
        {done ? (
          <p className="text-sm font-medium text-primary">Thanks for subscribing!</p>
        ) : (
          <form
            className="mx-auto flex max-w-md gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (email) setDone(true);
            }}
          >
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={props.placeholder}
            />
            <Button type="submit">{props.ctaLabel}</Button>
          </form>
        )}
      </div>
    </Section>
  );
}

/* ---------- ContactForm ---------- */
export interface ContactFormProps {
  title: string;
  subtitle?: string;
  submitLabel: string;
}
export function ContactForm({ props }: BlockComponentProps<ContactFormProps>) {
  return (
    <Section>
      <SectionHeading title={props.title} subtitle={props.subtitle} />
      <form className="mx-auto grid max-w-xl gap-4">
        <Input placeholder="Your name" required />
        <Input type="email" placeholder="Email" required />
        <textarea
          className="min-h-[120px] rounded-md border border-input bg-transparent p-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          placeholder="Message"
          required
        />
        <Button type="submit" size="lg">{props.submitLabel}</Button>
      </form>
    </Section>
  );
}

/* ---------- FloatingButton ---------- */
export interface FloatingButtonProps {
  label: string;
  href: string;
  position: "bottom-right" | "bottom-left";
}
export function FloatingButton({ props }: BlockComponentProps<FloatingButtonProps>) {
  const pos = props.position === "bottom-left" ? "left-6" : "right-6";
  return (
    <a
      href={props.href}
      className={`fixed bottom-6 ${pos} z-40 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-transform hover:scale-105`}
    >
      {props.label}
    </a>
  );
}

/* ---------- StickyCart ---------- */
export interface StickyCartProps {
  productName: string;
  price: string;
  ctaLabel: string;
  ctaHref: string;
}
export function StickyCart({ props }: BlockComponentProps<StickyCartProps>) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 p-3 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{props.productName}</p>
          <p className="text-sm font-semibold text-primary">{props.price}</p>
        </div>
        <Button asChild>
          <a href={props.ctaHref} className="gap-2">
            <ShoppingBag className="h-4 w-4" />
            {props.ctaLabel}
          </a>
        </Button>
      </div>
    </div>
  );
}
