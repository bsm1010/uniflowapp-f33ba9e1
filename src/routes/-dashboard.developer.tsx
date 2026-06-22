import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Plus, ExternalLink, Code2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type AppRow = {
  id: string;
  title: string;
  slug: string;
  category: string;
  status: string;
  is_free: boolean;
  price: number;
  icon_url: string | null;
  rejection_reason: string | null;
  created_at: string;
};

type Profile = {
  display_name: string;
  bio: string;
  website: string;
  avatar_url: string | null;
};

function statusBadge(status: string) {
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: "Pending review", cls: "bg-amber-500/15 text-amber-700 border-amber-500/30" },
    approved: {
      label: "Approved",
      cls: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
    },
    rejected: { label: "Rejected", cls: "bg-red-500/15 text-red-700 border-red-500/30" },
  };
  const m = map[status] ?? { label: status, cls: "" };
  return (
    <Badge variant="outline" className={m.cls}>
      {m.label}
    </Badge>
  );
}

export function DeveloperComponent() {
  const { user } = useAuth();
  const [apps, setApps] = useState<AppRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile>({
    display_name: "",
    bio: "",
    website: "",
    avatar_url: null,
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [earnings, setEarnings] = useState(0);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [appsRes, profRes, purchRes] = await Promise.all([
        supabase
          .from("apps")
          .select(
            "id,title,slug,category,status,is_free,price,icon_url,rejection_reason,created_at",
          )
          .eq("developer_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("developer_profiles")
          .select("display_name,bio,website,avatar_url")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("app_purchases")
          .select("amount_paid, app_id, apps!inner(developer_id)")
          .eq("apps.developer_id", user.id),
      ]);
      setApps((appsRes.data as AppRow[]) ?? []);
      if (profRes.data) setProfile(profRes.data as Profile);
      const total = (purchRes.data ?? []).reduce(
        (s: number, r: { amount_paid: number }) => s + Number(r.amount_paid ?? 0),
        0,
      );
      setEarnings(total);
      setLoading(false);
    })();
  }, [user]);

  const saveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    const { error } = await supabase.from("developer_profiles").upsert(
      {
        user_id: user.id,
        display_name: profile.display_name,
        bio: profile.bio,
        website: profile.website,
        avatar_url: profile.avatar_url,
      },
      { onConflict: "user_id" },
    );
    setSavingProfile(false);
    if (error) toast.error(error.message);
    else toast.success("Profile saved");
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Code2 className="h-7 w-7 text-[#7C3AED]" />
            Developer Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">Manage your marketplace apps and profile.</p>
        </div>
        <Button asChild className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white">
          <Link to="/dashboard/apps/submit">
            <Plus className="h-4 w-4" />
            New app
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="text-sm text-muted-foreground">Total apps</div>
          <div className="text-3xl font-bold mt-1">{apps.length}</div>
        </Card>
        <Card className="p-5">
          <div className="text-sm text-muted-foreground">Approved</div>
          <div className="text-3xl font-bold mt-1">
            {apps.filter((a) => a.status === "approved").length}
          </div>
        </Card>
        <Card className="p-5">
          <div className="text-sm text-muted-foreground">Earnings</div>
          <div className="text-3xl font-bold mt-1">${earnings.toFixed(2)}</div>
        </Card>
      </div>

      {/* Profile */}
      <Card className="p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-lg">Developer profile</h2>
          <p className="text-sm text-muted-foreground">Shown publicly on your app listings.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Display name</Label>
            <Input
              value={profile.display_name}
              onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
              placeholder="Your name or studio"
            />
          </div>
          <div className="space-y-2">
            <Label>Website</Label>
            <Input
              value={profile.website}
              onChange={(e) => setProfile({ ...profile, website: e.target.value })}
              placeholder="https://"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Bio</Label>
          <Textarea
            rows={3}
            value={profile.bio}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            placeholder="Tell merchants about yourself."
          />
        </div>
        <div>
          <Button onClick={saveProfile} disabled={savingProfile}>
            {savingProfile && <Loader2 className="h-4 w-4 animate-spin" />}
            Save profile
          </Button>
        </div>
      </Card>

      {/* Apps */}
      <div className="space-y-4">
        <h2 className="font-semibold text-lg">Your apps</h2>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : apps.length === 0 ? (
          <Card className="p-10 text-center">
            <p className="text-muted-foreground">You haven't submitted any apps yet.</p>
            <Button asChild className="mt-4 bg-[#7C3AED] hover:bg-[#6D28D9] text-white">
              <Link to="/dashboard/apps/submit">
                <Plus className="h-4 w-4" />
                Submit your first app
              </Link>
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {apps.map((app) => (
              <Card key={app.id} className="p-4 flex items-center gap-4">
                <div className="h-14 w-14 rounded-xl bg-muted overflow-hidden flex items-center justify-center shrink-0">
                  {app.icon_url ? (
                    <img src={app.icon_url} alt={(app.title || "App") + " icon"} className="h-full w-full object-cover" />
                  ) : (
                    <Code2 className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold truncate">{app.title}</span>
                    {statusBadge(app.status)}
                    <Badge variant="secondary" className="text-xs">
                      {app.category}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mt-0.5">
                    {app.is_free ? "Free" : `$${Number(app.price).toFixed(2)}`} ·{" "}
                    {new Date(app.created_at).toLocaleDateString()}
                  </div>
                  {app.status === "rejected" && app.rejection_reason && (
                    <p className="text-xs text-red-600 mt-1">Reason: {app.rejection_reason}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {app.status === "approved" && (
                    <Button asChild size="sm" variant="outline">
                      <Link to="/dashboard/apps/m/$appId" params={{ appId: app.id }}>
                        <ExternalLink className="h-3.5 w-3.5" />
                        View
                      </Link>
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
