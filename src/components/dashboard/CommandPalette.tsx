import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Command } from "cmdk";
import {
  Search,
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  BarChart3,
  Settings,
  Store,
  Tag,
  Truck,
  Palette,
  Sparkles,
  Globe,
  Database,
  Blocks,
  Coins,
  Gift,
  FileText,
  Mail,
  Bot,
  Mic,
  Wand2,
  Bell,
  Trophy,
  Zap,
  Flame,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

type NavItem = {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  keywords: string;
  section: string;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Overview", to: "/dashboard", icon: LayoutDashboard, keywords: "home overview dashboard", section: "Navigation" },
  { label: "Products", to: "/dashboard/products", icon: Package, keywords: "products items inventory", section: "Navigation" },
  { label: "Categories", to: "/dashboard/categories", icon: Tag, keywords: "categories tags", section: "Navigation" },
  { label: "Orders", to: "/dashboard/orders", icon: ShoppingBag, keywords: "orders sales purchases", section: "Navigation" },
  { label: "Customers", to: "/dashboard/customers", icon: Users, keywords: "customers clients buyers", section: "Navigation" },
  { label: "Shipments", to: "/dashboard/shipments", icon: Truck, keywords: "shipments delivery tracking", section: "Navigation" },
  { label: "Analytics", to: "/dashboard/analytics", icon: BarChart3, keywords: "analytics stats reports", section: "Navigation" },
  { label: "Store", to: "/dashboard/store", icon: Store, keywords: "store storefront settings", section: "Navigation" },
  { label: "Customize", to: "/customize", icon: Palette, keywords: "customize design editor theme", section: "Navigation" },
  { label: "Notifications", to: "/dashboard/notifications", icon: Bell, keywords: "notifications alerts", section: "Navigation" },
  { label: "Settings", to: "/dashboard/settings", icon: Settings, keywords: "settings account profile", section: "Navigation" },
  { label: "Shipping", to: "/dashboard/shipping", icon: Truck, keywords: "shipping rates delivery", section: "Navigation" },
  { label: "Database", to: "/dashboard/database", icon: Database, keywords: "database tables data", section: "Navigation" },
  { label: "App Store", to: "/dashboard/apps", icon: Blocks, keywords: "apps marketplace integrations", section: "Navigation" },
  { label: "Credits", to: "/dashboard/credits", icon: Coins, keywords: "credits billing payment", section: "Navigation" },
  { label: "Referrals", to: "/dashboard/referrals", icon: Gift, keywords: "referrals invite friends", section: "Navigation" },
  { label: "Progress Hub", to: "/dashboard/gamification", icon: Zap, keywords: "progress gamification", section: "Navigation" },
  { label: "Quests", to: "/dashboard/quests", icon: Flame, keywords: "quests challenges", section: "Navigation" },
  { label: "Achievements", to: "/dashboard/achievements", icon: Trophy, keywords: "achievements badges", section: "Navigation" },
  { label: "AI Sales Agent", to: "/dashboard/ai-agent", icon: Bot, keywords: "ai agent chatbot", section: "AI Tools" },
  { label: "Landing Generator", to: "/dashboard/landing-generator", icon: Wand2, keywords: "landing page generator ai", section: "AI Tools" },
  { label: "AI Voice Generator", to: "/dashboard/voice-generator", icon: Mic, keywords: "voice ai audio tts", section: "AI Tools" },
  { label: "About Page", to: "/dashboard/about", icon: FileText, keywords: "about page info", section: "Pages" },
  { label: "Contact Page", to: "/dashboard/contact", icon: Mail, keywords: "contact support help", section: "Pages" },
  { label: "Custom Domains", to: "/dashboard/domains", icon: Globe, keywords: "domains custom url", section: "Settings" },
  { label: "GDPR & Privacy", to: "/dashboard/gdpr", icon: Globe, keywords: "gdpr privacy compliance", section: "Settings" },
  { label: "Store Settings", to: "/dashboard/store-settings", icon: Store, keywords: "store settings configuration", section: "Settings" },
  { label: "Theme Presets", to: "/dashboard/theme-presets", icon: Sparkles, keywords: "themes presets templates", section: "Design" },
  { label: "Theme Manager", to: "/dashboard/theme-manager", icon: Palette, keywords: "theme manager customize", section: "Design" },
];

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", handler);

    const openHandler = () => onOpenChange(true);
    document.addEventListener("command-palette:open", openHandler);

    return () => {
      document.removeEventListener("keydown", handler);
      document.removeEventListener("command-palette:open", openHandler);
    };
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return NAV_ITEMS;
    return NAV_ITEMS.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.keywords.toLowerCase().includes(q) ||
        item.section.toLowerCase().includes(q),
    );
  }, [query]);

  const grouped = useMemo(() => {
    const map = new Map<string, NavItem[]>();
    for (const item of filtered) {
      const arr = map.get(item.section) ?? [];
      arr.push(item);
      map.set(item.section, arr);
    }
    return map;
  }, [filtered]);

  const handleSelect = (to: string) => {
    onOpenChange(false);
    if (to.startsWith("http")) {
      window.open(to, "_blank");
    } else {
      navigate({ to });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-w-lg gap-0 overflow-hidden rounded-2xl border-border/50 shadow-2xl">
        <Command
          className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted-foreground/60"
          shouldFilter={true}
        >
          <div className="flex items-center gap-3 border-b border-border/50 px-4">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder={t("dashboard.searchPh")}
              className="flex h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
              autoFocus
            />
            <kbd className="pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border/50 bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground/60">
              ESC
            </kbd>
          </div>
          <Command.List className="max-h-[360px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </Command.Empty>
            {Array.from(grouped.entries()).map(([section, items]) => (
              <Command.Group key={section} heading={section}>
                {items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Command.Item
                      key={item.to}
                      value={item.label}
                      onSelect={() => handleSelect(item.to)}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm cursor-pointer transition-colors data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
                    >
                      <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <span className="flex-1 truncate font-medium">{item.label}</span>
                      <span className="text-xs text-muted-foreground/50 truncate max-w-[140px]">
                        {item.to}
                      </span>
                    </Command.Item>
                  );
                })}
              </Command.Group>
            ))}
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
