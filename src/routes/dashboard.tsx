import { createFileRoute, Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
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
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState<"fadeIn" | "fadeOut">(
    "fadeIn",
  );

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname) {
      setTransitionStage("fadeOut");
    }
  }, [location, displayLocation]);

  return (
    <>
      <style>{`
        @keyframes pageFadeIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pageFadeOut {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(-6px);
          }
        }

        .page-fade-in {
          animation: pageFadeIn 0.22s ease forwards;
        }

        .page-fade-out {
          animation: pageFadeOut 0.15s ease forwards;
        }
      `}</style>

      <div
        className={
          transitionStage === "fadeIn"
            ? "page-fade-in"
            : "page-fade-out"
        }
        onAnimationEnd={() => {
          if (transitionStage === "fadeOut") {
            setDisplayLocation(location);
            setTransitionStage("fadeIn");
          }
        }}
      >
        <Outlet />
      </div>
    </>
  );
}

function DashboardLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState<
    boolean | null
  >(null);

  const selectedStore = localStorage.getItem("selectedStore");

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/login" });
      return;
    }

    if (!loading && user && !selectedStore) {
      navigate({ to: "/select-store" });
    }
  }, [loading, user, selectedStore, navigate]);

  useEffect(() => {
    registerServiceWorker();
  }, []);

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
      <CurrentStoreProvider>
        <SidebarProvider>
          <div className="min-h-screen flex w-full bg-background">
            <DashboardSidebar />

            <SidebarInset className="flex-1 flex flex-col min-w-0">
              <IOSInstallBanner />

              <DashboardTopbar
                name={name}
                avatarUrl={avatarUrl}
              />

              <main className="flex-1 p-4 md:p-8">
                <AnimatedOutlet />
              </main>
            </SidebarInset>
          </div>

          <PaywallDialog />

          <Suspense fallback={null}>
            <WelcomeDialog userId={user.id} />
            <OnboardingTour userId={user.id} />
            <HelpChatbot />
          </Suspense>
        </SidebarProvider>
      </CurrentStoreProvider>
    </CreditsProvider>
  );
}
