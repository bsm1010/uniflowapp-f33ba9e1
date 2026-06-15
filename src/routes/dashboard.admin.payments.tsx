import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Check, X, ImageIcon, ShieldAlert, Loader2, Settings2, CheckCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/admin/payments")({
  component: AdminPaymentsPage,
});

type Submission = {
  id: string;
  user_id: string;
  plan: string;
  amount: number;
  payment_method: string;
  proof_url: string;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  profile?: { name: string | null; email: string | null } | null;
};

type Filter = "pending" | "approved" | "rejected" | "all";

function AdminPaymentsPage() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("pending");
  const [actingId, setActingId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkActing, setBulkActing] = useState(false);

  // Auto-verify settings
  const [avEnabled, setAvEnabled] = useState(false);
  const [avPattern, setAvPattern] = useState("");
  const [avLoaded, setAvLoaded] = useState(false);
  const [avSaving, setAvSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      setIsAdmin(!!data);
    })();
  }, [user]);

  // Load auto-verify settings
  useEffect(() => {
    if (!user || isAdmin !== true) return;
    (async () => {
      const { data } = await supabase
        .from("payment_auto_verify_settings")
        .select("enabled, pattern")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setAvEnabled(data.enabled);
        setAvPattern(data.pattern ?? "");
      }
      setAvLoaded(true);
    })();
  }, [user, isAdmin]);

  // Save auto-verify settings
  const saveAvSettings = async () => {
    if (!user) return;
    setAvSaving(true);
    const payload = { enabled: avEnabled, pattern: avPattern };
    const { data: existing } = await supabase
      .from("payment_auto_verify_settings")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    let err: any;
    if (existing) {
      ({ error: err } = await supabase
        .from("payment_auto_verify_settings")
        .update(payload)
        .eq("user_id", user.id));
    } else {
      ({ error: err } = await supabase
        .from("payment_auto_verify_settings")
        .insert({ user_id: user.id, ...payload }));
    }
    setAvSaving(false);
    if (err) {
      toast.error("Failed to save auto-verify settings");
      return;
    }
    // If enabled and pattern set, auto-verify matching pending submissions
    if (avEnabled && avPattern.trim()) {
      const pattern = avPattern.trim().toLowerCase();
      const pending = submissions.filter(
        (s) => s.status === "pending" && s.proof_url.toLowerCase().includes(pattern),
      );
      for (const sub of pending) {
        await supabase
          .from("payment_submissions")
          .update({ status: "approved", reviewed_at: new Date().toISOString() })
          .eq("id", sub.id);
      }
      if (pending.length > 0) {
        toast.success(
          `Auto-verified ${pending.length} submission${pending.length === 1 ? "" : "s"}`,
        );
        loadSubmissions();
      } else {
        toast.success("Settings saved");
      }
    } else {
      toast.success("Settings saved");
    }
  };

  const loadSubmissions = async () => {
    setLoading(true);
    const { data: subs, error } = await supabase
      .from("payment_submissions")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Failed to load submissions");
      setLoading(false);
      return;
    }
    const userIds = [...new Set((subs ?? []).map((s) => s.user_id))];
    let profilesMap: Record<string, { name: string | null; email: string | null }> = {};
    if (userIds.length) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, email")
        .in("id", userIds);
      profilesMap = Object.fromEntries(
        (profiles ?? []).map((p) => [p.id, { name: p.name, email: p.email }]),
      );
    }
    const enriched = (subs ?? []).map((s) => ({
      ...s,
      profile: profilesMap[s.user_id] ?? null,
    }));
    setSubmissions(enriched);

    const urls: Record<string, string> = {};
    await Promise.all(
      enriched.map(async (s) => {
        const path = extractPath(s.proof_url);
        if (!path) return;
        const { data } = await supabase.storage.from("payment-proofs").createSignedUrl(path, 3600);
        if (data?.signedUrl) urls[s.id] = data.signedUrl;
      }),
    );
    setSignedUrls(urls);
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) loadSubmissions();
  }, [isAdmin]);

  const filtered = useMemo(
    () => (filter === "all" ? submissions : submissions.filter((s) => s.status === filter)),
    [submissions, filter],
  );

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((s) => s.id)));
    }
  };

  const handleBulkVerify = async () => {
    if (selected.size === 0) return;
    setBulkActing(true);
    const ids = Array.from(selected);
    const { error } = await supabase
      .from("payment_submissions")
      .update({ status: "approved", reviewed_at: new Date().toISOString() })
      .in("id", ids);
    setBulkActing(false);
    if (error) {
      toast.error("Failed to verify selected");
      return;
    }
    toast.success(`Verified ${ids.length} submission${ids.length === 1 ? "" : "s"}`);
    setSelected(new Set());
    loadSubmissions();
  };

  const handleApprove = async (sub: Submission) => {
    setActingId(sub.id);
    const { error: subErr } = await supabase
      .from("payment_submissions")
      .update({ status: "approved", reviewed_at: new Date().toISOString() })
      .eq("id", sub.id);
    if (subErr) {
      toast.error("Failed to approve payment");
    } else {
      toast.success("Payment approved — credits granted to user");
    }
    setActingId(null);
    loadSubmissions();
  };

  const handleReject = async (sub: Submission) => {
    setActingId(sub.id);
    const { error } = await supabase
      .from("payment_submissions")
      .update({ status: "rejected", reviewed_at: new Date().toISOString() })
      .eq("id", sub.id);
    if (error) toast.error("Failed to reject");
    else toast.success("Payment rejected");
    setActingId(null);
    loadSubmissions();
  };

  if (isAdmin === null) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Admin · Payments"
          description="Review and approve payment submissions."
        />
        <div className="rounded-xl border bg-card p-10 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
          <h3 className="text-lg font-semibold">Admin access required</h3>
          <p className="text-sm text-muted-foreground mt-1">
            You don't have permission to view this page.
          </p>
        </div>
      </div>
    );
  }

  const pendingCount = submissions.filter((s) => s.status === "pending").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin · Payments"
        description={`Review payment proofs and activate subscriptions. ${pendingCount} pending.`}
      />

      {/* Auto-verify settings */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings2 className="h-5 w-5 text-muted-foreground" />
            <div>
              <h3 className="font-semibold text-sm">Auto-verify</h3>
              <p className="text-xs text-muted-foreground">
                Automatically approve submissions when the receipt filename contains a pattern
              </p>
            </div>
          </div>
          <Switch checked={avEnabled} onCheckedChange={setAvEnabled} />
        </div>
        {avEnabled && (
          <div className="flex items-end gap-3 pl-8">
            <div className="flex-1 space-y-1">
              <Label htmlFor="av-pattern" className="text-xs">
                Filename pattern
              </Label>
              <Input
                id="av-pattern"
                value={avPattern}
                onChange={(e) => setAvPattern(e.target.value)}
                placeholder="e.g. order ID or customer name"
              />
            </div>
            <Button size="sm" onClick={saveAvSettings} disabled={avSaving}>
              {avSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </div>
        )}
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-2">
          <span className="text-sm text-muted-foreground">{selected.size} selected</span>
          <Button size="sm" onClick={handleBulkVerify} disabled={bulkActing}>
            {bulkActing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <CheckCheck className="h-4 w-4 mr-1" />
            )}
            Verify selected
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
            Clear
          </Button>
        </div>
      )}

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={filtered.length > 0 && selected.size === filtered.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>User</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Proof</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                    No submissions found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <Checkbox
                        checked={selected.has(s.id)}
                        onCheckedChange={() => toggleSelect(s.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{s.profile?.name || "Unnamed"}</div>
                      <div className="text-xs text-muted-foreground">{s.profile?.email}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{planLabel(s.plan)}</div>
                      <div className="text-xs text-muted-foreground">
                        +{planCredits(s.plan)} credits
                      </div>
                    </TableCell>
                    <TableCell>{Number(s.amount).toLocaleString()} DZD</TableCell>
                    <TableCell className="capitalize">{s.payment_method}</TableCell>
                    <TableCell>
                      {signedUrls[s.id] ? (
                        <button
                          onClick={() => setPreviewUrl(signedUrls[s.id])}
                          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          <ImageIcon className="h-4 w-4" />
                          View
                        </button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(s.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={s.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      {s.status === "pending" ? (
                        <div className="flex justify-end gap-2">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="outline" disabled={actingId === s.id}>
                                <X className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Reject payment?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will mark the submission as rejected. The user will not
                                  receive credits.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleReject(s)}>
                                  Reject
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          <Button
                            size="sm"
                            disabled={actingId === s.id}
                            onClick={() => handleApprove(s)}
                          >
                            {actingId === s.id ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : (
                              <Check className="h-4 w-4 mr-1" />
                            )}
                            Mark as paid
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {s.reviewed_at ? new Date(s.reviewed_at).toLocaleDateString() : "—"}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={!!previewUrl} onOpenChange={(o) => !o && setPreviewUrl(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment proof</DialogTitle>
          </DialogHeader>
          {previewUrl && (
            <img
              src={previewUrl}
              alt="Payment proof"
              className="w-full max-h-[70vh] object-contain rounded-lg border"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variant =
    status === "approved" ? "default" : status === "rejected" ? "destructive" : "secondary";
  return (
    <Badge variant={variant as "default" | "secondary" | "destructive"} className="capitalize">
      {status}
    </Badge>
  );
}

function extractPath(url: string): string | null {
  const marker = "/payment-proofs/";
  const idx = url.indexOf(marker);
  if (idx === -1) return url;
  return url.slice(idx + marker.length).split("?")[0];
}

const PLAN_META: Record<string, { label: string; credits: number }> = {
  pack_50: { label: "Credit pack — 50", credits: 50 },
  pack_150: { label: "Credit pack — 150", credits: 150 },
  pack_500: { label: "Credit pack — 500", credits: 500 },
  basic: { label: "Basic subscription", credits: 100 },
  pro: { label: "Pro subscription", credits: 300 },
  business: { label: "Business subscription", credits: 2000 },
  monthly: { label: "Monthly (legacy)", credits: 0 },
  yearly: { label: "Yearly (legacy)", credits: 0 },
};

function planLabel(plan: string): string {
  return PLAN_META[plan]?.label ?? plan;
}
function planCredits(plan: string): number {
  return PLAN_META[plan]?.credits ?? 0;
}
