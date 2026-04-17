import { createFileRoute, Link } from "@tanstack/react-router";
import { CircleDot, ExternalLink, Globe, Palette, Package } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/dashboard/store")({
  component: StorePage,
  head: () => ({ meta: [{ title: "My Store — Storely" }] }),
});

const checklist = [
  { title: "Add your first product", done: false, to: "/dashboard/products" as const, icon: Package },
  { title: "Pick a theme", done: false, to: "/dashboard/themes" as const, icon: Palette },
  { title: "Connect a domain", done: false, to: "/dashboard/settings" as const, icon: Globe },
];

function StorePage() {
  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        eyebrow="Storefront"
        title="My Store"
        description="Your storefront at a glance."
        actions={
          <Button variant="outline">
            <ExternalLink className="h-4 w-4" /> View live store
          </Button>
        }
      />

      <Card className="border-border/60 shadow-soft overflow-hidden">
        <div className="bg-gradient-brand h-32 relative">
          <div className="absolute inset-0 bg-soft-radial opacity-60" />
        </div>
        <CardContent className="p-6 -mt-10 relative">
          <div className="h-20 w-20 rounded-2xl bg-background border-4 border-background shadow-soft flex items-center justify-center">
            <div className="h-12 w-12 rounded-xl bg-gradient-brand" />
          </div>
          <div className="mt-4 flex items-start justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-bold font-display">Your Store</h2>
              <p className="text-sm text-muted-foreground">
                yourstore.storely.app
              </p>
            </div>
            <Badge
              variant="outline"
              className="gap-1.5 border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
            >
              <CircleDot className="h-3 w-3 fill-emerald-500 text-emerald-500" />
              Active
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8">
        <h3 className="font-semibold mb-4">Setup checklist</h3>
        <div className="grid gap-3">
          {checklist.map((item) => (
            <Link key={item.title} to={item.to}>
              <Card className="border-border/60 shadow-soft hover:border-primary/40 transition-colors">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-accent text-accent-foreground flex items-center justify-center">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{item.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.done ? "Completed" : "Not started"}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    {item.done ? "Edit" : "Start"}
                  </Button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
