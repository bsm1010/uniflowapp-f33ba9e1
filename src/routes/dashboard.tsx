import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";
import { OnboardingWizard } from "@/components/dashboard/OnboardingWizard";
import { CreditsProvider } from "@/hooks/use-credits";
import { PaywallDialog } from "@/components/dashboard/PaywallDialog";
import { CurrentStoreProvider } from "@/hooks/use-current-store";
import { IOSInstallBanner } from "@/components/dashboard/IOSInstallBanner";
import { registerServiceWorker } from "@/lib/pwa/register-sw";
import { playSound } from "@/lib/sounds";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const WelcomeDialog = lazy(() =>
  import("@/components/dashboard/WelcomeDialog").then((m) => ({
    default: m.WelcomeDialog,
  })),
);

const OnboardingTour = lazy(() =>
  import("@/components/dashboard/OnboardingTour").then((m) => ({
    default: m.OnboardingTour,
  })),
);

import { LogoLoader } from "@/components/ui/logo-loader";

const HelpChatbot = lazy(() =>
  import("@/components/dashboard/HelpChatbot").then((m) => ({
    default: m.HelpChatbot,
  })),
);

const AICopilot = lazy(() =>
  import("@/components/dashboard/AICopilot").then((m) => ({
    default: m.AICopilot,
  })),
);

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
  head: () => ({
    meta: [
      { title: "Dashboard — Fennecly" },
      {
        name: "description",
        content: "Manage your Fennecly store.",
      },
    ],
  }),
});

function AnimatedOutlet() {
  return (
    <div className="page-fade-in">
      <Outlet />
    </div>
  );
}

function DashboardLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
    [],
  );

  const [profile, setProfile] = useState<{
    name: string;
    avatarUrl: string | null;
    onboardingCompleted: boolean | null;
  }>({ name: "", avatarUrl: null, onboardingCompleted: null });

  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [storeHydrated, setStoreHydrated] = useState(false);

  useEffect(() => {
    try {
      setSelectedStore(localStorage.getItem("selectedStore"));
    } catch (error) {
      console.warn(error);
    }
    setStoreHydrated(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!loading && !user) {
      navigate({ to: "/login" });
      return;
    }

    if (!loading && user && storeHydrated && !selectedStore) {
      navigate({ to: "/select-store" });
    }
  }, [loading, user, selectedStore, storeHydrated, navigate]);

  useEffect(() => {
    registerServiceWorker();
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const el = (e.target as Element)?.closest("[data-sound]");
      if (!el) return;
      playSound(el.getAttribute("data-sound") as any);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("name, avatar_url, onboarding_completed")
        .eq("id", user.id)
        .maybeSingle();

      setProfile({
        name: data?.name ?? "",
        avatarUrl: data?.avatar_url ?? null,
        onboardingCompleted: data?.onboarding_completed ?? false,
      });
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

  const showWizard = profile.onboardingCompleted === false;
  const isLoadingOnboarding = profile.onboardingCompleted === null;

  if (isLoadingOnboarding) {
    return <LogoLoader />;
  }

  if (showWizard) {
    return (
      <div className="min-h-screen bg-background">
          <OnboardingWizard
            userId={user.id}
            initialName={profile.name}
            onComplete={() => setProfile((p) => ({ ...p, onboardingCompleted: true }))}
          />
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <CreditsProvider>
        <CurrentStoreProvider>
          <SidebarProvider>
            <div className="min-h-screen flex w-full bg-background">
              <DashboardSidebar />

              <SidebarInset className="flex-1 flex flex-col min-w-0">
                <IOSInstallBanner />

                <DashboardTopbar name={profile.name} avatarUrl={profile.avatarUrl} />

                <main className="flex-1 p-4 md:p-8 min-h-0 overflow-y-auto overflow-x-hidden">
                  <AnimatedOutlet />
                </main>
              </SidebarInset>
            </div>

            <PaywallDialog />

            <Suspense fallback={null}>
              <WelcomeDialog userId={user.id} />
              <OnboardingTour userId={user.id} />
              <HelpChatbot />
              <AICopilot />
            </Suspense>
          </SidebarProvider>
        </CurrentStoreProvider>
      </CreditsProvider>
    </QueryClientProvider>
  );
}
