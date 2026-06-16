import { supabase } from "@/integrations/supabase/client";

const sb = supabase as unknown as {
  from: (table: string) => ReturnType<typeof supabase.from>;
};

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

    if (error) throw new Error(`Failed to log call: ${error.message}`);
    return (data as { id: string }).id;
  };

  const updateOutcome = async (
    callLogId: string,
    outcome: "answered" | "no_answer" | "callback",
    note?: string,
  ): Promise<void> => {
    const { error } = await sb
      .from("call_logs")
      .update({ outcome, note: note || null })
      .eq("id", callLogId);

    if (error) throw new Error(`Failed to update call outcome: ${error.message}`);
  };

  const getLastCall = async (
    orderId: string,
  ): Promise<{ outcome: string; called_at: string; channel: string } | null> => {
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

    if (error) throw new Error(`Failed to fetch last call: ${error.message}`);
    return data as { outcome: string; called_at: string; channel: string } | null;
  };

  return { logCall, updateOutcome, getLastCall };
}
