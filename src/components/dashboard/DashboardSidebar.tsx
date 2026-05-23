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
  Bot,
  Globe,
  Layers,
  RotateCcw,
  AlertTriangle,
  Bell,
  Store as StoreIcon,
  Code2,
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
  gradient: string;
  external?: boolean;
  tourId?: string;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

export function DashboardSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const { pathname } = useLocation();

  const { user } = useAuth();

  const { t, i18n } = useTranslation();

  const isRtl = i18n.dir() === "rtl";

  const [isAdmin, setIsAdmin] = useState(false);

  // SIDEBAR THEME
  const [sidebarTheme, setSidebarTheme] = useState<
    "light" | "purple"
  >("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("sidebar-theme");

    if (savedTheme === "purple") {
      setSidebarTheme("purple");
    }
  }, []);

  const isPurple = sidebarTheme === "purple";

  const toggleSidebarTheme = () => {
    const newTheme = isPurple ? "light" : "purple";

    setSidebarTheme(newTheme);

    localStorage.setItem("sidebar-theme", newTheme);
  };

  const { installed } = useInstalledApps();

  const installedApps = Array.from(installed)
    .map((key) => APPS_BY_KEY[key])
    .filter(Boolean);

  const anyAppActive = pathname.startsWith("/dashboard/apps/");

  const [appsOpen, setAppsOpen] = useState(anyAppActive);

  useEffect(() => {
    if (anyAppActive) setAppsOpen(true);
  }, [anyAppActive]);

  const groups: NavGroup[] = [
    {
      label: "Workspace",
      items: [
        {
          title: t("dashboard.nav.dashboard"),
          url: "/dashboard",
          icon: LayoutDashboard,
          end: true,
          gradient: "from-violet-500 to-fuchsia-500",
        },
        {
          title: t("dashboard.nav.store"),
          url: "/dashboard/store",
          icon: Store,
          gradient: "from-indigo-500 to-blue-500",
        },
        {
          title: "Notifications",
          url: "/dashboard/notifications",
          icon: Bell,
          gradient: "from-violet-500 to-indigo-500",
        },
      ],
    },
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
    end
      ? pathname === url
      : pathname === url || pathname.startsWith(url + "/");

  const renderIcon = (
    Icon: typeof LayoutDashboard,
    gradient: string,
    active: boolean
  ) => (
    <span
      className={`relative flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${gradient} text-white shadow-sm transition-all duration-200 ${
        active
          ? "shadow-md scale-105"
          : "opacity-85 group-hover/menu-item:opacity-100 group-hover/menu-item:scale-105"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
    </span>
  );

  const renderMenuItem = (item: NavItem) => {
    const active = !item.external && isActive(item.url, item.end);

    const linkClass = `group/menu-item relative rounded-lg transition-all duration-200 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:!p-0 ${
      active
        ? isPurple
          ? "bg-white/10 text-white font-medium shadow-sm"
          : "bg-purple-100 text-purple-700 font-medium shadow-sm"
        : isPurple
        ? "hover:bg-white/10 text-white/90"
        : "hover:bg-purple-50"
    }`;

    return (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton
          asChild
          isActive={active}
          tooltip={item.title}
          className="h-9"
        >
          <Link to={item.url} className={linkClass}>
            {active && (
              <span
                className={`absolute ${
                  isRtl ? "right-0" : "left-0"
                } top-1.5 bottom-1.5 w-0.5 rounded-full bg-gradient-to-b ${
                  item.gradient
                }`}
              />
            )}

            {renderIcon(item.icon, item.gradient, active)}

            <span
              className={`text-sm ${
                isPurple ? "text-white" : "text-black"
              }`}
            >
              {item.title}
            </span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar
      collapsible="icon"
      side={isRtl ? "right" : "left"}
      className={`transition-all duration-300 ${
        isPurple
          ? "bg-gradient-to-b from-purple-900 via-violet-900 to-purple-800 text-white"
          : "bg-white text-black"
      } ${isRtl ? "border-l" : "border-r"} ${
        isPurple ? "border-purple-700" : "border-zinc-200"
      }`}
    >
      <SidebarHeader className="bg-transparent">
        <Link
          to="/dashboard"
          className="flex items-center gap-2.5 px-2 py-2.5 group"
        >
          <div className="relative h-10 w-10 shrink-0 flex items-center justify-center">
            <img
              src={fennecyIcon}
              alt="Fennecly"
              width={40}
              height={40}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="h-10 w-10 object-contain transition-transform group-hover:scale-105"
            />
          </div>

          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span
                className={`font-display font-bold text-lg ${
                  isPurple ? "text-white" : "text-black"
                }`}
              >
                Fennecly
              </span>

              <span
                className={`text-[10px] font-medium tracking-wide uppercase ${
                  isPurple
                    ? "text-white/70"
                    : "text-muted-foreground"
                }`}
              >
                Dashboard
              </span>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-1.5 py-2">
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel
              className={`text-[10px] font-semibold uppercase tracking-wider px-2 ${
                isPurple
                  ? "text-white/50"
                  : "text-muted-foreground/70"
              }`}
            >
              {group.label}
            </SidebarGroupLabel>

            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {group.items.map(renderMenuItem)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        {installedApps.length > 0 && (
          <Collapsible open={appsOpen} onOpenChange={setAppsOpen}>
            <SidebarGroup>
              <CollapsibleTrigger asChild>
                <SidebarGroupLabel
                  asChild
                  className={`cursor-pointer rounded-md transition-colors text-[10px] font-semibold uppercase tracking-wider ${
                    isPurple
                      ? "text-white/50 hover:bg-white/10"
                      : "text-muted-foreground/70 hover:bg-purple-50"
                  }`}
                >
                  <button className="w-full flex items-center justify-between px-2">
                    <span>{t("dashboard.groupApps")}</span>

                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform ${
                        appsOpen ? "" : "-rotate-90"
                      }`}
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
                              className={`group/menu-item relative rounded-lg transition-all duration-200 ${
                                active
                                  ? isPurple
                                    ? "bg-white/10 text-white"
                                    : "bg-purple-100 text-purple-700"
                                  : isPurple
                                  ? "hover:bg-white/10"
                                  : "hover:bg-purple-50"
                              }`}
                            >
                              {renderIcon(
                                Icon,
                                "from-violet-500 to-fuchsia-500",
                                active
                              )}

                              <span
                                className={`text-sm ${
                                  isPurple
                                    ? "text-white"
                                    : "text-black"
                                }`}
                              >
                                {app.name}
                              </span>
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

        <div className="px-3 py-3 mt-3">
          <button
            onClick={toggleSidebarTheme}
            className={`w-full rounded-xl py-2 text-sm font-medium transition-all duration-300 ${
              isPurple
                ? "bg-white/10 text-white hover:bg-white/20"
                : "bg-purple-100 text-purple-700 hover:bg-purple-200"
            }`}
          >
            {isPurple
              ? "Switch To White Sidebar"
              : "Switch To Purple Sidebar"}
          </button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
