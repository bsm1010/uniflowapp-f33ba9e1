import { Shield, Truck, RotateCcw, Lock, Award, Headphones } from "lucide-react";
import { Section, SectionHeading } from "../shared";
import type { BlockComponentProps } from "../types";

const ICONS = { shield: Shield, truck: Truck, rotate: RotateCcw, lock: Lock, award: Award, support: Headphones };
type IconKey = keyof typeof ICONS;

/* ---------- TrustBadges ---------- */
export interface TrustBadgesProps {
  items: Array<{ icon: IconKey; label: string; description?: string }>;
}
export function TrustBadges({ props }: BlockComponentProps<TrustBadgesProps>) {
  return (
    <Section className="py-10">
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        {props.items.map((t, i) => {
          const Icon = ICONS[t.icon] ?? Shield;
          return (
            <div
              key={i}
              className="flex items-start gap-3 rounded-xl border border-border bg-card p-4"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">{t.label}</p>
                {t.description ? (
                  <p className="text-xs text-muted-foreground">{t.description}</p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

/* ---------- Guarantees ---------- */
export interface GuaranteesProps {
  title: string;
  items: Array<{ title: string; description: string }>;
}
export function Guarantees({ props }: BlockComponentProps<GuaranteesProps>) {
  return (
    <Section>
      <SectionHeading title={props.title} />
      <div className="grid gap-6 md:grid-cols-3">
        {props.items.map((g, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-6 text-center">
            <Shield className="mx-auto h-8 w-8 text-primary" />
            <h3 className="mt-3 font-semibold">{g.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{g.description}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ---------- Shipping ---------- */
export interface ShippingProps {
  title: string;
  zones: Array<{ region: string; time: string; price: string }>;
}
export function Shipping({ props }: BlockComponentProps<ShippingProps>) {
  return (
    <Section>
      <SectionHeading title={props.title} />
      <div className="overflow-hidden rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-4 text-left font-medium">Region</th>
              <th className="p-4 text-left font-medium">Delivery time</th>
              <th className="p-4 text-left font-medium">Price</th>
            </tr>
          </thead>
          <tbody>
            {props.zones.map((z, i) => (
              <tr key={i} className="border-t border-border">
                <td className="p-4 font-medium">{z.region}</td>
                <td className="p-4 text-muted-foreground">{z.time}</td>
                <td className="p-4 font-semibold text-primary">{z.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}
