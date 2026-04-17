import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Building2,
  Check,
  Clock,
  CreditCard,
  Smartphone,
  Sparkles,
  Upload,
  XCircle,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard/upgrade")({
  component: UpgradePage,
  head: () => ({ meta: [{ title: "Upgrade plan — Storely" }] }),
});

const PLANS = [
  {
    id: "monthly" as const,
    name: "Monthly",
    price: 1500,
    cadence: "/ month",
    description: "Perfect to test the waters and pay as you go.",
    perks: [
      "Unlimited products",
      "Custom storefront themes",
      "Order management",
      "Email support",
    ],
  },
  {
    id: "yearly" as const,
    name: "Yearly",
    price: 14000,
    cadence: "/ year",
    description: "Save over 20% — billed once a year.",
    perks: [
      "Everything in Monthly",
      "2 months free",
      "Priority support",
      "Early access to new features",
    ],
    highlight: true,
  },
];

const CCP_NUMBER = "0012345678 91";
const CCP_NAME = "STORELY SARL";
const CCP_KEY = "12";

type Submission = {
  id: string;
  plan: string;
  amount: number;
  payment_method: string;
  status: string;
  created_at: string;
};

function UpgradePage() {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [plan, setPlan] = useState<"monthly" | "yearly">("yearly");
  const [method, setMethod] = useState<"ccp" | "baridimob">("baridimob");
  const [amount, setAmount] = useState<string>("14000");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  useEffect(() => {
    setAmount(String(plan === "yearly" ? 14000 : 1500));
  }, [plan]);

  const loadSubmissions = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("payment_submissions")
      .select("id, plan, amount, payment_method, status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);
    setSubmissions(data ?? []);
  };

  useEffect(() => {
    loadSubmissions();
  }, [user]);

  const copy = async (value: string, label: string) => {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!file) {
      toast.error("Please upload your payment screenshot");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Proof must be an image");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB");
      return;
    }
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }

    setSubmitting(true);
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const path = `${user.id}/${Date.now()}-${plan}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from("payment-proofs")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (upErr) {
      setSubmitting(false);
      toast.error(upErr.message);
      return;
    }

    const { error: insertErr } = await supabase
      .from("payment_submissions")
      .insert({
        user_id: user.id,
        plan,
        amount: numAmount,
        payment_method: method,
        proof_url: path,
      });

    setSubmitting(false);
    if (insertErr) {
      toast.error(insertErr.message);
      return;
    }

    toast.success("Payment submitted successfully. Waiting for admin approval.");
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
    loadSubmissions();
  };

  const selectedPlan = PLANS.find((p) => p.id === plan)!;

  const pendingSubmission = submissions.find((s) => s.status === "pending");

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <PageHeader
        eyebrow="Billing"
        title="Upgrade your plan"
        description="Choose a plan, send payment via CCP or BaridiMob, then upload your proof. We'll activate your subscription after review."
      />

      {pendingSubmission && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 flex items-start gap-3">
          <Clock className="size-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-foreground">
              Payment under review
            </p>
            <p className="text-muted-foreground mt-0.5">
              Your {pendingSubmission.plan} plan payment of{" "}
              {Number(pendingSubmission.amount).toLocaleString()} DZD is awaiting
              admin approval. You'll be notified once it's activated.
            </p>
          </div>
        </div>
      )}
      {/* Plans */}
      <div className="grid gap-4 md:grid-cols-2">
        {PLANS.map((p) => {
          const active = plan === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setPlan(p.id)}
              className={`text-left rounded-2xl border p-6 transition-all ${
                active
                  ? "border-primary bg-primary/5 shadow-soft ring-2 ring-primary/30"
                  : "border-border/60 bg-card hover:border-border"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">{p.name}</h3>
                    {p.highlight && (
                      <Badge className="bg-gradient-brand text-brand-foreground border-0">
                        Best value
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {p.description}
                  </p>
                </div>
                <div
                  className={`grid size-6 place-items-center rounded-full border ${
                    active
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-border"
                  }`}
                >
                  {active && <Check className="size-3.5" />}
                </div>
              </div>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-3xl font-semibold tracking-tight">
                  {p.price.toLocaleString()} DZD
                </span>
                <span className="text-sm text-muted-foreground">{p.cadence}</span>
              </div>
              <ul className="mt-5 space-y-2">
                {p.perks.map((perk) => (
                  <li
                    key={perk}
                    className="flex items-center gap-2 text-sm text-foreground/80"
                  >
                    <Check className="size-4 text-primary shrink-0" />
                    {perk}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Payment info */}
        <Card className="border-border/60 shadow-soft">
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
                <Building2 className="size-5" />
              </div>
              <div>
                <h3 className="font-semibold">Payment details</h3>
                <p className="text-sm text-muted-foreground">
                  Send {selectedPlan.price.toLocaleString()} DZD using either
                  method below.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  CCP Number
                </span>
                <button
                  type="button"
                  onClick={() => copy(CCP_NUMBER, "CCP number")}
                  className="text-xs text-primary hover:underline"
                >
                  Copy
                </button>
              </div>
              <p className="font-mono text-base font-semibold tracking-wider">
                {CCP_NUMBER} <span className="text-muted-foreground">CLE {CCP_KEY}</span>
              </p>

              <Separator />

              <div className="flex items-center justify-between gap-3">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  Account name
                </span>
                <button
                  type="button"
                  onClick={() => copy(CCP_NAME, "Account name")}
                  className="text-xs text-primary hover:underline"
                >
                  Copy
                </button>
              </div>
              <p className="font-medium">{CCP_NAME}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border/60 p-3 flex items-start gap-3">
                <div className="grid size-8 place-items-center rounded-md bg-primary/10 text-primary shrink-0">
                  <CreditCard className="size-4" />
                </div>
                <div className="text-sm">
                  <p className="font-medium">CCP</p>
                  <p className="text-muted-foreground text-xs">
                    Pay at any post office.
                  </p>
                </div>
              </div>
              <div className="rounded-lg border border-border/60 p-3 flex items-start gap-3">
                <div className="grid size-8 place-items-center rounded-md bg-primary/10 text-primary shrink-0">
                  <Smartphone className="size-4" />
                </div>
                <div className="text-sm">
                  <p className="font-medium">BaridiMob</p>
                  <p className="text-muted-foreground text-xs">
                    Transfer instantly from the app to the same CCP.
                  </p>
                </div>
              </div>
            </div>

            <ol className="space-y-2 text-sm text-foreground/80 list-decimal list-inside">
              <li>Send payment using BaridiMob or CCP.</li>
              <li>Take a screenshot of the payment confirmation.</li>
              <li>Upload it in the form and submit.</li>
            </ol>
          </CardContent>
        </Card>

        {/* Submission form */}
        <Card className="border-border/60 shadow-soft">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Sparkles className="size-5" />
                </div>
                <div>
                  <h3 className="font-semibold">Submit payment proof</h3>
                  <p className="text-sm text-muted-foreground">
                    We'll review and activate your plan within 24h.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Plan</Label>
                  <div className="flex rounded-md border border-input bg-background p-1">
                    {PLANS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPlan(p.id)}
                        className={`flex-1 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                          plan === p.id
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Payment method</Label>
                  <div className="flex rounded-md border border-input bg-background p-1">
                    <button
                      type="button"
                      onClick={() => setMethod("ccp")}
                      className={`flex-1 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                        method === "ccp"
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      CCP
                    </button>
                    <button
                      type="button"
                      onClick={() => setMethod("baridimob")}
                      className={`flex-1 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                        method === "baridimob"
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      BaridiMob
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount sent (DZD)</Label>
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  step="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="14000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="proof">Payment screenshot</Label>
                <label
                  htmlFor="proof"
                  className="flex items-center gap-3 rounded-md border border-dashed border-border/80 bg-muted/30 px-3 py-3 cursor-pointer hover:border-primary/60 transition-colors"
                >
                  <div className="grid size-9 place-items-center rounded-md bg-background border border-border/60">
                    <Upload className="size-4" />
                  </div>
                  <div className="text-sm min-w-0">
                    {file ? (
                      <>
                        <p className="font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024).toFixed(0)} KB · click to change
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="font-medium">Upload your screenshot</p>
                        <p className="text-xs text-muted-foreground">
                          PNG or JPG, up to 5MB
                        </p>
                      </>
                    )}
                  </div>
                </label>
                <input
                  id="proof"
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={submitting}
              >
                {submitting ? "Submitting…" : "Submit for review"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Recent submissions */}
      {submissions.length > 0 && (
        <Card className="border-border/60 shadow-soft">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Recent submissions</h3>
            <div className="space-y-3">
              {submissions.map((s) => {
                const isPending = s.status === "pending";
                const isApproved = s.status === "approved";
                const Icon = isApproved ? Check : isPending ? Clock : XCircle;
                const color = isApproved
                  ? "text-emerald-600 bg-emerald-500/10"
                  : isPending
                    ? "text-amber-600 bg-amber-500/10"
                    : "text-destructive bg-destructive/10";
                return (
                  <div
                    key={s.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border/60 p-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`grid size-9 place-items-center rounded-md ${color}`}>
                        <Icon className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium capitalize">
                          {s.plan} · {Number(s.amount).toLocaleString()} DZD
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(s.created_at).toLocaleString()} ·{" "}
                          {s.payment_method.toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {s.status}
                    </Badge>
                  </div>
                );
              })}
              {submissions.some((s) => s.status === "pending") && (
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm text-foreground/80">
                  <strong>Your payment is under review.</strong> We will activate
                  your subscription after confirmation.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <p className="text-center text-xs text-muted-foreground">
        Need help?{" "}
        <Link to="/dashboard/settings" className="underline hover:text-foreground">
          Contact support
        </Link>
      </p>
    </div>
  );
}
