import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const links = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how" },
  { label: "Pricing", href: "#pricing" },
  { label: "Testimonials", href: "#testimonials" },
];

export function Navbar() {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 inset-x-0 z-50"
    >
      <div className="mx-auto max-w-6xl px-4 mt-4">
        <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/70 backdrop-blur-xl px-4 py-3 shadow-soft">
          <a href="#" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-brand shadow-glow" />
            <span className="font-display font-semibold text-lg">Storely</span>
          </a>
          <nav className="hidden md:flex items-center gap-7">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
              Sign in
            </Button>
            <Button size="sm" className="bg-gradient-brand text-brand-foreground hover:opacity-90">
              Get Started
            </Button>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
