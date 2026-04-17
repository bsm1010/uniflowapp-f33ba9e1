import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";

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

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/login" });
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    const load = () => {
      supabase
        .from("profiles")
        .select("name, avatar_url")
        .eq("id", user.id)
        .maybeSingle()
        .then(({ data }) => {
          setName(data?.name ?? "");
          setAvatarUrl(data?.avatar_url ?? null);
        });
    };
    load();
    const handler = () => load();
    window.addEventListener("profile:updated", handler);
    return () => window.removeEventListener("profile:updated", handler);
  }, [user]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
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
    </SidebarProvider>
  );
}
