import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, MousePointerClick, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/dashboard/apps/popup-builder")({
  component: PopupBuilderPage,
  head: () => ({ meta: [{ title: "Popup Builder — Storely" }] }),
});

type Popup = {
  id: string;
  title: string;
  content: string;
  cta_label: string;
  cta_url: string;
  trigger_type: "timer" | "exit" | "scroll";
  trigger_value: number;
  background_color: string;
  text_color: string;
  active: boolean;
};

type Draft = {
  title: string;
  content: string;
  cta_label: string;
  cta_url: string;
  trigger_type: "timer" | "exit" | "scroll";
  trigger_value: number;
  background_color: string;
  text_color: string;
};

const empty: Draft = {
  title: "Get 10% off",
  content: "Subscribe to our newsletter and get a coupon.",
  cta_label: "Subscribe",
  cta_url: "/",
  trigger_type: "timer",
  trigger_value: 5,
  background_color: "#ffffff",
  text_color: "#111827",
};

function PopupBuilderPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Popup[]>([]);
  const [draft, setDraft] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("popups")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setItems((data ?? []) as Popup[]);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const create = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("popups").insert({ user_id: user.id, ...draft });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Popup created");
    setDraft(empty);
    load();
  };

  const toggle = async (id: string, active: boolean) => {
    await supabase.from("popups").update({ active }).eq("id", id);
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("popups").delete().eq("id", id);
    load();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/dashboard">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>
      </Button>

      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 flex items-center justify-center">
          <MousePointerClick className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold">Popup Builder</h1>
          <p className="text-sm text-muted-foreground">Capture leads and announce offers.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>New popup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea
                value={draft.content}
                onChange={(e) => setDraft({ ...draft, content: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Button label</Label>
                <Input
                  value={draft.cta_label}
                  onChange={(e) => setDraft({ ...draft, cta_label: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Button URL</Label>
                <Input
                  value={draft.cta_url}
                  onChange={(e) => setDraft({ ...draft, cta_url: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Trigger</Label>
                <Select
                  value={draft.trigger_type}
                  onValueChange={(v) =>
                    setDraft({ ...draft, trigger_type: v as Popup["trigger_type"] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="timer">After N seconds</SelectItem>
                    <SelectItem value="scroll">After N% scroll</SelectItem>
                    <SelectItem value="exit">Exit intent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Value</Label>
                <Input
                  type="number"
                  value={draft.trigger_value}
                  onChange={(e) =>
                    setDraft({ ...draft, trigger_value: Number(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Background</Label>
                <Input
                  type="color"
                  value={draft.background_color}
                  onChange={(e) =>
                    setDraft({ ...draft, background_color: e.target.value })
                  }
                  className="h-10 w-24"
                />
              </div>
              <div className="space-y-2">
                <Label>Text color</Label>
                <Input
                  type="color"
                  value={draft.text_color}
                  onChange={(e) => setDraft({ ...draft, text_color: e.target.value })}
                  className="h-10 w-24"
                />
              </div>
            </div>
            <Button onClick={create} disabled={saving}>
              <Plus className="h-4 w-4" /> Create
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Live preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="rounded-xl border p-6 shadow-lg"
              style={{
                background: draft.background_color,
                color: draft.text_color,
              }}
            >
              <h3 className="text-xl font-bold">{draft.title}</h3>
              <p className="mt-2 text-sm opacity-90">{draft.content}</p>
              <button
                className="mt-4 rounded-md px-4 py-2 text-sm font-medium"
                style={{
                  background: draft.text_color,
                  color: draft.background_color,
                }}
              >
                {draft.cta_label}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your popups</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No popups yet.</p>
          ) : (
            <div className="divide-y">
              {items.map((p) => (
                <div key={p.id} className="py-3 flex items-center gap-3">
                  <div className="flex-1">
                    <p className="font-medium">{p.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.trigger_type} · {p.trigger_value}
                    </p>
                  </div>
                  <Switch
                    checked={p.active}
                    onCheckedChange={(v) => toggle(p.id, v)}
                  />
                  <Button size="icon" variant="ghost" onClick={() => remove(p.id)}>
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
