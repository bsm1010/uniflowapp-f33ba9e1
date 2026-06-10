import { useState } from "react";
import { Trash2, Sparkles, Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getBlock } from "@/components/storefront/blocks/registry";
import { useEditorStore } from "@/stores/editor-store";
import type { SchemaField } from "@/components/storefront/blocks/types";
import { generateAISection } from "@/lib/builder/sections.functions";
import { toast } from "sonner";

export function SectionEditor() {
  const { selectedId, getSections, updateSectionProps, removeSection, settings } = useEditorStore();
  const aiFill = useServerFn(generateAISection);
  const [aiBrief, setAiBrief] = useState("");
  const [aiBusy, setAiBusy] = useState(false);

  const sections = getSections();
  const section = sections.find((s) => s.id === selectedId) ?? null;

  if (!section) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-sm text-muted-foreground">
        <div>
          <div className="text-3xl mb-2 opacity-30">🎨</div>
          <p>Select a section from the canvas or left panel to edit its settings.</p>
        </div>
      </div>
    );
  }

  const def = getBlock(section.blockKey);
  if (!def) {
    return (
      <div className="p-6 text-sm text-destructive">Unknown section type: {section.blockKey}</div>
    );
  }

  const merged = { ...def.defaultProps, ...section.props };

  const setField = (key: string, value: unknown) => {
    updateSectionProps(section.id, { [key]: value });
  };

  const runAI = async () => {
    if (!aiBrief.trim()) {
      toast.error("Tell the AI what this section should say.");
      return;
    }
    setAiBusy(true);
    try {
      const res = await aiFill({
        data: {
          blockKey: section.blockKey,
          brief: aiBrief.trim(),
          brandName: settings?.store_name || "Store",
          defaultProps: def.defaultProps as Record<string, unknown>,
        },
      });
      const filled = JSON.parse(res.propsJson) as Record<string, unknown>;
      updateSectionProps(section.id, filled);
      toast.success("Section refreshed with AI copy.");
      setAiBrief("");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "AI failed";
      toast.error(msg);
    } finally {
      setAiBusy(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 border-b p-4">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Editing</div>
          <div className="truncate text-sm font-semibold">{def.label}</div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => removeSection(section.id)}
          className="text-destructive h-8 w-8"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="space-y-4 p-4">
          {/* AI assist */}
          <div className="rounded-lg border border-dashed bg-accent/30 p-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              AI section assistant
            </div>
            <Textarea
              rows={2}
              value={aiBrief}
              onChange={(e) => setAiBrief(e.target.value)}
              placeholder="e.g. Promote our new winter jackets, urgency tone."
              className="text-xs"
            />
            <Button size="sm" className="mt-2 w-full" onClick={runAI} disabled={aiBusy}>
              {aiBusy ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-3.5 w-3.5" />
                  Fill with AI
                </>
              )}
            </Button>
          </div>

          {/* Schema fields */}
          {def.schema.fields.map((field) => (
            <FieldRenderer
              key={field.key}
              field={field}
              value={(merged as Record<string, unknown>)[field.key]}
              onChange={(v) => setField(field.key, v)}
            />
          ))}

          {/* Style overrides */}
          <div className="pt-2 border-t">
            <div className="text-xs font-medium text-muted-foreground mb-3">Style Overrides</div>
            <div className="space-y-3">
              <FieldInline label="Padding Y">
                <Input
                  type="number"
                  min={0}
                  max={200}
                  value={section.styleOverrides?.paddingY ?? 0}
                  onChange={(e) =>
                    useEditorStore.getState().updateSectionStyles(section.id, {
                      paddingY: Number(e.target.value),
                    })
                  }
                  className="h-8 text-xs"
                />
              </FieldInline>
              <FieldInline label="Background">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={section.styleOverrides?.background || "#ffffff"}
                    onChange={(e) =>
                      useEditorStore.getState().updateSectionStyles(section.id, {
                        background: e.target.value,
                      })
                    }
                    className="h-8 w-10 cursor-pointer rounded border"
                  />
                  <Input
                    value={section.styleOverrides?.background || ""}
                    placeholder="transparent"
                    onChange={(e) =>
                      useEditorStore.getState().updateSectionStyles(section.id, {
                        background: e.target.value,
                      })
                    }
                    className="h-8 text-xs flex-1"
                  />
                </div>
              </FieldInline>
              <div className="flex items-center justify-between">
                <Label className="text-xs">Full width</Label>
                <Switch
                  checked={section.styleOverrides?.fullWidth ?? false}
                  onCheckedChange={(v) =>
                    useEditorStore.getState().updateSectionStyles(section.id, {
                      fullWidth: v,
                    })
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

function FieldRenderer({
  field,
  value,
  onChange,
}: {
  field: SchemaField;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  switch (field.type) {
    case "text":
      return (
        <div className="space-y-1.5">
          <Label className="text-xs">{field.label}</Label>
          {field.multiline ? (
            <Textarea
              rows={3}
              value={String(value ?? "")}
              placeholder={field.placeholder}
              onChange={(e) => onChange(e.target.value)}
            />
          ) : (
            <Input
              value={String(value ?? "")}
              placeholder={field.placeholder}
              onChange={(e) => onChange(e.target.value)}
            />
          )}
        </div>
      );
    case "url":
    case "image":
      return (
        <div className="space-y-1.5">
          <Label className="text-xs">{field.label}</Label>
          <Input
            value={String(value ?? "")}
            placeholder={field.type === "image" ? "https://...jpg" : "https://..."}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      );
    case "number":
      return (
        <div className="space-y-1.5">
          <Label className="text-xs">{field.label}</Label>
          <Input
            type="number"
            value={value === undefined || value === null ? "" : Number(value)}
            min={field.min}
            max={field.max}
            step={field.step ?? 1}
            onChange={(e) => {
              const raw = e.target.value;
              onChange(raw === "" || raw === "-" ? 0 : Number(raw));
            }}
          />
        </div>
      );
    case "boolean":
      return (
        <div className="flex items-center justify-between">
          <Label className="text-xs">{field.label}</Label>
          <Switch checked={Boolean(value)} onCheckedChange={onChange} />
        </div>
      );
    case "color":
      return (
        <div className="space-y-1.5">
          <Label className="text-xs">{field.label}</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={typeof value === "string" ? value : "#000000"}
              onChange={(e) => onChange(e.target.value)}
              className="h-9 w-12 cursor-pointer rounded border"
            />
            <Input value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />
          </div>
        </div>
      );
    case "select": {
      const currentVal = String(value ?? field.options[0]?.value ?? "");
      return (
        <div className="space-y-1.5">
          <Label className="text-xs">{field.label}</Label>
          <Select value={currentVal} onValueChange={onChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {field.options.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }
    case "list":
      return (
        <ListField
          field={field}
          value={Array.isArray(value) ? (value as Array<Record<string, unknown>>) : []}
          onChange={onChange}
        />
      );
  }
}

function ListField({
  field,
  value,
  onChange,
}: {
  field: Extract<SchemaField, { type: "list" }>;
  value: Array<Record<string, unknown>>;
  onChange: (v: unknown) => void;
}) {
  const add = () => {
    const blank: Record<string, unknown> = {};
    for (const f of field.itemFields) {
      blank[f.key] = f.type === "boolean" ? false : f.type === "number" ? 0 : "";
    }
    onChange([...value, blank]);
  };

  const update = (idx: number, key: string, v: unknown) => {
    onChange(value.map((item, i) => (i === idx ? { ...item, [key]: v } : item)));
  };

  const remove = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs">{field.label}</Label>
      <div className="space-y-2">
        {value.map((item, idx) => (
          <div key={idx} className="rounded-md border bg-background/50 p-2">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-xs font-medium text-muted-foreground">
                {field.itemLabel ?? "Item"} {idx + 1}
              </div>
              <button
                type="button"
                onClick={() => remove(idx)}
                className="text-destructive hover:underline text-xs"
              >
                ×
              </button>
            </div>
            <div className="space-y-2">
              {field.itemFields.map((f) => (
                <FieldRenderer
                  key={f.key}
                  field={f}
                  value={item[f.key]}
                  onChange={(v) => update(idx, f.key, v)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <Button variant="outline" size="sm" className="w-full" onClick={add}>
        + Add {field.itemLabel ?? "item"}
      </Button>
    </div>
  );
}

function FieldInline({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Label className="text-xs shrink-0">{label}</Label>
      <div className="flex-1">{children}</div>
    </div>
  );
}
