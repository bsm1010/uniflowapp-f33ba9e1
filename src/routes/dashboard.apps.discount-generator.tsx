import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Plus, Trash2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

import { RequireApp } from "@/components/dashboard/RequireApp";

export const Route = createFileRoute("/dashboard/apps/discount-generator")({
  component: () => (
    <RequireApp appKey="discount-generator">
      <DiscountGeneratorPage />
    </RequireApp>
  ),
  head: () => ({
    meta: [{ title: "Discount Generator — Storely" }],
  }),
});

type Discount = {
  id: string;
  code: string;
  discount_type: "percent" | "fixed";
  value: number;
  usage_limit: number | null;
  used_count: number;
  expires_at: string | null;
  active: boolean;
};

function DiscountGeneratorPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [type, setType] = useState<"percent" | "fixed">("percent");
  const [value, setValue] = useState("10");
  const [limit, setLimit] = useState("");
  const [expires, setExpires] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("discount_codes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setItems((data ?? []) as Discount[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const create = async () => {
    if (!user) return;
    if (!code.trim()) return toast.error("Code required");
    setSaving(true);
    const { error } = await supabase.from("discount_codes").insert({
      user_id: user.id,
      code: code.trim().toUpperCase(),
      discount_type: type,
      value: Number(value) || 0,
      usage_limit: limit ? Number(limit) : null,
      expires_at: expires ? new Date(expires).toISOString() : null,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Discount created");
    setCode("");
    setValue("10");
    setLimit("");
    setExpires("");
    load();
  };

  const toggle = async (id: string, active: boolean) => {
    await supabase.from("discount_codes").update({ active }).eq("id", id);
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("discount_codes").delete().eq("id", id);
    toast.success("Deleted");
    load();
  };

  const generateRandom = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let s = "";
    for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
    setCode(s);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/dashboard">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>
      </Button>

      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-rose-500/20 to-orange-500/20 flex items-center justify-center">
          <Tag className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold">Discount Generator</h1>
          <p className="text-sm text-muted-foreground">
            Create promo codes customers can apply at checkout.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New discount code</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-5">
          <div className="md:col-span-2 space-y-2">
            <Label>Code</Label>
            <div className="flex gap-2">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="SUMMER10"
              />
              <Button type="button" variant="outline" onClick={generateRandom}>
                Random
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as "percent" | "fixed")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percent">Percent %</SelectItem>
                <SelectItem value="fixed">Fixed amount</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Value</Label>
            <Input type="number" value={value} onChange={(e) => setValue(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Usage limit</Label>
            <Input
              type="number"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              placeholder="∞"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Expires at</Label>
            <Input
              type="datetime-local"
              value={expires}
              onChange={(e) => setExpires(e.target.value)}
            />
          </div>
          <div className="md:col-span-3 flex items-end justify-end">
            <Button onClick={create} disabled={saving}>
              <Plus className="h-4 w-4" /> Create
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your codes</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No codes yet.</p>
          ) : (
            <div className="divide-y">
              {items.map((d) => (
                <div key={d.id} className="flex items-center gap-4 py-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold">{d.code}</span>
                      <Badge variant="secondary">
                        {d.discount_type === "percent" ? `${d.value}%` : `$${d.value}`}
                      </Badge>
                      {d.expires_at && (
                        <span className="text-xs text-muted-foreground">
                          exp {new Date(d.expires_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Used {d.used_count}
                      {d.usage_limit ? ` / ${d.usage_limit}` : ""}
                    </p>
                  </div>
                  <Switch
                    checked={d.active}
                    onCheckedChange={(v) => toggle(d.id, v)}
                  />
                  <Button size="icon" variant="ghost" onClick={() => remove(d.id)}>
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
