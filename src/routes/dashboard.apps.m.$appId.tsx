import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink, Loader2, Star, Store } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Img } from "@/components/ui/Img";

export const Route = createFileRoute("/dashboard/apps/m/$appId")({
  component: MarketplaceAppPage,
  head: () => ({ meta: [{ title: "App — Fennecly" }] }),
});

type AppFull = {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  long_description: string;
  category: string;
  app_url: string;
  icon_url: string | null;
  screenshots: string[];
  price: number;
  is_free: boolean;
  status: string;
  developer_id: string;
  created_at: string;
};

function MarketplaceAppPage() {
  const { appId } = Route.useParams();
  const { user } = useAuth();
  const [app, setApp] = useState<AppFull | null>(null);
  const [purchased, setPurchased] = useState(false);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [heroIdx, setHeroIdx] = useState(0);
  const [developer, setDeveloper] = useState<{ display_name: string } | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("apps").select("*").eq("id", appId).maybeSingle();
      if (!data) {
        setLoading(false);
        return;
      }
      setApp(data as AppFull);
      const [profRes, purchRes] = await Promise.all([
        supabase
          .from("developer_profiles")
          .select("display_name")
          .eq("user_id", (data as AppFull).developer_id)
          .maybeSingle(),
        user
          ? supabase
              .from("app_purchases")
              .select("id")
              .eq("app_id", appId)
              .eq("user_id", user.id)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ]);
      setDeveloper((profRes.data as { display_name: string } | null) ?? null);
      setPurchased(!!purchRes.data);
      setLoading(false);
    })();
  }, [appId, user]);

  const handleInstall = async () => {
    if (!user || !app) return;
    if (!app.is_free) {
      toast.info("Paid checkout coming soon");
      return;
    }
    setActing(true);
    const { error } = await supabase.from("app_purchases").insert({
      app_id: app.id,
      user_id: user.id,
      amount_paid: 0,
    });
    setActing(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setPurchased(true);
    toast.success("Installed!");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!app) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">App not found.</p>
        <Button asChild className="mt-4">
          <Link to="/dashboard/apps/marketplace">Back to Marketplace</Link>
        </Button>
      </div>
    );
  }

  const hero = app.screenshots[heroIdx];

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link to="/dashboard/apps/marketplace">
          <ArrowLeft className="h-4 w-4" />
          Marketplace
        </Link>
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
        {/* Sidebar */}
        <Card className="p-5 h-fit lg:sticky lg:top-4 space-y-4">
          <div className="h-20 w-20 rounded-2xl bg-muted overflow-hidden flex items-center justify-center mx-auto">
            {app.icon_url ? (
              <Img src={app.icon_url} alt={app.title} className="h-full w-full" />
            ) : (
              <Store className="h-10 w-10 text-muted-foreground" />
            )}
          </div>
          <div className="text-center">
            <h1 className="font-bold text-xl">{app.title}</h1>
            <p className="text-sm text-muted-foreground">
              by {developer?.display_name || "Unknown developer"}
            </p>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-sm">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span className="font-medium">New</span>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">
              {app.is_free ? "Free" : `$${Number(app.price).toFixed(2)}`}
            </div>
          </div>
          <Badge variant="secondary" className="w-full justify-center">
            {app.category}
          </Badge>

          {purchased ? (
            <Button asChild className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white">
              <a href={app.app_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                Open app
              </a>
            </Button>
          ) : (
            <Button
              onClick={handleInstall}
              disabled={acting}
              className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white"
            >
              {acting && <Loader2 className="h-4 w-4 animate-spin" />}
              {app.is_free ? "Install" : `Buy for $${Number(app.price).toFixed(2)}`}
            </Button>
          )}
        </Card>

        {/* Content */}
        <div className="space-y-6 min-w-0">
          {hero && (
            <div className="rounded-2xl overflow-hidden bg-muted aspect-video">
              <Img src={hero} alt={app?.title || "App screenshot"} className="w-full h-full" />
            </div>
          )}
          {app.screenshots.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {app.screenshots.map((s, i) => (
                <button
                  key={s}
                  onClick={() => setHeroIdx(i)}
                  className={`h-16 w-28 rounded-lg overflow-hidden shrink-0 border-2 transition ${
                    i === heroIdx
                      ? "border-[#7C3AED]"
                      : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <Img src={s} alt={(app?.title || "App") + " screenshot " + (i + 1)} className="w-full h-full" />
                </button>
              ))}
            </div>
          )}

          <Card className="p-6">
            <h2 className="font-semibold text-lg mb-3">About this app</h2>
            <p className="text-sm text-muted-foreground mb-4">{app.short_description}</p>
            {app.long_description && (
              <div className="prose prose-sm max-w-none whitespace-pre-wrap text-foreground">
                {app.long_description}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
