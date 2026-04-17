import { motion } from "framer-motion";
import { LayoutGrid, Palette, Package, ShieldCheck, BarChart3 } from "lucide-react";

const features = [
  {
    icon: LayoutGrid,
    title: "Drag & Drop Builder",
    desc: "Design beautiful storefronts visually — no code, no complexity.",
  },
  {
    icon: Palette,
    title: "Custom Themes",
    desc: "Pixel-perfect themes you can tailor to match your brand identity.",
  },
  {
    icon: Package,
    title: "Product Management",
    desc: "Inventory, variants, and collections — all in one clean dashboard.",
  },
  {
    icon: ShieldCheck,
    title: "Secure Payments",
    desc: "PCI-compliant checkout with global payment methods built-in.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    desc: "Real-time insights on sales, traffic, and customer behavior.",
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 md:py-32 relative">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-primary uppercase tracking-wider">Features</p>
          <h2 className="mt-3 text-3xl md:text-5xl font-bold">
            Everything you need to <span className="text-gradient-brand">sell online</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Powerful tools designed to grow your business — from your first sale to your millionth.
          </p>
        </div>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              className="group relative rounded-2xl border border-border/60 bg-card p-7 shadow-soft hover:shadow-glow hover:-translate-y-1 transition-all duration-300"
            >
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-brand text-brand-foreground shadow-glow">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
