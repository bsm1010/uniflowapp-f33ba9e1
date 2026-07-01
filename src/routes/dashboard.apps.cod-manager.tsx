import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Wallet,
  ArrowLeft,
  Loader2,
  Plus,
  Download,
  Truck,
  CheckCircle2,
  PackageX,
  CircleDollarSign,
  Search,
  Pencil,
  Trash2,
  ChevronDown,
} from "lucide-react";
import * as XLSX from "xlsx";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { useCurrentStore } from "@/hooks/use-current-store";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice as fmtPrice } from "@/lib/storeTheme";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/dashboard/apps/cod-manager")({
  component: CodManagerPage,
  head: () => ({ meta: [{ title: "COD Manager — Fennecly" }] }),
});

type CodCollection = Tables<"cod_collections">;
type CodTransfer = Tables<"cod_transfers">;

const COMPANIES = ["ZR Express", "Yalidine", "Maystro", "Other"];

function CodManagerPage() {
  const { user } = useAuth();
  const { currentStore } = useCurrentStore();
  const currency = currentStore?.currency ?? "DZD";
  const formatPrice = (n: number) => fmtPrice(n, currency);

  const [tab, setTab] = useState<"transit" | "transfers" | "reports">("transit");
  const [collections, setCollections] = useState<CodCollection[]>([]);
  const [transfers, setTransfers] = useState<CodTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Filters
  const [filterCompany, setFilterCompany] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Collection form
  const [collectDialogOpen, setCollectDialogOpen] = useState(false);
  const [collectTarget, setCollectTarget] = useState<CodCollection | null>(null);
  const [collectRef, setCollectRef] = useState("");
  const [collectDate, setCollectDate] = useState(new Date().toISOString().slice(0, 10));

  // Transfer form
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [transferCompany, setTransferCompany] = useState("ZR Express");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferDate, setTransferDate] = useState(new Date().toISOString().slice(0, 10));
  const [transferRef, setTransferRef] = useState("");
  const [transferNotes, setTransferNotes] = useState("");
  const [savingTransfer, setSavingTransfer] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [cRes, tRes] = await Promise.all([
      supabase
        .from("cod_collections")
        .select("*")
        .eq("merchant_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("cod_transfers")
        .select("*")
        .eq("merchant_id", user.id)
        .order("transfer_date", { ascending: false }),
    ]);
    setCollections(cRes.data ?? []);
    setTransfers(tRes.data ?? []);
    setLoading(false);
  }, [user]);

  const syncOrders = useCallback(async () => {
    if (!user) return;
    setSyncing(true);

    const { data: existing } = await supabase
      .from("cod_collections")
      .select("order_id")
      .eq("merchant_id", user.id);

    const existingIds = new Set((existing ?? []).map((e) => e.order_id).filter(Boolean));

    const { data: orders } = await supabase
      .from("orders")
      .select("id, tracking_number, customer_name, total, delivery_type, created_at, status")
      .eq("store_owner_id", user.id)
      .not("tracking_number", "is", null);

    if (orders) {
      const toInsert = orders
        .filter((o) => !existingIds.has(o.id))
        .map((o) => ({
          merchant_id: user.id,
          order_id: o.id,
          delivery_company: o.delivery_type || "ZR Express",
          tracking_number: o.tracking_number,
          customer_name: o.customer_name,
          amount: Math.round(Number(o.total) || 0),
          status: o.status === "delivered" ? "delivered" : "in_transit",
        }));

      if (toInsert.length > 0) {
        await supabase.from("cod_collections").insert(toInsert);
      }
    }

    await load();
    setSyncing(false);
    toast.success("Orders synced");
  }, [user, load]);

  useEffect(() => {
    if (user) {
      void load();
      void syncOrders();
    }
  }, [user, load, syncOrders]);

  const filtered = useMemo(() => {
    let list = collections;
    if (filterCompany !== "all") list = list.filter((c) => c.delivery_company === filterCompany);
    if (filterStatus !== "all") list = list.filter((c) => c.status === filterStatus);
    return list;
  }, [collections, filterCompany, filterStatus]);

  const stats = useMemo(() => {
    const inTransit = collections
      .filter((c) => c.status === "in_transit")
      .reduce((s, c) => s + c.amount, 0);
    const delivered = collections
      .filter((c) => c.status === "delivered")
      .reduce((s, c) => s + c.amount, 0);
    const returned = collections
      .filter((c) => c.status === "returned")
      .reduce((s, c) => s + c.amount, 0);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const collectedThisMonth = collections
      .filter((c) => c.status === "collected" && c.actual_transfer_date && c.actual_transfer_date >= monthStart.slice(0, 10))
      .reduce((s, c) => s + c.amount, 0);

    return { inTransit, delivered, returned, collectedThisMonth };
  }, [collections]);

  const companyOwed = useMemo(() => {
    const map: Record<string, number> = {};
    for (const c of collections) {
      if (c.status === "in_transit" || c.status === "delivered") {
        map[c.delivery_company] = (map[c.delivery_company] ?? 0) + c.amount;
      }
    }
    for (const t of transfers) {
      map[t.delivery_company] = (map[t.delivery_company] ?? 0) - t.amount;
    }
    return map;
  }, [collections, transfers]);

  const monthlyReport = useMemo(() => {
    const months: Record<
      string,
      { shipped: number; delivered: number; returned: number; codExpected: number; codReceived: number }
    > = {};

    for (const c of collections) {
      const m = (c.created_at ?? "").slice(0, 7);
      if (!months[m]) months[m] = { shipped: 0, delivered: 0, returned: 0, codExpected: 0, codReceived: 0 };
      months[m].shipped += 1;
      if (c.status === "delivered") months[m].delivered += 1;
      if (c.status === "returned") months[m].returned += 1;
      if (c.status !== "returned") months[m].codExpected += c.amount;
    }
    for (const t of transfers) {
      const m = t.transfer_date.slice(0, 7);
      if (!months[m]) months[m] = { shipped: 0, delivered: 0, returned: 0, codExpected: 0, codReceived: 0 };
      months[m].codReceived += t.amount;
    }

    return Object.entries(months)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([month, v]) => ({ month, ...v, difference: v.codExpected - v.codReceived }));
  }, [collections, transfers]);

  const handleMarkCollected = async () => {
    if (!collectTarget) return;
    const { error } = await supabase
      .from("cod_collections")
      .update({
        status: "collected",
        actual_transfer_date: collectDate,
        transfer_reference: collectRef || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", collectTarget.id);
    if (error) return toast.error(error.message);
    toast.success("Marked as collected");
    setCollectDialogOpen(false);
    setCollectTarget(null);
    setCollectRef("");
    await load();
  };

  const handleStatusChange = async (id: string, status: string) => {
    const { error } = await supabase
      .from("cod_collections")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Status updated");
    await load();
  };

  const handleAddTransfer = async () => {
    if (!user) return;
    const amount = parseInt(transferAmount, 10);
    if (!amount || amount <= 0) return toast.error("Enter a valid amount");
    setSavingTransfer(true);
    const { error } = await supabase.from("cod_transfers").insert({
      merchant_id: user.id,
      delivery_company: transferCompany,
      amount,
      transfer_date: transferDate,
      reference: transferRef || null,
      notes: transferNotes || null,
    });
    if (error) {
      setSavingTransfer(false);
      return toast.error(error.message);
    }
    toast.success("Transfer recorded");
    setTransferDialogOpen(false);
    setTransferAmount("");
    setTransferRef("");
    setTransferNotes("");
    setSavingTransfer(false);
    await load();
  };

  const handleDeleteTransfer = async (id: string) => {
    const { error } = await supabase.from("cod_transfers").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Transfer deleted");
    await load();
  };

  const exportToExcel = () => {
    const data = filtered.map((c) => ({
      Customer: c.customer_name,
      "Delivery Company": c.delivery_company,
      "Tracking #": c.tracking_number,
      Amount: c.amount,
      Status: c.status,
      "Expected Date": c.expected_transfer_date,
      "Actual Date": c.actual_transfer_date,
      Reference: c.transfer_reference,
      Created: c.created_at,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "COD Collections");
    XLSX.writeFile(wb, `cod-collections-${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success("Exported to Excel");
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      in_transit: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      delivered: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
      collected: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      returned: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    };
    const labels: Record<string, string> = {
      in_transit: "In Transit",
      delivered: "Delivered",
      collected: "Collected",
      returned: "Returned",
    };
    return (
      <Badge variant="outline" className={cn("text-[10px] rounded-full", map[status])}>
        {labels[status] ?? status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="rounded-xl">
          <Link to="/dashboard/apps">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <PageHeader
          eyebrow="Algeria"
          title="COD Manager"
          description="Track cash on delivery payments and carrier reconciliation."
          icon={Wallet}
          gradient="from-amber-500 via-orange-500 to-red-500"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-xl p-1 w-fit">
        {([
          { key: "transit", label: "Cash in Transit", icon: Truck },
          { key: "transfers", label: "Received Transfers", icon: CircleDollarSign },
          { key: "reports", label: "Reports", icon: BarChart3 },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all",
              tab === t.key
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: Cash in Transit */}
      {tab === "transit" && (
        <>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-border/60">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="grid size-9 place-items-center rounded-xl bg-amber-500/10 text-amber-600">
                    <Truck className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">In Transit</p>
                    <p className="text-lg font-bold">{formatPrice(stats.inTransit)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="grid size-9 place-items-center rounded-xl bg-blue-500/10 text-blue-600">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Delivered (not collected)</p>
                    <p className="text-lg font-bold">{formatPrice(stats.delivered)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="grid size-9 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600">
                    <CircleDollarSign className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Collected this month</p>
                    <p className="text-lg font-bold">{formatPrice(stats.collectedThisMonth)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="grid size-9 place-items-center rounded-xl bg-red-500/10 text-red-600">
                    <PackageX className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Returned (lost)</p>
                    <p className="text-lg font-bold">{formatPrice(stats.returned)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <Select value={filterCompany} onValueChange={setFilterCompany}>
              <SelectTrigger className="w-[160px] rounded-xl">
                <SelectValue placeholder="Company" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All companies</SelectItem>
                {COMPANIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px] rounded-xl">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="in_transit">In Transit</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="collected">Collected</SelectItem>
                <SelectItem value="returned">Returned</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex-1" />
            <Button variant="outline" size="sm" className="rounded-xl" onClick={exportToExcel}>
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Export
            </Button>
            {syncing && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" /> Syncing...
              </span>
            )}
          </div>

          {/* Table */}
          <Card className="border-border/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/30">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Customer</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Company</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tracking</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Amount</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Expected</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                        No COD records found
                      </td>
                    </tr>
                  ) : (
                    filtered.map((c) => (
                      <tr key={c.id} className="border-b border-border/40 hover:bg-muted/20">
                        <td className="px-4 py-3 font-medium">{c.customer_name || "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{c.delivery_company}</td>
                        <td className="px-4 py-3 font-mono text-xs">{c.tracking_number || "—"}</td>
                        <td className="px-4 py-3 text-right font-semibold tabular-nums">
                          {formatPrice(c.amount)}
                        </td>
                        <td className="px-4 py-3 text-center">{statusBadge(c.status ?? "")}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {c.expected_transfer_date ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                                <ChevronDown className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {c.status !== "collected" && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setCollectTarget(c);
                                    setCollectDate(new Date().toISOString().slice(0, 10));
                                    setCollectRef("");
                                    setCollectDialogOpen(true);
                                  }}
                                >
                                  <CircleDollarSign className="h-3.5 w-3.5 mr-2" />
                                  Mark as collected
                                </DropdownMenuItem>
                              )}
                              {c.status !== "in_transit" && (
                                <DropdownMenuItem onClick={() => handleStatusChange(c.id, "in_transit")}>
                                  <Truck className="h-3.5 w-3.5 mr-2" />
                                  Mark in transit
                                </DropdownMenuItem>
                              )}
                              {c.status !== "delivered" && (
                                <DropdownMenuItem onClick={() => handleStatusChange(c.id, "delivered")}>
                                  <CheckCircle2 className="h-3.5 w-3.5 mr-2" />
                                  Mark delivered
                                </DropdownMenuItem>
                              )}
                              {c.status !== "returned" && (
                                <DropdownMenuItem onClick={() => handleStatusChange(c.id, "returned")}>
                                  <PackageX className="h-3.5 w-3.5 mr-2" />
                                  Mark returned
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* TAB 2: Received Transfers */}
      {tab === "transfers" && (
        <>
          <div className="flex justify-end">
            <Button className="rounded-xl" onClick={() => setTransferDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              تسجيل تحويل جديد
            </Button>
          </div>

          <Card className="border-border/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/30">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Company</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Amount</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Reference</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Notes</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transfers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                        No transfers recorded yet
                      </td>
                    </tr>
                  ) : (
                    transfers.map((t) => (
                      <tr key={t.id} className="border-b border-border/40 hover:bg-muted/20">
                        <td className="px-4 py-3">{t.transfer_date}</td>
                        <td className="px-4 py-3 text-muted-foreground">{t.delivery_company}</td>
                        <td className="px-4 py-3 text-right font-semibold tabular-nums">
                          {formatPrice(t.amount)}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">{t.reference || "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs max-w-[200px] truncate">
                          {t.notes || "—"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-destructive hover:text-destructive"
                            onClick={() => handleDeleteTransfer(t.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* TAB 3: Reports */}
      {tab === "reports" && (
        <>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <Card className="border-border/60">
              <CardContent className="p-5">
                <h3 className="font-semibold text-sm mb-4">What carriers owe you</h3>
                <div className="space-y-3">
                  {Object.entries(companyOwed)
                    .filter(([, v]) => v !== 0)
                    .sort(([, a], [, b]) => b - a)
                    .map(([company, amount]) => (
                      <div key={company} className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{company}</span>
                        <span
                          className={cn(
                            "text-sm font-bold tabular-nums",
                            amount > 0 ? "text-amber-600" : "text-emerald-600",
                          )}
                        >
                          {amount > 0 ? "+" : ""}
                          {formatPrice(amount)}
                        </span>
                      </div>
                    ))}
                  {Object.keys(companyOwed).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardContent className="p-5">
                <h3 className="font-semibold text-sm mb-4">Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total COD collections</span>
                    <span className="text-sm font-bold">{collections.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total COD amount</span>
                    <span className="text-sm font-bold">
                      {formatPrice(collections.reduce((s, c) => s + c.amount, 0))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total transfers received</span>
                    <span className="text-sm font-bold">
                      {formatPrice(transfers.reduce((s, t) => s + t.amount, 0))}
                    </span>
                  </div>
                  <div className="h-px bg-border/50" />
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Net balance</span>
                    <span
                      className={cn(
                        "text-sm font-bold",
                        collections.reduce((s, c) => s + c.amount, 0) -
                          transfers.reduce((s, t) => s + t.amount, 0) >= 0
                          ? "text-amber-600"
                          : "text-emerald-600",
                      )}
                    >
                      {formatPrice(
                        collections.reduce((s, c) => s + c.amount, 0) -
                          transfers.reduce((s, t) => s + t.amount, 0),
                      )}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/60 overflow-hidden">
            <CardContent className="p-5">
              <h3 className="font-semibold text-sm mb-4">Monthly reconciliation</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/60">
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">Month</th>
                      <th className="text-right px-3 py-2 font-medium text-muted-foreground">Shipped</th>
                      <th className="text-right px-3 py-2 font-medium text-muted-foreground">Delivered</th>
                      <th className="text-right px-3 py-2 font-medium text-muted-foreground">Returned</th>
                      <th className="text-right px-3 py-2 font-medium text-muted-foreground">COD Expected</th>
                      <th className="text-right px-3 py-2 font-medium text-muted-foreground">COD Received</th>
                      <th className="text-right px-3 py-2 font-medium text-muted-foreground">Difference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyReport.map((r) => (
                      <tr key={r.month} className="border-b border-border/40">
                        <td className="px-3 py-2 font-medium">{r.month}</td>
                        <td className="px-3 py-2 text-right">{r.shipped}</td>
                        <td className="px-3 py-2 text-right">{r.delivered}</td>
                        <td className="px-3 py-2 text-right">{r.returned}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{formatPrice(r.codExpected)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{formatPrice(r.codReceived)}</td>
                        <td
                          className={cn(
                            "px-3 py-2 text-right font-medium tabular-nums",
                            r.difference > 0 ? "text-amber-600" : r.difference < 0 ? "text-emerald-600" : "",
                          )}
                        >
                          {formatPrice(r.difference)}
                        </td>
                      </tr>
                    ))}
                    {monthlyReport.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">
                          No data yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button variant="outline" className="rounded-xl" onClick={exportToExcel}>
              <Download className="h-4 w-4 mr-1.5" />
              Export to Excel
            </Button>
          </div>
        </>
      )}

      {/* Collect Dialog */}
      <Dialog open={collectDialogOpen} onOpenChange={setCollectDialogOpen}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle>Mark as Collected</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {collectTarget && (
              <div className="rounded-lg bg-muted/30 p-3 text-sm">
                <p>
                  <span className="text-muted-foreground">Customer:</span> {collectTarget.customer_name}
                </p>
                <p>
                  <span className="text-muted-foreground">Amount:</span>{" "}
                  <strong>{formatPrice(collectTarget.amount)}</strong>
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label>Transfer date</Label>
              <Input
                type="date"
                value={collectDate}
                onChange={(e) => setCollectDate(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Reference (optional)</Label>
              <Input
                value={collectRef}
                onChange={(e) => setCollectRef(e.target.value)}
                placeholder="Transfer reference"
                className="rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCollectDialogOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleMarkCollected} className="rounded-xl">
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>تسجيل تحويل جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Delivery company</Label>
              <Select value={transferCompany} onValueChange={setTransferCompany}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMPANIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount (DA)</Label>
              <Input
                type="number"
                min="0"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                placeholder="0"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Transfer date</Label>
              <Input
                type="date"
                value={transferDate}
                onChange={(e) => setTransferDate(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Reference (optional)</Label>
              <Input
                value={transferRef}
                onChange={(e) => setTransferRef(e.target.value)}
                placeholder="Transfer reference"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Input
                value={transferNotes}
                onChange={(e) => setTransferNotes(e.target.value)}
                placeholder="Additional notes"
                className="rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferDialogOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleAddTransfer} disabled={savingTransfer} className="rounded-xl">
              {savingTransfer ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BarChart3(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="12" x2="12" y1="20" y2="10" />
      <line x1="18" x2="18" y1="20" y2="4" />
      <line x1="6" x2="6" y1="20" y2="16" />
    </svg>
  );
}
