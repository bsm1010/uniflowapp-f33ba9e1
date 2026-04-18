import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Languages, Plus, Trash2, Save } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

import { RequireApp } from "@/components/dashboard/RequireApp";

export const Route = createFileRoute("/dashboard/apps/multi-language")({
  component: () => (
    <RequireApp appKey="multi-language">
      <MultiLangPage />
    </RequireApp>
  ),
  head: () => ({ meta: [{ title: "Multi-language — Storely" }] }),
});

const ALL_LANGS = [
  { code: "en", name: "English" },
  { code: "fr", name: "French" },
  { code: "ar", name: "Arabic" },
  { code: "es", name: "Spanish" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "zh", name: "Chinese" },
];

type Translation = { id: string; language: string; key: string; value: string };

function MultiLangPage() {
  const { user } = useAuth();
  const [defaultLang, setDefaultLang] = useState("en");
  const [enabled, setEnabled] = useState<string[]>(["en"]);
  const [activeLang, setActiveLang] = useState("en");
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [keyInput, setKeyInput] = useState("");
  const [valueInput, setValueInput] = useState("");

  const loadAll = async () => {
    if (!user) return;
    const { data: settings } = await supabase
      .from("store_languages")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    if (settings) {
      setDefaultLang(settings.default_language);
      setEnabled(settings.enabled_languages);
    }
    const { data: t } = await supabase
      .from("translations")
      .select("*")
      .eq("user_id", user.id);
    setTranslations((t ?? []) as Translation[]);
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const saveSettings = async () => {
    if (!user) return;
    const { error } = await supabase.from("store_languages").upsert(
      {
        user_id: user.id,
        default_language: defaultLang,
        enabled_languages: enabled,
      },
      { onConflict: "user_id" },
    );
    if (error) return toast.error(error.message);
    toast.success("Languages saved");
  };

  const toggleLang = (code: string) => {
    setEnabled((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  };

  const addTranslation = async () => {
    if (!user || !keyInput.trim()) return;
    const { error } = await supabase.from("translations").upsert(
      {
        user_id: user.id,
        language: activeLang,
        key: keyInput.trim(),
        value: valueInput,
      },
      { onConflict: "user_id,language,key" },
    );
    if (error) return toast.error(error.message);
    setKeyInput("");
    setValueInput("");
    loadAll();
  };

  const removeT = async (id: string) => {
    await supabase.from("translations").delete().eq("id", id);
    loadAll();
  };

  const filtered = translations.filter((t) => t.language === activeLang);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/dashboard">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>
      </Button>

      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
          <Languages className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold">Multi-language</h1>
          <p className="text-sm text-muted-foreground">
            Translate your store into multiple languages.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Languages</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Default language</Label>
            <Select value={defaultLang} onValueChange={setDefaultLang}>
              <SelectTrigger className="w-60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_LANGS.map((l) => (
                  <SelectItem key={l.code} value={l.code}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Enabled languages</Label>
            <div className="flex flex-wrap gap-2">
              {ALL_LANGS.map((l) => {
                const on = enabled.includes(l.code);
                return (
                  <button
                    key={l.code}
                    onClick={() => toggleLang(l.code)}
                    className={`rounded-md border px-3 py-1.5 text-sm ${
                      on
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background"
                    }`}
                  >
                    {l.name}
                  </button>
                );
              })}
            </div>
          </div>
          <Button onClick={saveSettings}>
            <Save className="h-4 w-4" /> Save
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Translations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {enabled.map((code) => (
              <Badge
                key={code}
                variant={activeLang === code ? "default" : "secondary"}
                className="cursor-pointer"
                onClick={() => setActiveLang(code)}
              >
                {ALL_LANGS.find((l) => l.code === code)?.name ?? code}
              </Badge>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Input
              placeholder="Key (e.g. add_to_cart)"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
            />
            <Input
              placeholder="Translated value"
              value={valueInput}
              onChange={(e) => setValueInput(e.target.value)}
              className="md:col-span-1"
            />
            <Button onClick={addTranslation}>
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No translations for this language yet.
            </p>
          ) : (
            <div className="divide-y">
              {filtered.map((t) => (
                <div key={t.id} className="py-2 flex items-center gap-3">
                  <span className="font-mono text-xs w-1/3 truncate">{t.key}</span>
                  <span className="flex-1 text-sm">{t.value}</span>
                  <Button size="icon" variant="ghost" onClick={() => removeT(t.id)}>
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
