import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Check, X, ShieldAlert, Loader2, ExternalLink, Package } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/admin/marketplace")({
  component: AdminMarketplacePage,
});

type App = {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  long_description: string;
  category: string;
  icon_url: string | null;
  screenshots: string[];
  app_url: string;
  price: number;
  is_free: boolean;
  status: string;
  rejection_reason: string | null;
  developer_id: string;
  created_at: string;
  developer?: { display_name: string; website: string } | null;
};

type Filter = "pending" | "approved" | "rejected" | "all";

function AdminMarketplacePage() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("pending");
  const [actingId, setActingId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<App | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [previewApp, setPreviewApp] = useState<App | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .in("role", ["admin", "marketplace_admin"]);
      setIsAdmin(!!data && data.length > 0);
    })();
  }, [user]);

  const loadApps = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("apps")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Failed to load apps");
      setLoading(false);
      return;
    }
    const devIds = [...new Set((data ?? []).map((a) => a.developer_id))];
    let devMap: Record<string, { display_name: string; website: string }> = {};
    if (devIds.length) {
      const { data: devs } = await supabase
        .from("developer_profiles")
        .select("user_id, display_name, website")
        .in("user_id", devIds);
      devMap = Object.fromEntries(
        (devs ?? []).map((d) => [d.user_id, { display_name: d.display_name, website: d.website }]),
      );
    }
    setApps((data ?? []).map((a) => ({ ...a, developer: devMap[a.developer_id] ?? null })));
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) loadApps();
  }, [isAdmin]);

  const filtered = useMemo(
    () => (filter === "all" ? apps : apps.filter((a) => a.status === filter)),
    [apps, filter],
  );

  const counts = useMemo(
    () => ({
      pending: apps.filter((a) => a.status === "pending").length,
      approved: apps.filter((a) => a.status === "approved").length,
      rejected: apps.filter((a) => a.status === "rejected").length,
    }),
    [apps],
  );

  const approve = async (app: App) => {
    setActingId(app.id);
    const { error } = await supabase
      .from("apps")
      .update({ status: "approved", rejection_reason: null })
      .eq("id", app.id);
    setActingId(null);
    if (error) {
      toast.error("Failed to approve");
      return;
    }
    toast.success(`Approved "${app.title}". Developer notified.`);
    loadApps();
  };

  const reject = async () => {
    if (!rejectTarget) return;
    setActingId(rejectTarget.id);
    const { error } = await supabase
      .from("apps")
      .update({ status: "rejected", rejection_reason: rejectReason.trim() || null })
      .eq("id", rejectTarget.id);
    setActingId(null);
    if (error) {
      toast.error("Failed to reject");
      return;
    }
    toast.success(`Rejected "${rejectTarget.title}". Developer notified.`);
    setRejectTarget(null);
    setRejectReason("");
    loadApps();
  };

  if (isAdmin === null) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-6">
        <Card className="p-8 text-center max-w-md mx-auto">
          <ShieldAlert className="h-10 w-10 mx-auto text-destructive mb-3" />
          <h2 className="text-lg font-semibold mb-1">Admin access required</h2>
          <p className="text-sm text-muted-foreground">
            You need the admin or marketplace_admin role to review apps.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        title="Marketplace Review"
        description="Approve or reject developer-submitted apps. Developers receive a notification automatically."
      />

      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
        <TabsList>
          <TabsTrigger value="pending">
            Pending{" "}
            <Badge variant="secondary" className="ml-2">
              {counts.pending}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved{" "}
            <Badge variant="secondary" className="ml-2">
              {counts.approved}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected{" "}
            <Badge variant="secondary" className="ml-2">
              {counts.rejected}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center">
          <Package className="h-10 w-10 mx-auto text-muted-foreground/60 mb-3" />
          <p className="text-sm text-muted-foreground">No apps in this view.</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filtered.map((app) => (
            <Card key={app.id} className="p-4 md:p-5">
              <div className="flex gap-4">
                {app.icon_url ? (
                  <img
                    src={app.icon_url}
                    alt={app.title}
                    className="h-16 w-16 rounded-xl object-cover border"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-xl bg-muted flex items-center justify-center">
                    <Package className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold truncate">{app.title}</h3>
                        <StatusBadge status={app.status} />
                        <Badge variant="outline">{app.category}</Badge>
                        <Badge variant="outline">{app.is_free ? "Free" : `$${app.price}`}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {app.short_description}
                      </p>
                      <p className="text-xs text-muted-foreground/80 mt-1">
                        By {app.developer?.display_name || "Unknown developer"} ·{" "}
                        {new Date(app.created_at).toLocaleDateString()}
                      </p>
                      {app.status === "rejected" && app.rejection_reason && (
                        <p className="text-xs text-destructive mt-2">
                          Reason: {app.rejection_reason}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <Button size="sm" variant="outline" onClick={() => setPreviewApp(app)}>
                      Review details
                    </Button>
                    {app.app_url && (
                      <Button size="sm" variant="ghost" asChild>
                        <a href={app.app_url} target="_blank" rel="noreferrer">
                          <ExternalLink className="h-3.5 w-3.5 mr-1" /> Open URL
                        </a>
                      </Button>
                    )}
                    {app.status !== "approved" && (
                      <Button size="sm" onClick={() => approve(app)} disabled={actingId === app.id}>
                        {actingId === app.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Check className="h-3.5 w-3.5 mr-1" />
                        )}
                        Approve
                      </Button>
                    )}
                    {app.status !== "rejected" && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setRejectTarget(app);
                          setRejectReason(app.rejection_reason ?? "");
                        }}
                        disabled={actingId === app.id}
                      >
                        <X className="h-3.5 w-3.5 mr-1" /> Reject
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Reject dialog */}
      <Dialog open={!!rejectTarget} onOpenChange={(o) => !o && setRejectTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject "{rejectTarget?.title}"?</DialogTitle>
            <DialogDescription>
              Provide a reason. It will be included in the developer's notification.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g. App URL doesn't load, screenshots are misleading…"
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={reject} disabled={actingId === rejectTarget?.id}>
              {actingId === rejectTarget?.id ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Confirm rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview dialog */}
      <Dialog open={!!previewApp} onOpenChange={(o) => !o && setPreviewApp(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewApp?.title}</DialogTitle>
            <DialogDescription>{previewApp?.short_description}</DialogDescription>
          </DialogHeader>
          {previewApp && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge variant="outline">{previewApp.category}</Badge>
                <Badge variant="outline">
                  {previewApp.is_free ? "Free" : `$${previewApp.price}`}
                </Badge>
                <StatusBadge status={previewApp.status} />
              </div>
              {previewApp.app_url && (
                <a
                  href={previewApp.app_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-primary inline-flex items-center gap-1 hover:underline"
                >
                  {previewApp.app_url} <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {previewApp.screenshots?.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {previewApp.screenshots.map((s) => (
                    <img
                      key={s}
                      src={s}
                      alt={(previewApp?.title || "App") + " screenshot"}
                      className="w-full rounded-md border object-cover aspect-video"
                    />
                  ))}
                </div>
              )}
              <div>
                <h4 className="text-sm font-semibold mb-1">Description</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {previewApp.long_description || "—"}
                </p>
              </div>
              {previewApp.developer && (
                <div className="text-xs text-muted-foreground">
                  Developer: {previewApp.developer.display_name}
                  {previewApp.developer.website ? ` · ${previewApp.developer.website}` : ""}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<
    string,
    { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
  > = {
    pending: { label: "Pending", variant: "secondary" },
    approved: { label: "Approved", variant: "default" },
    rejected: { label: "Rejected", variant: "destructive" },
  };
  const v = map[status] ?? { label: status, variant: "outline" as const };
  return <Badge variant={v.variant}>{v.label}</Badge>;
}
