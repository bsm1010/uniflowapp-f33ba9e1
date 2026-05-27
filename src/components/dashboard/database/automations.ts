import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type AutomationTrigger = "record_created" | "record_updated";

export type AutomationAction =
  | { type: "notify"; title: string; message: string }
  | { type: "update_field"; field_id: string; value: string }
  | { type: "create_record"; target_table_id: string; data: Record<string, string> };

export type Automation = {
  id: string;
  user_id: string;
  table_id: string;
  name: string;
  enabled: boolean;
  trigger: AutomationTrigger;
  actions: AutomationAction[];
  created_at: string;
  updated_at: string;
};

type RunCtx = {
  userId: string;
  tableId: string;
  recordId: string;
  recordData: Record<string, unknown>;
};

/**
 * Resolve {{field_id}} placeholders against the record data.
 */
function interpolate(value: string, data: Record<string, unknown>): string {
  return value.replace(/\{\{(.+?)\}\}/g, (_, key) => {
    const v = data[key.trim()];
    if (v == null) return "";
    return typeof v === "string" ? v : JSON.stringify(v);
  });
}

async function runAction(action: AutomationAction, ctx: RunCtx) {
  if (action.type === "notify") {
    await supabase.from("notifications").insert({
      user_id: ctx.userId,
      title: interpolate(action.title || "Automation", ctx.recordData),
      message: interpolate(action.message || "", ctx.recordData),
      type: "info",
    } as never);
    return;
  }
  if (action.type === "update_field") {
    if (!action.field_id) return;
    const newData = {
      ...ctx.recordData,
      [action.field_id]: interpolate(action.value, ctx.recordData),
    };
    await supabase
      .from("db_records")
      .update({ data: newData as never })
      .eq("id", ctx.recordId);
    return;
  }
  if (action.type === "create_record") {
    if (!action.target_table_id) return;
    const data: Record<string, string> = {};
    for (const [k, v] of Object.entries(action.data || {})) {
      data[k] = interpolate(String(v ?? ""), ctx.recordData);
    }
    await supabase.from("db_records").insert({
      user_id: ctx.userId,
      table_id: action.target_table_id,
      data: data as never,
      position: 0,
    });
    return;
  }
}

/**
 * Fire all enabled automations matching a given trigger for a table.
 * Errors are surfaced as toasts but never block the UI.
 */
export async function runAutomations(trigger: AutomationTrigger, ctx: RunCtx) {
  try {
    const { data, error } = await supabase
      .from("db_automations")
      .select("*")
      .eq("table_id", ctx.tableId)
      .eq("trigger", trigger)
      .eq("enabled", true);
    if (error || !data) return;
    for (const a of data as unknown as Automation[]) {
      for (const action of a.actions || []) {
        try {
          await runAction(action, ctx);
        } catch (e) {
          console.error("[automation] action failed", a.name, action, e);
          toast.error(`Automation "${a.name}" failed`);
        }
      }
    }
  } catch (e) {
    console.error("[automation] run failed", e);
  }
}
