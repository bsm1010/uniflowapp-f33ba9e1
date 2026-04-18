import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Tag,
  Mail,
  ShoppingCart,
  Search,
  Sparkles,
  MessageCircle,
  MousePointerClick,
  BarChart3,
  Languages,
  DollarSign,
  Check,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/dashboard/PageHeader";

export const Route = createFileRoute("/dashboard/apps")({
  component: AppsPage,
  head: () => ({
    meta: [
      { title: "App Store — Storely" },
      { name: "description", content: "Browse and install apps to power up your store." },
    ],
  }),
});

type AppDef = {
  key: string;
  name: string;
  description: string;
  icon: typeof Tag;
  category: string;
  gradient: string;
};

const APPS: AppDef[] = [
  {
    key: "discount-generator",
    name: "Discount Generator",
    description: "Create promo codes and limited-time offers in seconds.",
    icon: Tag,
    category: "Marketing",
    gradient: "from-rose-500/20 to-orange-500/20",
  },
  {
    key: "email-marketing",
    name: "Email Marketing",
    description: "Send beautiful campaigns and newsletters to your customers.",
    icon: Mail,
    category: "Marketing",
    gradient: "from-blue-500/20 to-cyan-500/20",
  },
  {
    key: "abandoned-cart",
    name: "Abandoned Cart Recovery",
    description: "Automatically remind shoppers to complete their purchase.",
    icon: ShoppingCart,
    category: "Sales",
    gradient: "from-emerald-500/20 to-teal-500/20",
  },
  {
    key: "seo-optimizer",
    name: "SEO Optimizer",
    description: "Boost your store ranking with smart on-page SEO suggestions.",
    icon: Search,
    category: "Growth",
    gradient: "from-violet-500/20 to-purple-500/20",
  },
  {
    key: "ai-descriptions",
    name: "AI Product Description Generator",
    description: "Generate compelling product copy with one click using AI.",
    icon: Sparkles,
    category: "AI",
    gradient: "from-fuchsia-500/20 to-pink-500/20",
  },
  {
    key: "chatbot",
    name: "Chatbot",
    description: "Answer customer questions 24/7 with an AI-powered assistant.",
    icon: MessageCircle,
    category: "AI",
    gradient: "from-indigo-500/20 to-blue-500/20",
  },
  {
    key: "popup-builder",
    name: "Popup Builder",
    description: "Capture leads and announce offers with custom popups.",
    icon: MousePointerClick,
    category: "Marketing",
    gradient: "from-amber-500/20 to-yellow-500/20",
  },
  {
    key: "analytics",
    name: "Analytics Integration",
    description: "Connect Google Analytics, Meta Pixel, and TikTok Pixel.",
    icon: BarChart3,
    category: "Analytics",
    gradient: "from-sky-500/20 to-blue-500/20",
  },
  {
    key: "multi-language",
    name: "Multi-language",
    description: "Translate your store into multiple languages automatically.",
    icon: Languages,
    category: "Localization",
    gradient: "from-green-500/20 to-emerald-500/20",
  },
  {
    key: "currency-converter",
    name: "Currency Converter",
    description: "Show prices in your visitor's local currency.",
    icon: DollarSign,
    category: "Localization",
    gradient: "from-lime-500/20 to-green-500/20",
  },
];

function AppsPage() {
  const { user } = useAuth();
  const [installed, setInstalled] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("installed_apps")
      .select("app_key")
      .eq("user_id", user.id)
      .then(({ data }) => {
        setInstalled(new Set((data ?? []).map((r) => r.app_key)));
        setLoading(false);
      });
  }, [user]);

  const install = async (appKey: string, appName: string) => {
    if (!user) return;
    setPending(appKey);
    const { error } = await supabase
      .from("installed_apps")
      .insert({ user_id: user.id, app_key: appKey });
    setPending(null);
    if (error) {
      toast.error("Failed to install app");
      return;
    }
    setInstalled((prev) => new Set(prev).add(appKey));
    toast.success(`${appName} installed`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="App Store"
        description="Extend your store with powerful apps. Install with one click."
      />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {APPS.map((app) => {
            const isInstalled = installed.has(app.key);
            const isPending = pending === app.key;
            const Icon = app.icon;
            return (
              <Card
                key={app.key}
                className="group relative overflow-hidden p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/40"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${app.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}
                />
                <div className="relative flex flex-col h-full gap-4">
                  <div className="flex items-start justify-between">
                    <div
                      className={`h-12 w-12 rounded-xl bg-gradient-to-br ${app.gradient} flex items-center justify-center ring-1 ring-border`}
                    >
                      <Icon className="h-6 w-6 text-foreground" />
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {app.category}
                    </Badge>
                  </div>
                  <div className="flex-1 space-y-1">
                    <h3 className="font-semibold leading-tight">{app.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {app.description}
                    </p>
                  </div>
                  <Button
                    variant={isInstalled ? "secondary" : "default"}
                    size="sm"
                    disabled={isInstalled || isPending}
                    onClick={() => install(app.key, app.name)}
                    className="w-full"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Installing...
                      </>
                    ) : isInstalled ? (
                      <>
                        <Check className="h-4 w-4" />
                        Installed
                      </>
                    ) : (
                      "Install App"
                    )}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
