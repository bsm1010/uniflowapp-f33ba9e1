import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, DollarSign, Save } from "lucide-react";
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
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

import { RequireApp } from "@/components/dashboard/RequireApp";

export const Route = createFileRoute("/dashboard/apps/currency-converter")({
  component: () => (
    <RequireApp appKey="currency-converter">
      <CurrencyPage />
    </RequireApp>
  ),
  head: () => ({ meta: [{ title: "Currency Converter — Storely" }] }),
});

const ALL = ["USD", "EUR", "GBP", "DZD", "MAD", "TND", "AED", "SAR", "JPY", "CAD", "AUD"];

function CurrencyPage() {
  const { user } = useAuth();
  const [base, setBase] = useState("USD");
  const [enabled, setEnabled] = useState<string[]>(["USD"]);
  const [rates, setRates] = useState<Record<string, number>>({});
  const [auto, setAuto] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("currency_settings")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setBase(data.base_currency);
        setEnabled(data.enabled_currencies);
        setRates((data.rates as Record<string, number>) ?? {});
        setAuto(data.auto_detect);
      });
  }, [user]);

  const toggle = (c: string) => {
    setEnabled((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  };

  const setRate = (c: string, v: string) => {
    setRates({ ...rates, [c]: Number(v) || 0 });
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("currency_settings").upsert(
      {
        user_id: user.id,
        base_currency: base,
        enabled_currencies: enabled,
        rates,
        auto_detect: auto,
      },
      { onConflict: "user_id" },
    );
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Saved");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/dashboard">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>
      </Button>

      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-lime-500/20 to-green-500/20 flex items-center justify-center">
          <DollarSign className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold">Currency Converter</h1>
          <p className="text-sm text-muted-foreground">
            Show prices in your visitor's local currency.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Base currency</Label>
            <Select value={base} onValueChange={setBase}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <p className="font-medium">Auto-detect visitor currency</p>
              <p className="text-xs text-muted-foreground">
                Use IP geolocation when available.
              </p>
            </div>
            <Switch checked={auto} onCheckedChange={setAuto} />
          </div>
          <div className="space-y-2">
            <Label>Enabled currencies & rates (1 {base} = ?)</Label>
            <div className="grid gap-2">
              {ALL.map((c) => {
                const on = enabled.includes(c);
                return (
                  <div key={c} className="flex items-center gap-3 rounded-md border p-2">
                    <Switch checked={on} onCheckedChange={() => toggle(c)} />
                    <span className="w-16 font-mono">{c}</span>
                    {on && c !== base && (
                      <Input
                        type="number"
                        step="0.0001"
                        value={rates[c] ?? ""}
                        onChange={(e) => setRate(c, e.target.value)}
                        placeholder="rate"
                        className="max-w-xs"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <Button onClick={save} disabled={saving}>
            <Save className="h-4 w-4" /> Save
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
