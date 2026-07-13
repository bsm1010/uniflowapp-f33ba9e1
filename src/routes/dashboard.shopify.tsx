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
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Link2,
  LinkIcon,
  Loader2,
  RefreshCw,
  ShoppingBag,
  Store,
  Unlink,
  ArrowUpDown,
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
  const [domain, setDomain] = useState("");
  const [accessToken, setAccessToken] = useState("");
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

      // Create sync log
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
            // Check if already mapped
            const { data: existingMap } = await supabase
              .from("shopify_product_map" as any)
              .select("fennecly_product_id")
              .eq("user_id", user.id)
              .eq("shopify_product_id", sp.id)
              .single();

            if (existingMap) {
              // Update existing Fennecly product
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
              // Create new Fennecly product
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
                // Insert order items
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

      // Update sync log
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

      // Update connection last sync
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Store}
        title="Shopify Integration"
        description="Sync products and orders between Shopify and Fennecly"
        gradient="from-green-500/20 to-emerald-500/20"
        actions={
          connection ? (
            <div className="flex gap-2">
              <Button
                onClick={handleSync}
                disabled={syncing}
                className="gap-2"
              >
                {syncing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                {syncing ? "Syncing..." : "Sync Now"}
              </Button>
              <Button variant="destructive" onClick={handleDisconnect}>
                <Unlink className="h-4 w-4 mr-1.5" />
                Disconnect
              </Button>
            </div>
          ) : (
              <Dialog open={connectOpen} onOpenChange={setConnectOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md">
                  <LinkIcon className="h-4 w-4" />
                  Connect Shopify Store
                </Button>
              </DialogTrigger>
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
                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
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
          )
        }
      />

      {connection ? (
        <>
          {/* Connection Status */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white">
                    <ShoppingBag className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{connection.shop_name || connection.shop_domain}</h3>
                    <p className="text-sm text-muted-foreground">
                      {connection.shop_domain}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right text-sm">
                    <p className="text-muted-foreground">Last sync</p>
                    <p className="font-medium">
                      {connection.last_sync_at
                        ? new Date(
                            connection.last_sync_at,
                          ).toLocaleString()
                        : "Never"}
                    </p>
                  </div>
                  <Badge variant="outline" className="gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-600">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                    </span>
                    Connected
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sync Controls */}
          <Card>
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
                  <p className="text-sm text-muted-foreground">
                    Import products from Shopify and export from Fennecly
                  </p>
                </div>
                <Switch checked={connection.sync_products} disabled />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Orders</p>
                  <p className="text-sm text-muted-foreground">
                    Import Shopify orders into Fennecly
                  </p>
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
          <Card>
            <CardHeader>
              <CardTitle>Sync History</CardTitle>
            </CardHeader>
            <CardContent>
              {syncLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No sync history yet. Click "Sync Now" to start.
                </p>
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
                          <TableCell className="capitalize">
                            {log.sync_type}
                          </TableCell>
                          <TableCell className="capitalize">
                            {log.direction}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                log.status === "completed"
                                  ? "default"
                                  : log.status === "failed"
                                    ? "destructive"
                                    : "secondary"
                              }
                            >
                              {log.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{log.items_processed}</TableCell>
                          <TableCell>{log.items_created}</TableCell>
                          <TableCell>{log.items_updated}</TableCell>
                          <TableCell>{log.items_failed}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(log.started_at).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        /* Not Connected State */
        <Card className="border-border/60">
          <CardContent className="p-16 text-center">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-green-50 flex items-center justify-center mb-5">
              <Store className="h-8 w-8 text-green-500" />
            </div>
            <h3 className="text-xl font-bold tracking-tight mb-2">
              Connect Your Shopify Store
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6 leading-relaxed">
              Import your Shopify products and orders into Fennecly. Sync works
              bidirectionally — changes in either platform stay in sync.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Dialog open={connectOpen} onOpenChange={setConnectOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md">
                    <LinkIcon className="h-4 w-4" />
                    Connect Shopify Store
                  </Button>
                </DialogTrigger>
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
                        Test
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
              <Button variant="outline" asChild>
                <a
                  href="https://shopify.dev/docs/apps/custom-apps"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-1.5" />
                  How to create a Shopify Custom App
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export const Route = createFileRoute("/dashboard/shopify")({
  component: ShopifyPage,
});
