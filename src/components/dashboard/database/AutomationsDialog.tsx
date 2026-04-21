import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, Zap, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  Automation,
  AutomationAction,
  AutomationTrigger,
} from "./automations";

type DBField = {
  id: string;
  table_id: string;
  name: string;
  field_type: string;
};

type DBTable = { id: string; name: string };

export function AutomationsDialog({
  open,
  onOpenChange,
  table,
  fields,
  allTables,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  table: DBTable | null;
  fields: DBField[];
  allTables: DBTable[];
}) {
  const { user } = useAuth();
  const [items, setItems] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [targetFields, setTargetFields] = useState<Record<string, DBField[]>>({});

  const load = useCallback(async () => {
    if (!table) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("db_automations")
      .select("*")
      .eq("table_id", table.id)
      .order("created_at", { ascending: true });
    setLoading(false);
    if (error) return toast.error(error.message);
    setItems((data ?? []) as unknown as Automation[]);
  }, [table]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  // Lazy-load fields for target tables referenced by create_record actions
  useEffect(() => {
    const targetIds = new Set<string>();
    for (const a of items) {
      for (const act of a.actions || []) {
        if (act.type === "create_record" && act.target_table_id) {
          targetIds.add(act.target_table_id);
        }
      }
    }
    const missing = [...targetIds].filter((id) => !targetFields[id]);
    if (missing.length === 0) return;
    (async () => {
      const { data } = await supabase
        .from("db_fields")
        .select("*")
        .in("table_id", missing);
      if (!data) return;
      const next: Record<string, DBField[]> = { ...targetFields };
      for (const id of missing) next[id] = [];
      for (const f of data as DBField[]) (next[f.table_id] ||= []).push(f);
      setTargetFields(next);
    })();
  }, [items, targetFields]);

  async function addAutomation() {
    if (!user || !table) return;
    const { data, error } = await supabase
      .from("db_automations")
      .insert({
        user_id: user.id,
        table_id: table.id,
        name: "Untitled automation",
        enabled: true,
        trigger: "record_created",
        actions: [] as never,
      })
      .select()
      .single();
    if (error) return toast.error(error.message);
    if (data) {
      setItems((p) => [...p, data as unknown as Automation]);
      setExpandedId(data.id);
    }
  }

  async function patch(id: string, changes: Partial<Automation>) {
    setItems((p) => p.map((a) => (a.id === id ? { ...a, ...changes } : a)));
    const payload: Record<string, unknown> = { ...changes };
    if (changes.actions) payload.actions = changes.actions as never;
    const { error } = await supabase
      .from("db_automations")
      .update(payload as never)
      .eq("id", id);
    if (error) toast.error(error.message);
  }

  async function remove(id: string) {
    if (!confirm("Delete this automation?")) return;
    const { error } = await supabase.from("db_automations").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setItems((p) => p.filter((a) => a.id !== id));
  }

  function updateAction(a: Automation, idx: number, next: AutomationAction) {
    const actions = a.actions.map((x, i) => (i === idx ? next : x));
    patch(a.id, { actions });
  }

  function addAction(a: Automation, type: AutomationAction["type"]) {
    let action: AutomationAction;
    if (type === "notify") {
      action = { type: "notify", title: "New record in " + (table?.name ?? ""), message: "" };
    } else if (type === "update_field") {
      action = { type: "update_field", field_id: fields[0]?.id ?? "", value: "" };
    } else {
      action = { type: "create_record", target_table_id: "", data: {} };
    }
    patch(a.id, { actions: [...a.actions, action] });
  }

  function removeAction(a: Automation, idx: number) {
    patch(a.id, { actions: a.actions.filter((_, i) => i !== idx) });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" /> Automations · {table?.name}
          </DialogTitle>
          <DialogDescription>
            Run actions automatically when records are created or updated. Use{" "}
            <code className="bg-muted px-1 rounded">{"{{field_id}}"}</code> in text fields to
            inject values from the triggering record.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : items.length === 0 ? (
            <Card className="p-6 text-center text-sm text-muted-foreground">
              No automations yet. Click below to add one.
            </Card>
          ) : (
            items.map((a) => {
              const expanded = expandedId === a.id;
              return (
                <Card key={a.id} className="p-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={a.enabled}
                      onCheckedChange={(v) => patch(a.id, { enabled: v })}
                    />
                    <Input
                      value={a.name}
                      onChange={(e) =>
                        setItems((p) =>
                          p.map((x) => (x.id === a.id ? { ...x, name: e.target.value } : x)),
                        )
                      }
                      onBlur={(e) => patch(a.id, { name: e.target.value })}
                      className="flex-1 h-8"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setExpandedId(expanded ? null : a.id)}
                    >
                      {expanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => remove(a.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {expanded && (
                    <div className="mt-3 space-y-3 border-t pt-3">
                      <div>
                        <Label className="text-xs">Trigger</Label>
                        <Select
                          value={a.trigger}
                          onValueChange={(v) =>
                            patch(a.id, { trigger: v as AutomationTrigger })
                          }
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="record_created">When a record is created</SelectItem>
                            <SelectItem value="record_updated">When a record is updated</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs">Actions</Label>
                        {a.actions.length === 0 && (
                          <div className="text-xs text-muted-foreground">No actions yet.</div>
                        )}
                        {a.actions.map((act, idx) => (
                          <Card key={idx} className="p-3 bg-muted/30">
                            <div className="flex items-start gap-2">
                              <div className="flex-1 space-y-2">
                                {act.type === "notify" && (
                                  <>
                                    <div className="text-xs font-medium">Send notification</div>
                                    <Input
                                      placeholder="Title"
                                      value={act.title}
                                      onChange={(e) =>
                                        updateAction(a, idx, { ...act, title: e.target.value })
                                      }
                                      className="h-8"
                                    />
                                    <Input
                                      placeholder="Message (supports {{field_id}})"
                                      value={act.message}
                                      onChange={(e) =>
                                        updateAction(a, idx, { ...act, message: e.target.value })
                                      }
                                      className="h-8"
                                    />
                                  </>
                                )}
                                {act.type === "update_field" && (
                                  <>
                                    <div className="text-xs font-medium">Update field on this record</div>
                                    <Select
                                      value={act.field_id}
                                      onValueChange={(v) =>
                                        updateAction(a, idx, { ...act, field_id: v })
                                      }
                                    >
                                      <SelectTrigger className="h-8">
                                        <SelectValue placeholder="Select field" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {fields.map((f) => (
                                          <SelectItem key={f.id} value={f.id}>
                                            {f.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <Input
                                      placeholder="Value (supports {{field_id}})"
                                      value={act.value}
                                      onChange={(e) =>
                                        updateAction(a, idx, { ...act, value: e.target.value })
                                      }
                                      className="h-8"
                                    />
                                  </>
                                )}
                                {act.type === "create_record" && (
                                  <>
                                    <div className="text-xs font-medium">Create record in another table</div>
                                    <Select
                                      value={act.target_table_id}
                                      onValueChange={(v) =>
                                        updateAction(a, idx, {
                                          ...act,
                                          target_table_id: v,
                                          data: {},
                                        })
                                      }
                                    >
                                      <SelectTrigger className="h-8">
                                        <SelectValue placeholder="Select target table" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {allTables
                                          .filter((t) => t.id !== table?.id)
                                          .map((t) => (
                                            <SelectItem key={t.id} value={t.id}>
                                              {t.name}
                                            </SelectItem>
                                          ))}
                                      </SelectContent>
                                    </Select>
                                    {act.target_table_id &&
                                      (targetFields[act.target_table_id] ?? []).map((tf) => (
                                        <div key={tf.id} className="flex items-center gap-2">
                                          <span className="text-xs w-24 truncate text-muted-foreground">
                                            {tf.name}
                                          </span>
                                          <Input
                                            placeholder="Value or {{field_id}}"
                                            value={act.data[tf.id] ?? ""}
                                            onChange={(e) =>
                                              updateAction(a, idx, {
                                                ...act,
                                                data: { ...act.data, [tf.id]: e.target.value },
                                              })
                                            }
                                            className="h-8"
                                          />
                                        </div>
                                      ))}
                                  </>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive"
                                onClick={() => removeAction(a, idx)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </Card>
                        ))}
                        <div className="flex gap-2 flex-wrap">
                          <Button size="sm" variant="outline" onClick={() => addAction(a, "notify")}>
                            <Plus className="h-3 w-3 mr-1" /> Notification
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => addAction(a, "update_field")}
                          >
                            <Plus className="h-3 w-3 mr-1" /> Update field
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => addAction(a, "create_record")}
                          >
                            <Plus className="h-3 w-3 mr-1" /> Create record
                          </Button>
                        </div>
                      </div>

                      {fields.length > 0 && (
                        <div className="text-[11px] text-muted-foreground border-t pt-2">
                          Available field placeholders:{" "}
                          {fields.map((f) => (
                            <code key={f.id} className="bg-muted px-1 rounded mx-0.5">
                              {`{{${f.id}}}`}
                            </code>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })
          )}

          <Button onClick={addAutomation} variant="outline" className="w-full">
            <Plus className="h-4 w-4 mr-2" /> Add automation
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
