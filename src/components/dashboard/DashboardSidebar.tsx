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
  Mic,
  Truck,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import fennecyIcon from "@/assets/fennecly-icon.webp";
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

  const items: (NavItem & { tourId?: string })[] = [
    { title: t("dashboard.nav.dashboard"), url: "/dashboard", icon: LayoutDashboard, end: true, gradient: "from-violet-500 to-fuchsia-500", tourId: "dashboard" },
    { title: t("dashboard.nav.store"), url: "/dashboard/store", icon: Store, gradient: "from-indigo-500 to-blue-500" },
    { title: t("dashboard.nav.products"), url: "/dashboard/products", icon: Package, gradient: "from-emerald-500 to-teal-500", tourId: "products" },
    { title: t("dashboard.nav.categories"), url: "/dashboard/categories", icon: Tag, gradient: "from-amber-500 to-orange-500" },
    { title: t("dashboard.nav.orders"), url: "/dashboard/orders", icon: ShoppingBag, gradient: "from-pink-500 to-rose-500", tourId: "orders" },
    { title: "Shipping", url: "/dashboard/shipping", icon: Truck, gradient: "from-green-500 to-emerald-500", tourId: "shipping" },
    { title: "Shipments", url: "/dashboard/shipments", icon: Package, gradient: "from-sky-500 to-indigo-500" },
    { title: t("dashboard.nav.customers"), url: "/dashboard/customers", icon: Users, gradient: "from-sky-500 to-cyan-500" },
    { title: t("dashboard.nav.themePresets"), url: "/dashboard/theme-presets", icon: Sparkles, gradient: "from-fuchsia-500 to-purple-500" },
    { title: t("dashboard.nav.database"), url: "/dashboard/database", icon: Database, gradient: "from-slate-600 to-slate-800" },
    { title: t("dashboard.nav.landingGenerator"), url: "/dashboard/landing-generator", icon: Wand2, gradient: "from-purple-500 to-indigo-500" },
    { title: "AI Voice Generator", url: "/dashboard/voice-generator", icon: Mic, gradient: "from-pink-500 to-purple-500" },
    { title: t("dashboard.nav.credits"), url: "/dashboard/credits", icon: Coins, gradient: "from-yellow-500 to-amber-500" },
    { title: t("dashboard.nav.referrals"), url: "/dashboard/referrals", icon: Gift, gradient: "from-rose-500 to-pink-500" },
    { title: t("dashboard.nav.customize"), url: "/customize", icon: Palette, external: true, gradient: "from-teal-500 to-emerald-500", tourId: "customize" },
    { title: t("dashboard.nav.aboutPage"), url: "/dashboard/about", icon: FileText, gradient: "from-blue-500 to-sky-500" },
    { title: t("dashboard.nav.contactPage"), url: "/dashboard/contact", icon: Mail, gradient: "from-cyan-500 to-blue-500" },
    { title: t("dashboard.nav.analytics"), url: "/dashboard/analytics", icon: BarChart3, gradient: "from-orange-500 to-red-500" },
    { title: t("dashboard.nav.appStore"), url: "/dashboard/apps", icon: Blocks, gradient: "from-violet-500 to-purple-500" },
    { title: t("dashboard.nav.settings"), url: "/dashboard/settings", icon: Settings, gradient: "from-zinc-500 to-slate-600" },
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

  const renderIcon = (Icon: typeof LayoutDashboard, gradient: string, active: boolean) => (
    <span
      className={`relative flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${gradient} text-white shadow-sm transition-all duration-200 ${
        active ? "shadow-md scale-105" : "opacity-85 group-hover/menu-item:opacity-100 group-hover/menu-item:scale-105"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
    </span>
  );

  return (
    <Sidebar
      collapsible="icon"
      side={isRtl ? "right" : "left"}
      className={`bg-gradient-to-b from-sidebar to-sidebar/95 ${isRtl ? "border-l border-sidebar-border" : "border-r border-sidebar-border"}`}
    >
      <SidebarHeader className="border-b border-sidebar-border/60 bg-sidebar/40 backdrop-blur-sm">
        <Link to="/dashboard" className="flex items-center gap-2.5 px-2 py-2.5 group">
          <div className="relative h-10 w-10 shrink-0 flex items-center justify-center">
            <img
              src={fennecyIcon}
              alt="Fennecly"
              width={40}
              height={40}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="h-10 w-10 object-contain transition-transform group-hover:scale-105 dark:brightness-0 dark:invert"
            />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="font-display font-bold text-lg bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Fennecly
              </span>
              <span className="text-[10px] text-muted-foreground font-medium tracking-wide uppercase">
                Dashboard
              </span>
            </div>
          )}
        </Link>
      </SidebarHeader>
      <SidebarContent className="px-1.5 py-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 px-2">
            {t("dashboard.groupWorkspace")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {items.map((item) => {
                const active = !item.external && isActive(item.url, item.end);
                const linkClass = `group/menu-item relative rounded-lg transition-all duration-200 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:!p-0 ${
                  active
                    ? "bg-gradient-to-r from-sidebar-accent to-sidebar-accent/40 text-sidebar-accent-foreground font-medium shadow-sm"
                    : "hover:bg-sidebar-accent/50"
                }`;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                      className="h-9"
                    >
                      {item.external ? (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={linkClass}
                        >
                          {renderIcon(item.icon, item.gradient, active)}
                          <span className="text-sm">{item.title}</span>
                        </a>
                      ) : (
                        <Link to={item.url} className={linkClass}>
                          {active && (
                            <span
                              className={`absolute ${isRtl ? "right-0" : "left-0"} top-1.5 bottom-1.5 w-0.5 rounded-full bg-gradient-to-b ${item.gradient}`}
                            />
                          )}
                          {renderIcon(item.icon, item.gradient, active)}
                          <span className="text-sm">{item.title}</span>
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
                  className="cursor-pointer hover:bg-sidebar-accent/40 rounded-md transition-colors text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70"
                >
                  <button className="w-full flex items-center justify-between px-2">
                    <span>{t("dashboard.groupApps")}</span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform ${appsOpen ? "" : "-rotate-90"}`}
                    />
                  </button>
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu className="gap-0.5">
                    {installedApps.map((app) => {
                      const url = `/dashboard/apps/${app.key}`;
                      const active = pathname === url;
                      const Icon = app.icon;
                      const gradient = "from-violet-500 to-fuchsia-500";
                      return (
                        <SidebarMenuItem key={app.key}>
                          <SidebarMenuButton
                            asChild
                            isActive={active}
                            tooltip={app.name}
                            className="h-9"
                          >
                            <Link
                              to={url}
                              className={`group/menu-item relative rounded-lg transition-all duration-200 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:!p-0 ${
                                active
                                  ? "bg-gradient-to-r from-sidebar-accent to-sidebar-accent/40 text-sidebar-accent-foreground font-medium shadow-sm"
                                  : "hover:bg-sidebar-accent/50"
                              }`}
                            >
                              {renderIcon(Icon, gradient, active)}
                              <span className="text-sm">{app.name}</span>
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
            <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 px-2">
              {t("dashboard.groupAdmin")}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive("/dashboard/admin/payments")}
                    tooltip={t("dashboard.nav.payments")}
                    className="h-9"
                  >
                    <Link
                      to="/dashboard/admin/payments"
                      className={`group/menu-item relative rounded-lg transition-all duration-200 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:!p-0 ${
                        isActive("/dashboard/admin/payments")
                          ? "bg-gradient-to-r from-sidebar-accent to-sidebar-accent/40 text-sidebar-accent-foreground font-medium shadow-sm"
                          : "hover:bg-sidebar-accent/50"
                      }`}
                    >
                      {renderIcon(ShieldCheck, "from-red-500 to-orange-500", isActive("/dashboard/admin/payments"))}
                      <span className="text-sm">{t("dashboard.nav.payments")}</span>
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
