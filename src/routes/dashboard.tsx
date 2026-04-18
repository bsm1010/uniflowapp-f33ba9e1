import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";
import { TrialBanner } from "@/components/dashboard/TrialBanner";
import { OnboardingWizard } from "@/components/dashboard/OnboardingWizard";
import { SubscriptionProvider } from "@/hooks/use-subscription";

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
  head: () => ({
    meta: [
      { title: "Dashboard — Storely" },
      { name: "description", content: "Manage your Storely store." },
    ],
  }),
});

function DashboardLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [trialEndDate, setTrialEndDate] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>("trial");
  const [hadPaidSubscription, setHadPaidSubscription] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/login" });
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("profiles")
        .select(
          "name, avatar_url, trial_end_date, subscription_status, subscription_end_date, onboarding_completed",
        )
        .eq("id", user.id)
        .maybeSingle();

      setName(data?.name ?? "");
      setAvatarUrl(data?.avatar_url ?? null);
      setTrialEndDate(data?.trial_end_date ?? null);
      setOnboardingCompleted(data?.onboarding_completed ?? false);

      let status = data?.subscription_status ?? "trial";
      const now = new Date();

      // Auto-expire trial
      if (
        status === "trial" &&
        data?.trial_end_date &&
        new Date(data.trial_end_date) < now
      ) {
        await supabase
          .from("profiles")
          .update({ subscription_status: "expired" })
          .eq("id", user.id);
        status = "expired";
      }

      // Auto-expire active subscription past its end date
      if (
        status === "active" &&
        data?.subscription_end_date &&
        new Date(data.subscription_end_date) < now
      ) {
        await supabase
          .from("profiles")
          .update({ subscription_status: "expired" })
          .eq("id", user.id);
        status = "expired";
      }

      setHadPaidSubscription(!!data?.subscription_end_date);
      setSubscriptionStatus(status);
    };
    load();
    const handler = () => load();
    window.addEventListener("profile:updated", handler);

    // Realtime: refresh when our profile row changes (e.g., admin approval)
    const channel = supabase
      .channel(`profile-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${user.id}`,
        },
        () => load(),
      )
      .subscribe();

    return () => {
      window.removeEventListener("profile:updated", handler);
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  // Block access while onboarding flag is loading or not completed
  const showWizard = onboardingCompleted === false;
  const isLoadingOnboarding = onboardingCompleted === null;

  if (isLoadingOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (showWizard) {
    return (
      <div className="min-h-screen bg-background">
        <OnboardingWizard
          userId={user.id}
          initialName={name}
          onComplete={() => setOnboardingCompleted(true)}
        />
      </div>
    );
  }

  const daysRemaining = trialEndDate
    ? Math.max(
        0,
        Math.ceil(
          (new Date(trialEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
        ),
      )
    : 0;

  const isExpired = subscriptionStatus === "expired";

  return (
    <SubscriptionProvider
      value={{
        status: subscriptionStatus,
        isExpired,
        daysRemaining,
        hadPaidSubscription,
      }}
    >
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <DashboardSidebar />
          <SidebarInset className="flex-1 flex flex-col min-w-0">
            <DashboardTopbar name={name} avatarUrl={avatarUrl} />
            <TrialBanner
              status={subscriptionStatus}
              daysRemaining={daysRemaining}
              hadPaidSubscription={hadPaidSubscription}
            />
            <main className="flex-1 p-4 md:p-8">
              <Outlet />
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </SubscriptionProvider>
  );
}
