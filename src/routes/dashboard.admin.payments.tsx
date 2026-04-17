import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, X, ImageIcon, ShieldAlert, Loader2 } from "lucide-react";
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

    // Sign URLs for proofs
    const urls: Record<string, string> = {};
    await Promise.all(
      enriched.map(async (s) => {
        const path = extractPath(s.proof_url);
        if (!path) return;
        const { data } = await supabase.storage
          .from("payment-proofs")
          .createSignedUrl(path, 3600);
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

  const handleApprove = async (sub: Submission) => {
    setActingId(sub.id);
    const days = sub.plan === "yearly" ? 365 : 30;
    const endDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

    const { error: profErr } = await supabase
      .from("profiles")
      .update({
        subscription_status: "active",
        subscription_type: sub.plan,
        subscription_end_date: endDate,
      })
      .eq("id", sub.user_id);

    if (profErr) {
      toast.error("Failed to activate subscription");
      setActingId(null);
      return;
    }

    const { error: subErr } = await supabase
      .from("payment_submissions")
      .update({ status: "approved", reviewed_at: new Date().toISOString() })
      .eq("id", sub.id);

    if (subErr) {
      toast.error("Subscription activated but submission update failed");
    } else {
      toast.success("Payment approved and subscription activated");
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
        <PageHeader title="Admin · Payments" description="Review and approve payment submissions." />
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin · Payments"
        description="Review payment proofs and activate subscriptions."
      />

      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
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
                <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                  No submissions found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <div className="font-medium">{s.profile?.name || "Unnamed"}</div>
                    <div className="text-xs text-muted-foreground">{s.profile?.email}</div>
                  </TableCell>
                  <TableCell className="capitalize">{s.plan}</TableCell>
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
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={actingId === s.id}
                          onClick={() => handleReject(s)}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          disabled={actingId === s.id}
                          onClick={() => handleApprove(s)}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Approve
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
  // Stored as full public URL like .../object/public/payment-proofs/<path> or signed URL.
  // We standardize on extracting after "/payment-proofs/"
  const marker = "/payment-proofs/";
  const idx = url.indexOf(marker);
  if (idx === -1) return url; // assume already a path
  return url.slice(idx + marker.length).split("?")[0];
}
