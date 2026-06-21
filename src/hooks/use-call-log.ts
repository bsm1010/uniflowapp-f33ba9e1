import { supabase } from "@/integrations/supabase/client";

const sb = supabase as unknown as {
  from: (table: string) => ReturnType<typeof supabase.from>;
};

let tableExists: boolean | null = null;

async function checkTableExists(): Promise<boolean> {
  if (tableExists !== null) return tableExists;
  try {
    const { error } = await sb.from("call_logs").select("id").limit(1);
    tableExists = !error || error.code !== "42P01";
  } catch {
    tableExists = false;
  }
  return tableExists;
}

export function useCallLog() {
  const logCall = async ({
    orderId,
    customerPhone,
    customerName,
    channel,
  }: {
    orderId: string;
    customerPhone: string;
    customerName: string;
    channel: "whatsapp" | "phone";
  }): Promise<string> => {
    if (!(await checkTableExists())) return "";

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await sb
      .from("call_logs")
      .insert({
        merchant_id: user.id,
        order_id: orderId,
        customer_phone: customerPhone,
        customer_name: customerName,
        channel,
        outcome: "pending",
      })
      .select("id")
      .single();

    if (error) return "";
    return (data as { id: string }).id;
  };

  const updateOutcome = async (
    callLogId: string,
    outcome: "answered" | "no_answer" | "callback",
    note?: string,
  ): Promise<void> => {
    if (!(await checkTableExists())) return;

    const { error } = await sb
      .from("call_logs")
      .update({ outcome, note: note || null })
      .eq("id", callLogId);

    if (error) {
      console.warn("call_logs update failed:", error.message);
    }
  };

  const getLastCall = async (
    orderId: string,
  ): Promise<{ outcome: string; called_at: string; channel: string } | null> => {
    if (!(await checkTableExists())) return null;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await sb
      .from("call_logs")
      .select("outcome, called_at, channel")
      .eq("order_id", orderId)
      .eq("merchant_id", user.id)
      .order("called_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return null;
    return data as { outcome: string; called_at: string; channel: string } | null;
  };

  return { logCall, updateOutcome, getLastCall };
}
