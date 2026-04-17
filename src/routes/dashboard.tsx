import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { LogOut, Package, BarChart3, Palette, ShoppingBag } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
  head: () => ({
    meta: [
      { title: "Dashboard — Storely" },
      { name: "description", content: "Manage your Storely store." },
    ],
  }),
});

function DashboardPage() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState<string>("");

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/login" });
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.name) setName(data.name);
      });
  }, [user]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  const displayName = name || user.email?.split("@")[0] || "there";

  const stats = [
    { label: "Products", value: "0", icon: Package },
    { label: "Orders", value: "0", icon: ShoppingBag },
    { label: "Revenue", value: "$0", icon: BarChart3 },
    { label: "Themes", value: "1", icon: Palette },
  ];

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-background/70 backdrop-blur-xl sticky top-0 z-40">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-brand shadow-glow" />
            <span className="font-display font-semibold text-lg">Storely</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-sm text-muted-foreground">
              {user.email}
            </span>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <p className="text-sm text-primary font-medium uppercase tracking-wider">
            Dashboard
          </p>
          <h1 className="mt-2 text-3xl md:text-4xl font-bold">
            Welcome back, <span className="text-gradient-brand">{displayName}</span>
          </h1>
          <p className="mt-2 text-muted-foreground">
            Here's a snapshot of your store. Let's build something amazing today.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 * i }}
              className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{s.label}</span>
                <s.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="mt-3 text-3xl font-bold font-display">{s.value}</div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="mt-10 rounded-2xl border border-border/60 bg-gradient-brand p-10 text-center shadow-glow"
        >
          <h2 className="text-2xl font-bold text-brand-foreground">
            Your store is ready to be built
          </h2>
          <p className="mt-2 text-brand-foreground/80 max-w-md mx-auto">
            Add your first product, pick a theme, and launch in minutes.
          </p>
          <Button variant="secondary" size="lg" className="mt-6">
            Add your first product
          </Button>
        </motion.div>
      </section>
    </main>
  );
}
