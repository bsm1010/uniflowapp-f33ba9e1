import { useNavigate } from "@tanstack/react-router";
import { LogOut, Search, User as UserIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useEffect, useMemo, useRef, useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { NotificationsBell } from "./NotificationsBell";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageSwitcher } from "@/components/landing/LanguageSwitcher";
import { CreditsBadge } from "./CreditsBadge";

type SearchTarget = { label: string; to: string; keywords: string };

export function DashboardTopbar({ name, avatarUrl }: { name: string; avatarUrl?: string | null }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const targets: SearchTarget[] = useMemo(
    () => [
      { label: t("dashboard.nav.overview", { defaultValue: "Overview" }), to: "/dashboard", keywords: "home overview dashboard" },
      { label: t("dashboard.nav.products", { defaultValue: "Products" }), to: "/dashboard/products", keywords: "products items inventory catalog" },
      { label: t("dashboard.nav.categories", { defaultValue: "Categories" }), to: "/dashboard/categories", keywords: "categories tags" },
      { label: t("dashboard.nav.orders", { defaultValue: "Orders" }), to: "/dashboard/orders", keywords: "orders sales purchases" },
      { label: t("dashboard.nav.customers", { defaultValue: "Customers" }), to: "/dashboard/customers", keywords: "customers clients buyers" },
      { label: t("dashboard.nav.shipments", { defaultValue: "Shipments" }), to: "/dashboard/shipments", keywords: "shipments delivery tracking" },
      { label: t("dashboard.nav.delivery", { defaultValue: "Delivery" }), to: "/dashboard/delivery", keywords: "delivery yalidine zr express tariffs" },
      { label: t("dashboard.nav.shipping", { defaultValue: "Shipping" }), to: "/dashboard/shipping", keywords: "shipping rates" },
      { label: t("dashboard.nav.store", { defaultValue: "Store" }), to: "/dashboard/store", keywords: "store storefront settings" },
      { label: t("dashboard.nav.themes", { defaultValue: "Themes" }), to: "/dashboard/themes", keywords: "themes design colors" },
      { label: t("dashboard.nav.themePresets", { defaultValue: "Theme Presets" }), to: "/dashboard/theme-presets", keywords: "presets templates" },
      { label: t("dashboard.nav.customize", { defaultValue: "Customize" }), to: "/customize", keywords: "customize design editor" },
      { label: t("dashboard.nav.analytics", { defaultValue: "Analytics" }), to: "/dashboard/analytics", keywords: "analytics stats reports" },
      { label: t("dashboard.nav.database", { defaultValue: "Database" }), to: "/dashboard/database", keywords: "database tables data" },
      { label: t("dashboard.nav.apps", { defaultValue: "Apps" }), to: "/dashboard/apps", keywords: "apps marketplace integrations" },
      { label: t("dashboard.nav.credits", { defaultValue: "Credits" }), to: "/dashboard/credits", keywords: "credits billing" },
      { label: t("dashboard.nav.upgrade", { defaultValue: "Upgrade" }), to: "/dashboard/upgrade", keywords: "upgrade plan pricing subscription" },
      { label: t("dashboard.nav.referrals", { defaultValue: "Referrals" }), to: "/dashboard/referrals", keywords: "referrals invite friends" },
      { label: t("dashboard.nav.settings", { defaultValue: "Settings" }), to: "/dashboard/settings", keywords: "settings account profile" },
      { label: t("dashboard.nav.about", { defaultValue: "About" }), to: "/dashboard/about", keywords: "about info" },
      { label: t("dashboard.nav.contact", { defaultValue: "Contact" }), to: "/dashboard/contact", keywords: "contact support help" },
      { label: "AI Descriptions", to: "/dashboard/apps/ai-descriptions", keywords: "ai descriptions generator products" },
      { label: "Landing Generator", to: "/dashboard/landing-generator", keywords: "landing page generator ai" },
      { label: "Voice Generator", to: "/dashboard/voice-generator", keywords: "voice ai audio tts" },
      { label: "Email Marketing", to: "/dashboard/apps/email-marketing", keywords: "email marketing campaigns" },
      { label: "Abandoned Cart", to: "/dashboard/apps/abandoned-cart", keywords: "abandoned cart recovery" },
      { label: "Discount Generator", to: "/dashboard/apps/discount-generator", keywords: "discounts coupons codes" },
      { label: "Popup Builder", to: "/dashboard/apps/popup-builder", keywords: "popup modal builder" },
      { label: "SEO Optimizer", to: "/dashboard/apps/seo-optimizer", keywords: "seo meta optimization" },
      { label: "Chatbot", to: "/dashboard/apps/chatbot", keywords: "chatbot ai assistant" },
      { label: "Multi-language", to: "/dashboard/apps/multi-language", keywords: "translation multilingual i18n" },
      { label: "Currency Converter", to: "/dashboard/apps/currency-converter", keywords: "currency converter exchange" },
    ],
    [t],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return targets
      .filter((tg) => tg.label.toLowerCase().includes(q) || tg.keywords.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, targets]);

  useEffect(() => {
    setActiveIdx(0);
  }, [query]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const initials = (name || user?.email || "U")
    .split(/[\s@]/)[0]
    .slice(0, 2)
    .toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  const goTo = (to: string) => {
    setOpen(false);
    setQuery("");
    navigate({ to });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      goTo(results[activeIdx].to);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <header className="h-16 border-b border-border/60 bg-background/80 backdrop-blur-xl sticky top-0 z-30 flex items-center gap-3 px-4">
      <SidebarTrigger />
      <div className="hidden md:flex items-center gap-2 max-w-md flex-1">
        <div className="relative w-full" ref={containerRef}>
          <Search className="pointer-events-none absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground start-3" />
          <Input
            placeholder={t("dashboard.searchPh")}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => query && setOpen(true)}
            onKeyDown={onKeyDown}
            className="ps-9 bg-muted/50 border-transparent focus-visible:bg-background"
          />
          {open && query && (
            <div className="absolute left-0 right-0 top-full mt-2 rounded-lg border border-border bg-popover shadow-lg overflow-hidden z-40">
              {results.length === 0 ? (
                <div className="px-3 py-3 text-sm text-muted-foreground">
                  {t("dashboard.noResults", { defaultValue: "No results" })}
                </div>
              ) : (
                <ul className="max-h-80 overflow-y-auto py-1">
                  {results.map((r, idx) => (
                    <li key={r.to}>
                      <button
                        type="button"
                        onMouseEnter={() => setActiveIdx(idx)}
                        onClick={() => goTo(r.to)}
                        className={`w-full text-start px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
                          idx === activeIdx ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
                        }`}
                      >
                        <Search className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="flex-1 truncate">{r.label}</span>
                        <span className="text-xs text-muted-foreground truncate">{r.to}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-2 ms-auto">
        <CreditsBadge />
        <LanguageSwitcher />
        <ThemeToggle />
        <NotificationsBell />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-2">
              <Avatar className="h-8 w-8">
                {avatarUrl ? <AvatarImage src={avatarUrl} alt={name || t("dashboard.account")} /> : null}
                <AvatarFallback className="bg-gradient-brand text-brand-foreground text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:flex flex-col items-start leading-tight">
                <span className="text-sm font-medium">{name || t("dashboard.account")}</span>
                <span className="text-xs text-muted-foreground">
                  {user?.email}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>{t("dashboard.myAccount")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate({ to: "/dashboard/settings" })}>
              <UserIcon className="h-4 w-4" />
              {t("dashboard.profile")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
              {t("dashboard.signOut")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
