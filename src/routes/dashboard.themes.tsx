import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/dashboard/themes")({
  component: ThemesPage,
  head: () => ({ meta: [{ title: "Themes — Storely" }] }),
});

const themes = [
  { name: "Aurora", desc: "Bold gradients, modern typography.", gradient: "from-violet-500 to-fuchsia-500", active: true },
  { name: "Linen", desc: "Editorial, minimal, photo-forward.", gradient: "from-stone-300 to-stone-500", active: false },
  { name: "Neon", desc: "High-contrast for streetwear & tech.", gradient: "from-emerald-400 to-cyan-500", active: false },
  { name: "Bloom", desc: "Soft pastels for lifestyle brands.", gradient: "from-pink-300 to-rose-400", active: false },
];

function ThemesPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        eyebrow="Storefront"
        title="Themes"
        description="Pick a look that fits your brand. Customize anytime."
      />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {themes.map((t) => (
          <Card key={t.name} className="overflow-hidden border-border/60 shadow-soft group">
            <div className={`aspect-[4/3] bg-gradient-to-br ${t.gradient} relative`}>
              {t.active && (
                <Badge className="absolute top-3 right-3 bg-background text-foreground gap-1">
                  <Check className="h-3 w-3" /> Active
                </Badge>
              )}
            </div>
            <CardContent className="p-5">
              <div className="font-semibold">{t.name}</div>
              <p className="mt-1 text-sm text-muted-foreground">{t.desc}</p>
              <Button
                variant={t.active ? "outline" : "default"}
                size="sm"
                className="mt-4 w-full"
              >
                {t.active ? "Customize" : "Apply theme"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
