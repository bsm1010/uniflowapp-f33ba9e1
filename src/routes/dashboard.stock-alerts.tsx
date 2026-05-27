import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, AlertTriangle, Save } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { PageHeader, EmptyState } from "@/components/dashboard/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Product = Tables<"products">;

export const Route = createFileRoute("/dashboard/stock-alerts")({
  component: StockAlertsPage,
  head: () => ({ meta: [{ title: "Stock Alerts — Fennecly" }] }),
});

function StockAlertsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [thresholds, setThresholds] = useState<Record<string, number>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("user_id", user.id)
      .order("stock", { ascending: true });
    const list = data ?? [];
    setProducts(list);
    const map: Record<string, number> = {};
    for (const p of list) map[p.id] = p.low_stock_threshold ?? 5;
    setThresholds(map);
  };

  useEffect(() => {
    if (user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const saveThreshold = async (id: string) => {
    setSavingId(id);
    const { error } = await supabase
      .from("products")
      .update({ low_stock_threshold: thresholds[id] })
      .eq("id", id);
    setSavingId(null);
    if (error) {
      toast.error("Failed to save");
      return;
    }
    toast.success("Threshold updated");
    setProducts((cur) =>
      cur ? cur.map((p) => (p.id === id ? { ...p, low_stock_threshold: thresholds[id] } : p)) : cur,
    );
  };

  const lowStock = useMemo(
    () => (products ?? []).filter((p) => p.stock <= (thresholds[p.id] ?? p.low_stock_threshold ?? 5)),
    [products, thresholds],
  );

  const renderTable = (list: Product[]) => (
    <Card className="border-border/60 shadow-soft">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="w-[200px]">Low-stock threshold</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((p) => {
                const threshold = thresholds[p.id] ?? p.low_stock_threshold ?? 5;
                const isLow = p.stock <= threshold;
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        {p.images?.[0] ? (
                          <img
                            src={p.images[0]}
                            alt={p.name}
                            className="h-10 w-10 rounded-md object-cover border border-border/60"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-md bg-accent" />
                        )}
                        <span className="font-medium line-clamp-1">{p.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold">{p.stock}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        value={threshold}
                        onChange={(e) =>
                          setThresholds((m) => ({ ...m, [p.id]: Number(e.target.value) }))
                        }
                        className="h-8 w-24"
                      />
                    </TableCell>
                    <TableCell>
                      {isLow ? (
                        <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/30">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Low stock
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                          OK
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => saveThreshold(p.id)}
                        disabled={savingId === p.id}
                      >
                        {savingId === p.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        eyebrow="Operations"
        title="Stock Alerts"
        description="Set low-stock thresholds and monitor at-risk products."
        icon={AlertTriangle}
        gradient="from-amber-500 via-orange-500 to-red-500"
      />

      {products === null ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={AlertTriangle}
          title="No products yet"
          description="Add products from the Products page to monitor their stock."
        />
      ) : (
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All products ({products.length})</TabsTrigger>
            <TabsTrigger value="low">
              Low stock
              {lowStock.length > 0 && (
                <Badge className="ml-2 h-5 px-1.5 bg-rose-500 text-white">{lowStock.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="all">{renderTable(products)}</TabsContent>
          <TabsContent value="low">
            {lowStock.length === 0 ? (
              <EmptyState
                icon={AlertTriangle}
                title="All good"
                description="No products are currently at or below their low-stock threshold."
              />
            ) : (
              renderTable(lowStock)
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
