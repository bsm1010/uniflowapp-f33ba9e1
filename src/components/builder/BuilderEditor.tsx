import { useState } from "react";
import { Sparkles, Loader2, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
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
import type { SectionInstance, SchemaField } from "@/components/storefront/blocks/types";
import { generateAISection } from "@/lib/builder/sections.functions";

interface Props {
  section: SectionInstance | null;
  brandName: string;
  onChange: (next: SectionInstance) => void;
  onDelete: () => void;
}

export function BuilderEditor({ section, brandName, onChange, onDelete }: Props) {
  const aiFill = useServerFn(generateAISection);
  const [aiBrief, setAiBrief] = useState("");
  const [aiBusy, setAiBusy] = useState(false);

  if (!section) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-sm text-muted-foreground">
        Pick a section from the canvas to edit it.
      </div>
    );
  }

  const def = getBlock(section.blockKey);
  if (!def) {
    return (
      <div className="p-6 text-sm text-destructive">
        Unknown section type: {section.blockKey}
      </div>
    );
  }

  const merged = { ...def.defaultProps, ...section.props };

  const setField = (key: string, value: unknown) => {
    onChange({
      ...section,
      props: { ...section.props, [key]: value },
    });
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
          brandName,
          defaultProps: def.defaultProps as Record<string, unknown>,
        },
      });
      const filled = JSON.parse(res.propsJson) as Record<string, unknown>;
      onChange({
        ...section,
        props: { ...section.props, ...filled },
      });
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
    <div className="flex h-full flex-col bg-card">
      <div className="flex items-start justify-between gap-2 border-b p-4">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            Editing
          </div>
          <div className="truncate text-sm font-semibold">{def.label}</div>
        </div>
        <Button variant="ghost" size="icon" onClick={onDelete} className="text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-5 p-4">
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
            <Button
              size="sm"
              className="mt-2 w-full"
              onClick={runAI}
              disabled={aiBusy}
            >
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

          {def.schema.fields.map((field) => (
            <FieldRenderer
              key={field.key}
              field={field}
              value={(merged as Record<string, unknown>)[field.key]}
              onChange={(v) => setField(field.key, v)}
            />
          ))}
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
            value={Number(value ?? 0)}
            min={field.min}
            max={field.max}
            step={field.step ?? 1}
            onChange={(e) => onChange(Number(e.target.value))}
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
            <Input
              value={String(value ?? "")}
              onChange={(e) => onChange(e.target.value)}
            />
          </div>
        </div>
      );
    case "select":
      return (
        <div className="space-y-1.5">
          <Label className="text-xs">{field.label}</Label>
          <Select value={String(value ?? "")} onValueChange={onChange}>
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
    const next = value.map((item, i) => (i === idx ? { ...item, [key]: v } : item));
    onChange(next);
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
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => remove(idx)}>
                <Trash2 className="h-3 w-3" />
              </Button>
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
        <Plus className="mr-2 h-3.5 w-3.5" /> Add item
      </Button>
    </div>
  );
}
