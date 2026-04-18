import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, MessageCircle, Save, Trash2 } from "lucide-react";
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

export const Route = createFileRoute("/dashboard/apps/chatbot")({
  component: ChatbotPage,
  head: () => ({ meta: [{ title: "Chatbot — Storely" }] }),
});

function ChatbotPage() {
  const { user } = useAuth();
  const [enabled, setEnabled] = useState(true);
  const [welcome, setWelcome] = useState("Hi! How can I help you today?");
  const [color, setColor] = useState("#6d28d9");
  const [kb, setKb] = useState("");
  const [model, setModel] = useState("google/gemini-2.5-flash");
  const [convos, setConvos] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("chatbot_settings")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setEnabled(data.enabled);
        setWelcome(data.welcome_message);
        setColor(data.primary_color);
        setKb(data.knowledge_base);
        setModel(data.ai_model);
      });
    supabase
      .from("chatbot_conversations")
      .select("*")
      .eq("store_owner_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(20)
      .then(({ data }) => setConvos(data ?? []));
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("chatbot_settings").upsert(
      {
        user_id: user.id,
        enabled,
        welcome_message: welcome,
        primary_color: color,
        knowledge_base: kb,
        ai_model: model,
      },
      { onConflict: "user_id" },
    );
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Saved");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/dashboard">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>
      </Button>

      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-blue-500/20 flex items-center justify-center">
          <MessageCircle className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold">Chatbot</h1>
          <p className="text-sm text-muted-foreground">
            AI-powered support assistant for your storefront.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <p className="font-medium">Show chatbot on storefront</p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
          <div className="space-y-2">
            <Label>Welcome message</Label>
            <Input value={welcome} onChange={(e) => setWelcome(e.target.value)} />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Primary color</Label>
              <Input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-24"
              />
            </div>
            <div className="space-y-2">
              <Label>AI model</Label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="google/gemini-2.5-flash-lite">
                    Gemini 2.5 Flash Lite (cheapest)
                  </SelectItem>
                  <SelectItem value="google/gemini-2.5-flash">
                    Gemini 2.5 Flash (recommended)
                  </SelectItem>
                  <SelectItem value="google/gemini-2.5-pro">
                    Gemini 2.5 Pro (best quality)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Knowledge base</Label>
            <Textarea
              value={kb}
              onChange={(e) => setKb(e.target.value)}
              rows={8}
              placeholder="Shipping policy, return policy, FAQs, store hours…"
            />
          </div>
          <Button onClick={save} disabled={saving}>
            <Save className="h-4 w-4" /> Save
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent conversations</CardTitle>
        </CardHeader>
        <CardContent>
          {convos.length === 0 ? (
            <p className="text-sm text-muted-foreground">No conversations yet.</p>
          ) : (
            <div className="divide-y">
              {convos.map((c) => (
                <div key={c.id} className="py-3 flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-sm">
                      {Array.isArray(c.messages) ? c.messages.length : 0} messages ·{" "}
                      {new Date(c.updated_at).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      Visitor {c.visitor_id.slice(0, 8)}
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={async () => {
                      await supabase.from("chatbot_conversations").delete().eq("id", c.id);
                      setConvos(convos.filter((x) => x.id !== c.id));
                    }}
                  >
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
