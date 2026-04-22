import { Link, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  Store,
  Package,
  Tag,
  ShoppingBag,
  Users,
  Palette,
  Sparkles,
  BarChart3,
  Settings,
  ShieldCheck,
  FileText,
  Mail,
  Blocks,
  Database,
  ChevronDown,
  Wand2,
  Coins,
  Gift,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useInstalledApps } from "@/hooks/use-installed-apps";
import { APPS_BY_KEY } from "@/lib/apps";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

type NavItem = {
  title: string;
  url: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
  /** Tailwind gradient classes for the icon tile */
  gradient: string;
  /** When true, render as <a target="_blank"> instead of in-app <Link> */
  external?: boolean;
};


export function DashboardSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";
  const [isAdmin, setIsAdmin] = useState(false);
  const { installed } = useInstalledApps();
  const installedApps = Array.from(installed)
    .map((key) => APPS_BY_KEY[key])
    .filter(Boolean);
  const anyAppActive = pathname.startsWith("/dashboard/apps/");
  const [appsOpen, setAppsOpen] = useState(anyAppActive);
  useEffect(() => {
    if (anyAppActive) setAppsOpen(true);
  }, [anyAppActive]);

  const items: NavItem[] = [
    { title: t("dashboard.nav.dashboard"), url: "/dashboard", icon: LayoutDashboard, end: true },
    { title: t("dashboard.nav.store"), url: "/dashboard/store", icon: Store },
    { title: t("dashboard.nav.products"), url: "/dashboard/products", icon: Package },
    { title: t("dashboard.nav.categories"), url: "/dashboard/categories", icon: Tag },
    { title: t("dashboard.nav.orders"), url: "/dashboard/orders", icon: ShoppingBag },
    { title: t("dashboard.nav.customers"), url: "/dashboard/customers", icon: Users },
    { title: t("dashboard.nav.themePresets"), url: "/dashboard/theme-presets", icon: Sparkles },
    { title: t("dashboard.nav.database"), url: "/dashboard/database", icon: Database },
    { title: t("dashboard.nav.landingGenerator"), url: "/dashboard/landing-generator", icon: Wand2 },
    { title: t("dashboard.nav.credits"), url: "/dashboard/credits", icon: Coins },
    { title: t("dashboard.nav.referrals"), url: "/dashboard/referrals", icon: Gift },
    { title: t("dashboard.nav.customize"), url: "/customize", icon: Palette, external: true },
    { title: t("dashboard.nav.aboutPage"), url: "/dashboard/about", icon: FileText },
    { title: t("dashboard.nav.contactPage"), url: "/dashboard/contact", icon: Mail },
    { title: t("dashboard.nav.analytics"), url: "/dashboard/analytics", icon: BarChart3 },
    { title: t("dashboard.nav.appStore"), url: "/dashboard/apps", icon: Blocks },
    { title: t("dashboard.nav.settings"), url: "/dashboard/settings", icon: Settings },
  ];

  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [user]);

  const isActive = (url: string, end?: boolean) =>
    end ? pathname === url : pathname === url || pathname.startsWith(url + "/");

  return (
    <Sidebar
      collapsible="icon"
      side={isRtl ? "right" : "left"}
      className={isRtl ? "border-l border-sidebar-border" : "border-r border-sidebar-border"}
    >
      <SidebarHeader className="border-b border-sidebar-border">
        <Link to="/dashboard" className="flex items-center gap-2 px-2 py-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-brand shadow-glow shrink-0" />
          {!collapsed && (
            <span className="font-display font-semibold text-lg">Storely</span>
          )}
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("dashboard.groupWorkspace")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = !item.external && isActive(item.url, item.end);
                const linkClass = active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "hover:bg-sidebar-accent/60";
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                    >
                      {item.external ? (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={linkClass}
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </a>
                      ) : (
                        <Link to={item.url} className={linkClass}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {installedApps.length > 0 && (
          <Collapsible open={appsOpen} onOpenChange={setAppsOpen}>
            <SidebarGroup>
              <CollapsibleTrigger asChild>
                <SidebarGroupLabel
                  asChild
                  className="cursor-pointer hover:bg-sidebar-accent/40 rounded-md transition-colors"
                >
                  <button className="w-full flex items-center justify-between">
                    <span>{t("dashboard.groupApps")}</span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform ${appsOpen ? "" : "-rotate-90"}`}
                    />
                  </button>
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {installedApps.map((app) => {
                      const url = `/dashboard/apps/${app.key}`;
                      const active = pathname === url;
                      const Icon = app.icon;
                      return (
                        <SidebarMenuItem key={app.key}>
                          <SidebarMenuButton
                            asChild
                            isActive={active}
                            tooltip={app.name}
                          >
                            <Link
                              to={url}
                              className={
                                active
                                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                  : "hover:bg-sidebar-accent/60"
                              }
                            >
                              <Icon className="h-4 w-4" />
                              <span>{app.name}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        )}
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>{t("dashboard.groupAdmin")}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive("/dashboard/admin/payments")}
                    tooltip={t("dashboard.nav.payments")}
                  >
                    <Link
                      to="/dashboard/admin/payments"
                      className={
                        isActive("/dashboard/admin/payments")
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                          : "hover:bg-sidebar-accent/60"
                      }
                    >
                      <ShieldCheck className="h-4 w-4" />
                      <span>{t("dashboard.nav.payments")}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
