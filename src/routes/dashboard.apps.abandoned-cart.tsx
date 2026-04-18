import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ShoppingCart, Mail, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/dashboard/apps/abandoned-cart")({
  component: AbandonedCartPage,
  head: () => ({ meta: [{ title: "Abandoned Cart Recovery — Storely" }] }),
});

type Cart = {
  id: string;
  customer_email: string;
  customer_name: string | null;
  cart_total: number;
  cart_items: any[];
  recovered: boolean;
  recovery_email_sent: boolean;
  created_at: string;
};

function AbandonedCartPage() {
  const { user } = useAuth();
  const [carts, setCarts] = useState<Cart[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("abandoned_carts")
      .select("*")
      .eq("store_owner_id", user.id)
      .order("created_at", { ascending: false });
    setCarts((data ?? []) as Cart[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const markSent = async (id: string) => {
    await supabase
      .from("abandoned_carts")
      .update({
        recovery_email_sent: true,
        recovery_email_sent_at: new Date().toISOString(),
      })
      .eq("id", id);
    toast.success("Marked as sent");
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("abandoned_carts").delete().eq("id", id);
    load();
  };

  const total = carts.length;
  const recovered = carts.filter((c) => c.recovered).length;
  const lostValue = carts
    .filter((c) => !c.recovered)
    .reduce((sum, c) => sum + Number(c.cart_total), 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/dashboard">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>
      </Button>

      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
          <ShoppingCart className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold">Abandoned Cart Recovery</h1>
          <p className="text-sm text-muted-foreground">
            Carts captured at checkout that didn't convert. Send a reminder to win them back.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Abandoned</p>
            <p className="text-2xl font-bold">{total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Recovered</p>
            <p className="text-2xl font-bold">{recovered}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Lost value</p>
            <p className="text-2xl font-bold">${lostValue.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Carts</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : carts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No abandoned carts yet. They'll appear here when shoppers leave checkout.
            </p>
          ) : (
            <div className="divide-y">
              {carts.map((c) => (
                <div key={c.id} className="flex items-center gap-4 py-3">
                  <div className="flex-1">
                    <p className="font-medium">{c.customer_name || c.customer_email}</p>
                    <p className="text-xs text-muted-foreground">{c.customer_email}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {Array.isArray(c.cart_items) ? c.cart_items.length : 0} items · $
                      {Number(c.cart_total).toFixed(2)} ·{" "}
                      {new Date(c.created_at).toLocaleString()}
                    </p>
                  </div>
                  {c.recovered ? (
                    <Badge>Recovered</Badge>
                  ) : c.recovery_email_sent ? (
                    <Badge variant="secondary">Email sent</Badge>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => markSent(c.id)}>
                      <Mail className="h-4 w-4" /> Mark sent
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" onClick={() => remove(c.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
