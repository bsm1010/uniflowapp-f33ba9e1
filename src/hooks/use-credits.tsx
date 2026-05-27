import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type Plan = "free" | "basic" | "pro" | "business";

interface CreditsContextValue {
  credits: number;
  plan: Plan;
  referralCode: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
  showPaywall: boolean;
  setShowPaywall: (v: boolean) => void;
  triggerPaywall: () => void;
}

const Ctx = createContext<CreditsContextValue | undefined>(undefined);

export function CreditsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [credits, setCredits] = useState(0);
  const [plan, setPlan] = useState<Plan>("free");
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("credits, plan, referral_code")
      .eq("id", user.id)
      .maybeSingle();
    if (data) {
      setCredits(data.credits ?? 0);
      setPlan((data.plan as Plan) ?? "free");
      setReferralCode(data.referral_code ?? null);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    refresh();
    const channel = supabase
      .channel(`credits-${user.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${user.id}` },
        () => refresh(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refresh]);

  const triggerPaywall = useCallback(() => setShowPaywall(true), []);

  return (
    <Ctx.Provider
      value={{ credits, plan, referralCode, loading, refresh, showPaywall, setShowPaywall, triggerPaywall }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useCredits() {
  const ctx = useContext(Ctx);
  if (!ctx) {
    return {
      credits: 0,
      plan: "free" as Plan,
      referralCode: null,
      loading: false,
      refresh: async () => {},
      showPaywall: false,
      setShowPaywall: () => {},
      triggerPaywall: () => {},
    };
  }
  return ctx;
}

export const PLAN_LABELS: Record<Plan, string> = {
  free: "مجاني",
  basic: "أساسي",
  pro: "احترافي",
  business: "أعمال",
};

export const CREDIT_COSTS = {
  landingPage: 5,
  productDescription: 2,
  chatbotReply: 1,
  emailSendPer10: 1,
} as const;
