import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";
import { OnboardingWizard } from "@/components/dashboard/OnboardingWizard";
import { CreditsProvider } from "@/hooks/use-credits";
import { PaywallDialog } from "@/components/dashboard/PaywallDialog";
import { WelcomeDialog } from "@/components/dashboard/WelcomeDialog";

import { LogoLoader } from "@/components/ui/logo-loader";

// Defer the help chatbot — it's not needed for first paint.
const HelpChatbot = lazy(() =>
  import("@/components/dashboard/HelpChatbot").then((m) => ({ default: m.HelpChatbot })),
);

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
        .select("name, avatar_url, onboarding_completed")
        .eq("id", user.id)
        .maybeSingle();

      setName(data?.name ?? "");
      setAvatarUrl(data?.avatar_url ?? null);
      setOnboardingCompleted(data?.onboarding_completed ?? false);
    };
    load();
    const handler = () => load();
    window.addEventListener("profile:updated", handler);
    return () => {
      window.removeEventListener("profile:updated", handler);
    };
  }, [user]);

  if (loading && !user) {
    return <LogoLoader />;
  }

  if (!user) return null;

  const showWizard = onboardingCompleted === false;
  const isLoadingOnboarding = onboardingCompleted === null;

  if (isLoadingOnboarding) {
    return <LogoLoader />;
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

  return (
    <CreditsProvider>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <DashboardSidebar />
          <SidebarInset className="flex-1 flex flex-col min-w-0">
            <DashboardTopbar name={name} avatarUrl={avatarUrl} />
            <main className="flex-1 p-4 md:p-8">
              <Outlet />
            </main>
          </SidebarInset>
        </div>
        <PaywallDialog />
        <WelcomeDialog userId={user.id} />
        <Suspense fallback={null}>
          <HelpChatbot />
        </Suspense>
      </SidebarProvider>
    </CreditsProvider>
  );
}
