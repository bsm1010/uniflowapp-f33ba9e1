import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, TestTube, Bot, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAIAgent } from "@/hooks/use-ai-agent";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { testAIReply } from "@/lib/ai-agent/ai-reply.functions";
import { toast } from "sonner";

export function AITrainingPanel() {
  const { settings, refreshSettings } = useAIAgent();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [testMsg, setTestMsg] = useState("");
  const [testReply, setTestReply] = useState("");
  const [testing, setTesting] = useState(false);

  const [form, setForm] = useState({
    enabled: true,
    personality: "friendly",
    tone: "casual",
    language_mode: "auto",
    darija_level: "medium",
    reply_delay_seconds: 3,
    auto_reply: true,
    forbidden_words: "",
    custom_instructions: "",
    greeting_message: "مرحبا! كيفاش نقدر نعاونك؟",
    suggest_human_takeover: true,
    max_ai_turns: 10,
    faq_entries: [] as { question: string; answer: string }[],
  });

  useEffect(() => {
    if (settings) {
      setForm({
        enabled: settings.enabled,
        personality: settings.personality,
        tone: settings.tone,
        language_mode: settings.language_mode,
        darija_level: settings.darija_level,
        reply_delay_seconds: settings.reply_delay_seconds,
        auto_reply: settings.auto_reply,
        forbidden_words: settings.forbidden_words.join(", "),
        custom_instructions: settings.custom_instructions,
        greeting_message: settings.greeting_message,
        suggest_human_takeover: settings.suggest_human_takeover,
        max_ai_turns: settings.max_ai_turns,
        faq_entries: settings.faq_entries,
      });
    }
  }, [settings]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const payload = {
      user_id: user.id,
      enabled: form.enabled,
      personality: form.personality,
      tone: form.tone,
      language_mode: form.language_mode,
      darija_level: form.darija_level,
      reply_delay_seconds: form.reply_delay_seconds,
      auto_reply: form.auto_reply,
      forbidden_words: form.forbidden_words.split(",").map((w) => w.trim()).filter(Boolean),
      custom_instructions: form.custom_instructions,
      greeting_message: form.greeting_message,
      suggest_human_takeover: form.suggest_human_takeover,
      max_ai_turns: form.max_ai_turns,
      faq_entries: form.faq_entries,
    };

    const { error } = settings
      ? await supabase.from("ai_agent_settings").update(payload).eq("user_id", user.id)
      : await supabase.from("ai_agent_settings").insert(payload);

    if (error) {
      toast.error("Failed to save settings");
    } else {
      toast.success("AI settings saved!");
      refreshSettings();
    }
    setSaving(false);
  };

  const testAI = useServerFn(testAIReply);
  const handleTest = async () => {
    if (!testMsg.trim()) return;
    setTesting(true);
    setTestReply("");
    try {
      const res = await testAI({ data: { testMessage: testMsg } });
      setTestReply(res.reply);
    } catch (e) {
      setTestReply("Error generating reply. Please check your settings.");
    }
    setTesting(false);
  };

  const addFAQ = () => {
    setForm((f) => ({ ...f, faq_entries: [...f.faq_entries, { question: "", answer: "" }] }));
  };

  const updateFAQ = (idx: number, field: "question" | "answer", value: string) => {
    setForm((f) => ({
      ...f,
      faq_entries: f.faq_entries.map((e, i) => (i === idx ? { ...e, [field]: value } : e)),
    }));
  };

  const removeFAQ = (idx: number) => {
    setForm((f) => ({ ...f, faq_entries: f.faq_entries.filter((_, i) => i !== idx) }));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Core Settings */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bot className="h-5 w-5 text-violet-500" /> AI Behavior
            </CardTitle>
            <CardDescription>Configure how your AI agent responds</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>AI Auto-Reply</Label>
              <Switch checked={form.auto_reply} onCheckedChange={(v) => setForm((f) => ({ ...f, auto_reply: v }))} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Enabled</Label>
              <Switch checked={form.enabled} onCheckedChange={(v) => setForm((f) => ({ ...f, enabled: v }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Personality</Label>
              <Select value={form.personality} onValueChange={(v) => setForm((f) => ({ ...f, personality: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Tone</Label>
              <Select value={form.tone} onValueChange={(v) => setForm((f) => ({ ...f, tone: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="formal">Formal</SelectItem>
                  <SelectItem value="playful">Playful</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Darija Level</Label>
              <Select value={form.darija_level} onValueChange={(v) => setForm((f) => ({ ...f, darija_level: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low (mostly MSA)</SelectItem>
                  <SelectItem value="medium">Medium (mixed)</SelectItem>
                  <SelectItem value="high">High (full Darija)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Reply Delay (seconds)</Label>
              <Input
                type="number"
                min={0}
                max={30}
                value={form.reply_delay_seconds}
                onChange={(e) => setForm((f) => ({ ...f, reply_delay_seconds: Number(e.target.value) }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Suggest Human Takeover</Label>
              <Switch checked={form.suggest_human_takeover} onCheckedChange={(v) => setForm((f) => ({ ...f, suggest_human_takeover: v }))} />
            </div>
          </CardContent>
        </Card>

        {/* Custom Instructions & Forbidden Words */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Training Data</CardTitle>
            <CardDescription>Teach your AI how to sell</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Greeting Message</Label>
              <Textarea
                value={form.greeting_message}
                onChange={(e) => setForm((f) => ({ ...f, greeting_message: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Custom Instructions</Label>
              <Textarea
                value={form.custom_instructions}
                onChange={(e) => setForm((f) => ({ ...f, custom_instructions: e.target.value }))}
                placeholder="e.g., Always mention free delivery for orders over 5000 DA..."
                rows={4}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Forbidden Words (comma-separated)</Label>
              <Input
                value={form.forbidden_words}
                onChange={(e) => setForm((f) => ({ ...f, forbidden_words: e.target.value }))}
                placeholder="competitor1, competitor2..."
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FAQs */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">FAQ Training</CardTitle>
          <CardDescription>Add common questions and answers your AI should know</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {form.faq_entries.map((faq, idx) => (
            <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-2 p-3 rounded-lg bg-muted/50">
              <Input placeholder="Question" value={faq.question} onChange={(e) => updateFAQ(idx, "question", e.target.value)} />
              <div className="flex gap-2">
                <Input placeholder="Answer" value={faq.answer} onChange={(e) => updateFAQ(idx, "answer", e.target.value)} className="flex-1" />
                <Button variant="ghost" size="icon" onClick={() => removeFAQ(idx)} className="shrink-0 text-destructive">×</Button>
              </div>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addFAQ}>+ Add FAQ</Button>
        </CardContent>
      </Card>

      {/* Test sandbox */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-violet-500/5 to-indigo-500/5">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TestTube className="h-5 w-5 text-violet-500" /> Test AI
          </CardTitle>
          <CardDescription>Preview how your AI responds to customer messages</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={testMsg}
              onChange={(e) => setTestMsg(e.target.value)}
              placeholder='Try: "ch7al el prix ta3 hoodie noir?"'
              onKeyDown={(e) => e.key === "Enter" && handleTest()}
            />
            <Button onClick={handleTest} disabled={testing || !testMsg.trim()} className="bg-violet-500 hover:bg-violet-600">
              {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Test"}
            </Button>
          </div>
          {testReply && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-sm"
            >
              <div className="flex items-center gap-2 mb-2 text-xs opacity-70">
                <Bot className="h-3.5 w-3.5" /> AI Response
              </div>
              <p className="whitespace-pre-wrap">{testReply}</p>
            </motion.div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 shadow-lg px-8">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save Settings
        </Button>
      </div>
    </div>
  );
}
