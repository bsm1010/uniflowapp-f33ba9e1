import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Mail,
  Plus,
  Send,
  Trash2,
  Users,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useInstalledApps } from "@/hooks/use-installed-apps";
import { sendCampaign } from "@/lib/email-marketing/send";
import { toast } from "sonner";

import { RequireApp } from "@/components/dashboard/RequireApp";

export const Route = createFileRoute("/dashboard/apps/email-marketing")({
  component: () => (
    <RequireApp appKey="email-marketing">
      <EmailMarketingApp />
    </RequireApp>
  ),
  head: () => ({
    meta: [
      { title: "Email Marketing — Storely" },
      {
        name: "description",
        content: "Create and send email campaigns to your customers.",
      },
    ],
  }),
});

type Campaign = {
  id: string;
  subject: string;
  message: string;
  audience_type: "all_customers" | "manual";
  recipients: string[];
  status: "draft" | "sending" | "sent" | "failed";
  sent_count: number;
  failed_count: number;
  error: string | null;
  sent_at: string | null;
  created_at: string;
};

function EmailMarketingApp() {
  const { user } = useAuth();
  const { isInstalled, loading: appsLoading } = useInstalledApps();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState<string | null>(null);

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState<"all_customers" | "manual">(
    "all_customers",
  );
  const [manualList, setManualList] = useState("");
  const [customerCount, setCustomerCount] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const installed = isInstalled("email-marketing");

  const refresh = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("email_campaigns")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setCampaigns((data ?? []) as Campaign[]);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("orders")
      .select("customer_email", { count: "exact", head: false })
      .eq("store_owner_id", user.id)
      .then(({ data }) => {
        const unique = new Set(
          (data ?? [])
            .map((o) => (o.customer_email ?? "").trim().toLowerCase())
            .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)),
        );
        setCustomerCount(unique.size);
      });
  }, [user]);

  const parsedManual = useMemo(
    () =>
      manualList
        .split(/[\s,;]+/)
        .map((e) => e.trim().toLowerCase())
        .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)),
    [manualList],
  );

  const createDraft = async () => {
    if (!user) return;
    if (!subject.trim() || !message.trim()) {
      toast.error("Subject and message are required");
      return;
    }
    if (audience === "manual" && parsedManual.length === 0) {
      toast.error("Add at least one valid email");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("email_campaigns").insert({
      user_id: user.id,
      subject: subject.trim(),
      message: message.trim(),
      audience_type: audience,
      recipients: audience === "manual" ? parsedManual : [],
      status: "draft",
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSubject("");
    setMessage("");
    setManualList("");
    toast.success("Campaign saved as draft");
    refresh();
  };

  const send = async (id: string) => {
    setSendingId(id);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Not signed in");
      const res = await sendCampaign({
        data: { campaignId: id },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      toast.success(`Sent ${res.sent} • Failed ${res.failed}`);
      refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to send");
      refresh();
    } finally {
      setSendingId(null);
    }
  };

  const remove = async (id: string) => {
    const { error } = await supabase
      .from("email_campaigns")
      .delete()
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Campaign deleted");
    refresh();
  };

  if (!appsLoading && !installed) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20 space-y-4">
        <Mail className="h-12 w-12 mx-auto text-muted-foreground" />
        <h1 className="text-2xl font-bold">Install Email Marketing first</h1>
        <p className="text-muted-foreground">
          Head to the App Store to install this app.
        </p>
        <Button asChild>
          <Link to="/dashboard/apps">Open App Store</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/dashboard">
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>
      </Button>

      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
          <Mail className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-display">Email Marketing</h1>
          <p className="text-sm text-muted-foreground">
            Compose campaigns and send them to your customers via Resend.
          </p>
        </div>
      </div>

      {/* Editor */}
      <Card className="border-border/60 shadow-soft">
        <CardHeader>
          <CardTitle className="text-base">New campaign</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Spring sale — 20% off everything"
              maxLength={200}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your message. Each line becomes a paragraph."
              rows={6}
              maxLength={5000}
            />
          </div>

          <div className="space-y-2">
            <Label>Audience</Label>
            <RadioGroup
              value={audience}
              onValueChange={(v) => setAudience(v as any)}
              className="grid sm:grid-cols-2 gap-3"
            >
              <Label
                htmlFor="aud-all"
                className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer ${audience === "all_customers" ? "border-primary bg-accent/40" : "border-border"}`}
              >
                <RadioGroupItem value="all_customers" id="aud-all" />
                <div className="space-y-1">
                  <div className="font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" /> All customers
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {customerCount === null
                      ? "Loading…"
                      : `${customerCount} unique customer email${customerCount === 1 ? "" : "s"} from past orders`}
                  </div>
                </div>
              </Label>
              <Label
                htmlFor="aud-manual"
                className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer ${audience === "manual" ? "border-primary bg-accent/40" : "border-border"}`}
              >
                <RadioGroupItem value="manual" id="aud-manual" />
                <div className="space-y-1">
                  <div className="font-medium">Manual list</div>
                  <div className="text-xs text-muted-foreground">
                    Paste emails separated by commas or newlines
                  </div>
                </div>
              </Label>
            </RadioGroup>
            {audience === "manual" && (
              <div className="space-y-1 pt-2">
                <Textarea
                  value={manualList}
                  onChange={(e) => setManualList(e.target.value)}
                  placeholder="alice@example.com, bob@example.com"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  {parsedManual.length} valid email
                  {parsedManual.length === 1 ? "" : "s"} detected
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button onClick={createDraft} disabled={saving}>
              <Plus className="h-4 w-4" />
              Save as draft
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* History */}
      <Card className="border-border/60 shadow-soft">
        <CardHeader>
          <CardTitle className="text-base">Campaign history</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Mail className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No campaigns yet. Compose one above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {campaigns.map((c) => (
                <div
                  key={c.id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-border/60 p-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium truncate">{c.subject}</p>
                      <StatusBadge status={c.status} />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {c.message}
                    </p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      <span>
                        {c.audience_type === "all_customers"
                          ? "All customers"
                          : `${c.recipients.length} recipients`}
                      </span>
                      {c.status === "sent" && (
                        <span>
                          ✓ {c.sent_count} sent
                          {c.failed_count > 0
                            ? ` • ${c.failed_count} failed`
                            : ""}
                        </span>
                      )}
                      {c.error && (
                        <span className="text-destructive truncate max-w-[300px]">
                          {c.error}
                        </span>
                      )}
                      <span>
                        {new Date(c.sent_at ?? c.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {c.status === "draft" && (
                      <Button
                        size="sm"
                        onClick={() => send(c.id)}
                        disabled={sendingId === c.id}
                      >
                        {sendingId === c.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                        Send
                      </Button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="ghost">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete campaign?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => remove(c.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: Campaign["status"] }) {
  if (status === "sent")
    return (
      <Badge variant="secondary" className="gap-1">
        <CheckCircle2 className="h-3 w-3" /> Sent
      </Badge>
    );
  if (status === "failed")
    return (
      <Badge variant="destructive" className="gap-1">
        <AlertCircle className="h-3 w-3" /> Failed
      </Badge>
    );
  if (status === "sending")
    return (
      <Badge variant="secondary" className="gap-1">
        <Loader2 className="h-3 w-3 animate-spin" /> Sending
      </Badge>
    );
  return (
    <Badge variant="outline" className="gap-1">
      <Clock className="h-3 w-3" /> Draft
    </Badge>
  );
}
