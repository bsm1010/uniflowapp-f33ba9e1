import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  CheckCircle2,
  ExternalLink,
  LinkIcon,
  Loader2,
  RefreshCw,
  ShoppingBag,
  Store,
  Unlink,
  ArrowUpDown,
  Shield,
  Zap,
  Users,
  HelpCircle,
  Link,
  Settings,
  RotateCcw,
  Package,
  ShoppingCart,
  Box,
  UserCheck,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  testShopifyConnection,
  fetchAllShopifyProducts,
  fetchAllShopifyOrders,
  type ShopifyConnection,
} from "@/lib/shopify";

type SyncLog = {
  id: string;
  sync_type: string;
  direction: string;
  status: string;
  items_processed: number;
  items_created: number;
  items_updated: number;
  items_failed: number;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
};

function ShopifyPage() {
  const { t } = useTranslation();
  const [connection, setConnection] = useState<ShopifyConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    shopName?: string;
    error?: string;
  } | null>(null);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncType, setSyncType] = useState<"products" | "orders" | "full">(
    "full",
  );
  const [connectOpen, setConnectOpen] = useState(false);
  const [shopifyUrl, setShopifyUrl] = useState("");
  const [shopifyToken, setShopifyToken] = useState("");

  const loadConnection = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("shopify_connections" as any)
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();

    setConnection(data as unknown as ShopifyConnection | null);
    setLoading(false);
  }, []);

  const loadSyncLogs = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("shopify_sync_log" as any)
      .select("*")
      .eq("user_id", user.id)
      .order("started_at", { ascending: false })
      .limit(10);

    setSyncLogs((data as unknown as SyncLog[]) || []);
  }, []);

  useEffect(() => {
    loadConnection();
    loadSyncLogs();
  }, [loadConnection, loadSyncLogs]);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await testShopifyConnection(shopifyUrl, shopifyToken);
    setTestResult(result);
    setTesting(false);
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const normalized = shopifyUrl
        .replace(/^https?:\/\//, "")
        .replace(/\.myshopify\.com.*$/, "")
        .replace(/\/$/, "");

      const fullDomain = normalized.includes(".myshopify.com")
        ? normalized
        : `${normalized}.myshopify.com`;

      const result = await testShopifyConnection(fullDomain, shopifyToken);
      if (!result.ok) {
        setTestResult(result);
        setConnecting(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: storeRows } = await supabase
        .from("stores")
        .select("id, slug, owner_id")
        .eq("owner_id", user.id)
        .limit(1)
        .single();

      if (!storeRows) return;

      const { error } = await supabase
        .from("shopify_connections" as any)
        .upsert(
          {
            user_id: user.id,
            store_id: storeRows.id,
            shop_domain: fullDomain,
            access_token: shopifyToken,
            shop_name: result.shopName || fullDomain,
            is_active: true,
            sync_products: true,
            sync_orders: true,
          },
          { onConflict: "user_id,shop_domain" },
        );

      if (!error) {
        setConnectOpen(false);
        setShopifyUrl("");
        setShopifyToken("");
        await loadConnection();
      }
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!connection) return;
    await supabase
      .from("shopify_connections" as any)
      .update({ is_active: false })
      .eq("id", connection.id);
    setConnection(null);
  };

  const handleSync = async () => {
    if (!connection) return;
    setSyncing(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: logEntry } = await supabase
        .from("shopify_sync_log" as any)
        .insert({
          user_id: user.id,
          sync_type: syncType,
          direction: "bidirectional",
          status: "running",
        })
        .select()
        .single();

      let processed = 0;
      let created = 0;
      let updated = 0;
      let failed = 0;

      if (syncType === "products" || syncType === "full") {
        const products = await fetchAllShopifyProducts();
        processed += products.length;

        for (const sp of products) {
          try {
            const { data: existingMap } = await supabase
              .from("shopify_product_map" as any)
              .select("fennecly_product_id")
              .eq("user_id", user.id)
              .eq("shopify_product_id", sp.id)
              .single();

            if (existingMap) {
              const priceDZD = parseFloat(sp.variants[0]?.price || "0") * 10;
              await supabase
                .from("products")
                .update({
                  name: sp.title,
                  description: sp.body_html || "",
                  price: priceDZD,
                  images: sp.images.map((img) => img.src),
                  status: sp.status === "active" ? "published" : "draft",
                })
                .eq("id", (existingMap as any).fennecly_product_id);

              await supabase
                .from("shopify_product_map" as any)
                .update({ last_synced_at: new Date().toISOString() })
                .eq("user_id", user.id)
                .eq("shopify_product_id", sp.id);

              updated++;
            } else {
              const priceDZD = parseFloat(sp.variants[0]?.price || "0") * 10;
              const { data: newProduct, error: prodError } = await supabase
                .from("products")
                .insert({
                  store_id: connection.store_id,
                  user_id: user.id,
                  name: sp.title,
                  description: sp.body_html || "",
                  price: priceDZD,
                  images: sp.images.map((img) => img.src),
                  status: sp.status === "active" ? "published" : "draft",
                  stock: sp.variants.reduce(
                    (sum, v) => sum + (v.inventory_quantity || 0),
                    0,
                  ),
                })
                .select()
                .single();

              if (!prodError && newProduct) {
                await supabase.from("shopify_product_map" as any).insert({
                  user_id: user.id,
                  shopify_product_id: sp.id,
                  fennecly_product_id: newProduct.id,
                  sync_direction: "bidirectional",
                });
                created++;
              } else {
                failed++;
              }
            }
          } catch {
            failed++;
          }
        }
      }

      if (syncType === "orders" || syncType === "full") {
        const orders = await fetchAllShopifyOrders();
        processed += orders.length;

        for (const so of orders) {
          try {
            const { data: existingMap } = await supabase
              .from("shopify_order_map" as any)
              .select("fennecly_order_id")
              .eq("user_id", user.id)
              .eq("shopify_order_id", so.id)
              .single();

            if (!existingMap) {
              const totalDZD = parseFloat(so.total_price) * 10;

              const { data: newOrder, error: orderError } = await supabase
                .from("orders")
                .insert({
                  store_owner_id: user.id,
                  store_id: connection.store_id,
                  store_slug: "",
                  customer_name:
                    so.customer?.first_name
                      ? `${so.customer.first_name} ${so.customer.last_name || ""}`
                      : so.shipping_address?.name || "Shopify Customer",
                  customer_phone:
                    so.phone || so.shipping_address?.phone || "",
                  customer_email: so.email || "",
                  shipping_wilaya: so.shipping_address?.province || "",
                  shipping_city: so.shipping_address?.city || "",
                  shipping_address: so.shipping_address?.address1 || "",
                  shipping_postal_code: so.shipping_address?.zip || "",
                  shipping_country: so.shipping_address?.country || "Algeria",
                  total: totalDZD,
                  subtotal: totalDZD,
                  status:
                    so.fulfillment_status === "fulfilled"
                      ? "delivered"
                      : "pending",
                  payment_method:
                    so.financial_status === "paid" ? "online" : "cod",
                  notes: `[Shopify #${so.order_number}] ${so.note || ""}`,
                  source: "shopify",
                })
                .select("id")
                .single();

              if (!orderError && newOrder) {
                const orderItems = so.line_items.map((item) => ({
                  order_id: newOrder.id,
                  product_id: null,
                  product_name: item.title,
                  quantity: item.quantity,
                  unit_price: parseFloat(item.price),
                  image_url: null,
                }));
                await supabase.from("order_items").insert(orderItems);
                await supabase.from("shopify_order_map" as any).insert({
                  user_id: user.id,
                  shopify_order_id: so.id,
                  fennecly_order_id: newOrder.id,
                });
                created++;
              } else {
                failed++;
              }
            }
          } catch {
            failed++;
          }
        }
      }

      if (logEntry) {
        await supabase
          .from("shopify_sync_log" as any)
          .update({
            status: failed > 0 ? "failed" : "completed",
            items_processed: processed,
            items_created: created,
            items_updated: updated,
            items_failed: failed,
            completed_at: new Date().toISOString(),
          })
          .eq("id", (logEntry as any).id);
      }

      await supabase
        .from("shopify_connections" as any)
        .update({ last_sync_at: new Date().toISOString() })
        .eq("id", connection.id);

      await loadConnection();
      await loadSyncLogs();
    } finally {
      setSyncing(false);
    }
  };

  const ConnectDialog = () => (
    <Dialog open={connectOpen} onOpenChange={setConnectOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect Your Shopify Store</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Shopify Store URL</Label>
            <Input
              placeholder="your-store.myshopify.com"
              value={shopifyUrl}
              onChange={(e) => setShopifyUrl(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Access Token</Label>
            <Input
              type="password"
              placeholder="shpat_xxxxxxxxxxxxxxxx"
              value={shopifyToken}
              onChange={(e) => setShopifyToken(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Create a Custom App in Shopify Admin &gt; Settings &gt;
              Apps and sales channels &gt; Develop apps. Grant
              read_products, read_orders, write_products, write_orders
              scopes.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleTest}
              disabled={testing || !shopifyUrl || !shopifyToken}
            >
              {testing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-1.5" />
              )}
              Test Connection
            </Button>
            <Button
              onClick={handleConnect}
              disabled={connecting || !shopifyUrl || !shopifyToken}
            >
              {connecting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              ) : (
                <LinkIcon className="h-4 w-4 mr-1.5" />
              )}
              Connect
            </Button>
          </div>
          {testResult && (
            <div
              className={`p-3 rounded-lg text-sm ${
                testResult.ok
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {testResult.ok
                ? `Connected to ${testResult.shopName}`
                : `Failed: ${testResult.error}`}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (connection) {
    return (
      <div className="space-y-6">
        {/* Connected Header */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 text-white px-8 py-6">
          <div className="absolute inset-0 rounded-2xl opacity-20 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 80% 60%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="grid place-items-center h-14 w-14 rounded-2xl bg-white/15 backdrop-blur border border-white/20">
                <Store className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight">Shopify Integration</h1>
                <p className="text-sm text-white/80">Sync products and orders between Shopify and Fennecly</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-200">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                Connected
              </Badge>
              <Button onClick={handleSync} disabled={syncing} variant="secondary" className="gap-2">
                {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                {syncing ? "Syncing..." : "Sync Now"}
              </Button>
              <Button variant="destructive" onClick={handleDisconnect}>
                <Unlink className="h-4 w-4 mr-1.5" />
                Disconnect
              </Button>
            </div>
          </div>
        </section>

        {/* Connection Info */}
        <Card className="border-border/60">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white">
                  <ShoppingBag className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">{connection.shop_name || connection.shop_domain}</h3>
                  <p className="text-sm text-muted-foreground">{connection.shop_domain}</p>
                </div>
              </div>
              <div className="text-right text-sm">
                <p className="text-muted-foreground">Last sync</p>
                <p className="font-medium">
                  {connection.last_sync_at ? new Date(connection.last_sync_at).toLocaleString() : "Never"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sync Settings */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpDown className="h-5 w-5" />
              Sync Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Products</p>
                <p className="text-sm text-muted-foreground">Import products from Shopify and export from Fennecly</p>
              </div>
              <Switch checked={connection.sync_products} disabled />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Orders</p>
                <p className="text-sm text-muted-foreground">Import Shopify orders into Fennecly</p>
              </div>
              <Switch checked={connection.sync_orders} disabled />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Label>Sync type:</Label>
              <div className="flex gap-2">
                {(["products", "orders", "full"] as const).map((type) => (
                  <Button
                    key={type}
                    variant={syncType === type ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSyncType(type)}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sync History */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>Sync History</CardTitle>
          </CardHeader>
          <CardContent>
            {syncLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No sync history yet. Click "Sync Now" to start.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Direction</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Processed</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead>Failed</TableHead>
                      <TableHead>Started</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {syncLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="capitalize">{log.sync_type}</TableCell>
                        <TableCell className="capitalize">{log.direction}</TableCell>
                        <TableCell>
                          <Badge variant={log.status === "completed" ? "default" : log.status === "failed" ? "destructive" : "secondary"}>
                            {log.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{log.items_processed}</TableCell>
                        <TableCell>{log.items_created}</TableCell>
                        <TableCell>{log.items_updated}</TableCell>
                        <TableCell>{log.items_failed}</TableCell>
                        <TableCell className="text-muted-foreground">{new Date(log.started_at).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not connected — rich onboarding page
  return (
    <div className="space-y-6">
      <ConnectDialog />

      {/* Header */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 text-white px-8 py-6">
        <div className="absolute inset-0 rounded-2xl opacity-20 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 80% 60%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="grid place-items-center h-14 w-14 rounded-2xl bg-white/15 backdrop-blur border border-white/20">
              <Store className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight">Shopify Integration</h1>
              <p className="text-sm text-white/80">Sync products and orders between Shopify and Fennecly</p>
            </div>
          </div>
          <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 gap-2" asChild>
            <a href="https://shopify.dev/docs/api" target="_blank" rel="noopener noreferrer">
              Documentation <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </section>

      {/* Hero Section */}
      <Card className="border-border/60 overflow-hidden">
        <CardContent className="p-8 md:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div className="space-y-6">
              <Badge variant="secondary" className="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 px-3 py-1 text-xs font-semibold">
                Step 1 of 3
              </Badge>
              <h2 className="text-4xl font-extrabold tracking-tight leading-tight">
                Connect your{" "}
                <span className="text-violet-600">Shopify</span>
                <br />
                store in minutes
              </h2>
              <p className="text-muted-foreground leading-relaxed max-w-lg">
                Sync products, orders, inventory and customers automatically
                between Shopify and Fennecly. No manual work, no hassle.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  size="lg"
                  onClick={() => setConnectOpen(true)}
                  className="gap-2 bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-lg"
                >
                  <LinkIcon className="h-5 w-5" />
                  Connect Shopify Store
                </Button>
                <Button variant="outline" size="lg" className="px-6 py-3 rounded-lg gap-2" asChild>
                  <a href="https://shopify.dev/docs/apps/custom-apps" target="_blank" rel="noopener noreferrer">
                    <HelpCircle className="h-5 w-5" />
                    Need help setting up?
                  </a>
                </Button>
              </div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                🔒 Secure connection via Shopify API. You can disconnect anytime.
              </p>
            </div>

            {/* Right — Visual */}
            <div className="hidden lg:flex items-center justify-center gap-4">
              <div className="h-20 w-20 rounded-2xl border border-border/60 bg-white dark:bg-card flex items-center justify-center shadow-sm">
                <img src="/icons/Shopify-logo.png" alt="Shopify" className="h-12 w-12 object-contain" />
              </div>
              <div className="flex flex-col items-center gap-1">
                <ArrowRight className="h-5 w-5 text-violet-400" />
                <div className="h-px w-8 bg-dashed border-t border-violet-300" />
              </div>
              <div className="h-20 w-20 rounded-2xl bg-violet-600 flex items-center justify-center shadow-sm">
                <RotateCcw className="h-9 w-9 text-white" />
              </div>
              <div className="flex flex-col items-center gap-1">
                <ArrowRight className="h-5 w-5 text-violet-400" />
                <div className="h-px w-8 bg-dashed border-t border-violet-300" />
              </div>
              <div className="h-20 w-20 rounded-2xl border-2 border-violet-600 bg-white dark:bg-card flex items-center justify-center shadow-sm">
                <span className="text-2xl font-bold text-violet-600">F</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Zap, label: "Real-time Sync", desc: "Changes sync instantly" },
          { icon: Shield, label: "Reliable & Secure", desc: "Built on Shopify API" },
          { icon: Users, label: "Trusted by stores", desc: "Used by 1,000+ stores" },
        ].map((stat) => (
          <div key={stat.label} className="flex items-center gap-4 p-5 rounded-xl border border-border/60 bg-card">
            <div className="h-10 w-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
              <stat.icon className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <p className="font-semibold text-sm">{stat.label}</p>
              <p className="text-xs text-muted-foreground">{stat.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* How it works */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link className="h-5 w-5 text-violet-600" />
              How it works
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-0">
              {[
                {
                  step: 1,
                  icon: Link,
                  title: "Connect your Shopify store",
                  desc: "Authorize Fennecly to access your store securely via Shopify.",
                },
                {
                  step: 2,
                  icon: Settings,
                  title: "Choose what to sync",
                  desc: "Select the data you want to sync — products, orders, inventory and more.",
                },
                {
                  step: 3,
                  icon: RotateCcw,
                  title: "Start automatic syncing",
                  desc: "We'll handle the rest. Your data stays in sync automatically.",
                },
              ].map((item, i) => (
                <div key={item.step} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="h-8 w-8 rounded-full bg-violet-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
                      {item.step}
                    </div>
                    {i < 2 && <div className="w-px flex-1 bg-border my-2" />}
                  </div>
                  <div className="pb-8">
                    <div className="flex items-center gap-3 mb-1">
                      <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                        <item.icon className="h-4 w-4 text-emerald-600" />
                      </div>
                      <p className="font-semibold text-sm">{item.title}</p>
                    </div>
                    <p className="text-sm text-muted-foreground ml-11">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* What gets synced */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Box className="h-5 w-5 text-violet-600" />
              What gets synced
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { icon: Store, title: "Products", desc: "Sync products, variants, collections and images" },
              { icon: ShoppingCart, title: "Orders", desc: "Import orders and keep them updated" },
              { icon: Package, title: "Inventory", desc: "Keep stock levels in sync in real-time" },
              { icon: UserCheck, title: "Customers (Optional)", desc: "Sync customer profiles and details" },
            ].map((item) => (
              <div key={item.title} className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                <div className="h-10 w-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center shrink-0">
                  <item.icon className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
                <div className="h-7 w-7 rounded-full bg-violet-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-4 w-4 text-white" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* FAQ */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-violet-600" />
              Frequently asked questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="q1">
                <AccordionTrigger className="text-sm font-medium">
                  Do I need a Shopify plan to connect?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  Yes, you need at least a Basic Shopify plan to use the API integration.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q2">
                <AccordionTrigger className="text-sm font-medium">
                  Can I disconnect my store anytime?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  Yes, you can disconnect your Shopify store at any time from this page. Your data in Fennecly will remain.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q3">
                <AccordionTrigger className="text-sm font-medium">
                  Does it sync in real-time?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  Yes, changes made in either Shopify or Fennecly sync automatically within seconds via webhooks.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Security */}
        <div className="rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-8 flex flex-col items-center text-center text-white">
          <div className="h-16 w-16 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center mb-5">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-xl font-bold mb-2">Your data is safe with us</h3>
          <p className="text-sm text-white/80 max-w-sm leading-relaxed mb-4">
            We use Shopify's secure API and never store your password.
          </p>
          <a
            href="https://shopify.dev/docs/api/usage/security"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-violet-200 underline hover:text-white transition-colors"
          >
            Learn more about security →
          </a>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-8 rounded-2xl border border-border/60 bg-card">
        <p className="font-bold text-sm mb-1">💬 Need help?</p>
        <p className="text-sm text-muted-foreground mb-3">Our support team is here for you.</p>
        <a
          href="mailto:support@fennecly.online"
          className="text-sm text-violet-600 font-semibold hover:underline"
        >
          Contact Support →
        </a>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/dashboard/shopify")({
  component: ShopifyPage,
});
