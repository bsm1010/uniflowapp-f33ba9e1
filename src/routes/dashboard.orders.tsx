import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Search, ShoppingBag } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { PageHeader, EmptyState } from "@/components/dashboard/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Order = Tables<"orders">;

export const Route = createFileRoute("/dashboard/orders")({
  component: OrdersPage,
  head: () => ({ meta: [{ title: "Orders — Storely" }] }),
});

const STATUS_VARIANT: Record<
  string,
  { label: string; className: string }
> = {
  pending: {
    label: "Pending",
    className:
      "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
  },
  confirmed: {
    label: "Confirmed",
    className:
      "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/30",
  },
  shipped: {
    label: "Shipped",
    className:
      "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/30",
  },
  delivered: {
    label: "Delivered",
    className:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  },
  cancelled: {
    label: "Cancelled",
    className:
      "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30",
  },
};

function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!user) return;
    let active = true;
    supabase
      .from("orders")
      .select("*")
      .eq("store_owner_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (active) setOrders(data ?? []);
      });
    return () => {
      active = false;
    };
  }, [user]);

  const filtered = (orders ?? []).filter((o) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      o.customer_name.toLowerCase().includes(q) ||
      o.customer_email.toLowerCase().includes(q) ||
      o.id.toLowerCase().startsWith(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        eyebrow="Sales"
        title="Orders"
        description="Track, fulfill, and manage customer orders."
      />

      {orders === null ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No orders yet"
          description="Once customers buy, their orders show up here."
          action={
            <Link
              to="/dashboard/themes"
              className="text-sm font-medium text-primary hover:underline"
            >
              Customize your store →
            </Link>
          }
        />
      ) : (
        <Card className="border-border/60 shadow-soft">
          <CardContent className="p-0">
            <div className="p-4 border-b border-border/60 flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by customer, email, or order ID"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="text-xs text-muted-foreground">
                {filtered.length} of {orders.length}
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((o) => {
                    const status = STATUS_VARIANT[o.status] ?? {
                      label: o.status,
                      className: "bg-muted text-foreground border-border",
                    };
                    return (
                      <TableRow key={o.id}>
                        <TableCell className="font-mono text-xs">
                          #{o.id.slice(0, 8).toUpperCase()}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{o.customer_name}</div>
                          <div className="text-xs text-muted-foreground">
                            {o.customer_email}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(o.created_at).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={status.className}
                          >
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          ${Number(o.total).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
