import {
  Tag,
  Mail,
  ShoppingCart,
  Search,
  Sparkles,
  MessageCircle,
  MousePointerClick,
  BarChart3,
  Languages,
  DollarSign,
  type LucideIcon,
} from "lucide-react";

export type AppDef = {
  key: string;
  name: string;
  description: string;
  icon: LucideIcon;
  category: string;
  gradient: string;
};

export const APPS: AppDef[] = [
  {
    key: "discount-generator",
    name: "Discount Generator",
    description: "Create promo codes and limited-time offers in seconds.",
    icon: Tag,
    category: "Marketing",
    gradient: "from-rose-500/20 to-orange-500/20",
  },
  {
    key: "email-marketing",
    name: "Email Marketing",
    description: "Send beautiful campaigns and newsletters to your customers.",
    icon: Mail,
    category: "Marketing",
    gradient: "from-blue-500/20 to-cyan-500/20",
  },
  {
    key: "abandoned-cart",
    name: "Abandoned Cart Recovery",
    description: "Automatically remind shoppers to complete their purchase.",
    icon: ShoppingCart,
    category: "Sales",
    gradient: "from-emerald-500/20 to-teal-500/20",
  },
  {
    key: "seo-optimizer",
    name: "SEO Optimizer",
    description: "Boost your store ranking with smart on-page SEO suggestions.",
    icon: Search,
    category: "Growth",
    gradient: "from-violet-500/20 to-purple-500/20",
  },
  {
    key: "ai-descriptions",
    name: "AI Product Description Generator",
    description: "Generate compelling product copy with one click using AI.",
    icon: Sparkles,
    category: "AI",
    gradient: "from-fuchsia-500/20 to-pink-500/20",
  },
  {
    key: "chatbot",
    name: "Chatbot",
    description: "Answer customer questions 24/7 with an AI-powered assistant.",
    icon: MessageCircle,
    category: "AI",
    gradient: "from-indigo-500/20 to-blue-500/20",
  },
  {
    key: "popup-builder",
    name: "Popup Builder",
    description: "Capture leads and announce offers with custom popups.",
    icon: MousePointerClick,
    category: "Marketing",
    gradient: "from-amber-500/20 to-yellow-500/20",
  },
  {
    key: "analytics",
    name: "Analytics Integration",
    description: "Connect Google Analytics, Meta Pixel, and TikTok Pixel.",
    icon: BarChart3,
    category: "Analytics",
    gradient: "from-sky-500/20 to-blue-500/20",
  },
  {
    key: "multi-language",
    name: "Multi-language",
    description: "Translate your store into multiple languages automatically.",
    icon: Languages,
    category: "Localization",
    gradient: "from-green-500/20 to-emerald-500/20",
  },
  {
    key: "currency-converter",
    name: "Currency Converter",
    description: "Show prices in your visitor's local currency.",
    icon: DollarSign,
    category: "Localization",
    gradient: "from-lime-500/20 to-green-500/20",
  },
];

export const APPS_BY_KEY: Record<string, AppDef> = Object.fromEntries(
  APPS.map((a) => [a.key, a]),
);
