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
  Megaphone,
  Wand2,
  MessageSquare,
  ShieldAlert,
  Wallet,
  Store,
  type LucideIcon,
} from "lucide-react";

export type AppPlan = {
  name: string;
  price: string;
  period?: string;
  features: string[];
  highlighted?: boolean;
};

export type AppDef = {
  key: string;
  name: string;
  description: string;
  longDescription?: string;
  icon: LucideIcon;
  icon_url?: string;
  category: string;
  gradient: string;
  developer: string;
  rating: number;
  reviewCount: number;
  features: string[];
  screenshots: string[];
  plans: AppPlan[];
  changelog: { version: string; date: string; notes: string[] }[];
  route?: string;
};

const defaultPlans: AppPlan[] = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    features: ["Core features", "Up to 100 actions / month", "Community support"],
  },
  {
    name: "Pro",
    price: "$19",
    period: "/ month",
    highlighted: true,
    features: ["Unlimited actions", "Priority support", "Advanced analytics", "Custom branding"],
  },
];

const defaultChangelog = [
  {
    version: "1.2.0",
    date: "May 2026",
    notes: ["Performance improvements", "New onboarding flow"],
  },
  {
    version: "1.1.0",
    date: "April 2026",
    notes: ["Added analytics dashboard", "Bug fixes"],
  },
  {
    version: "1.0.0",
    date: "March 2026",
    notes: ["Initial release"],
  },
];

export const APPS: AppDef[] = [
  {
    key: "discount-generator",
    name: "Discount Generator",
    description: "Create promo codes and limited-time offers in seconds.",
    longDescription:
      "Boost sales by creating smart discount codes, BOGO deals, and limited-time offers. Track redemptions and ROI in real time.",
    icon: Tag,
    category: "Marketing",
    gradient: "from-rose-500 to-orange-500",
    developer: "Fennecly",
    rating: 4.8,
    reviewCount: 1243,
    features: [
      "Unlimited promo codes",
      "Schedule campaigns in advance",
      "Auto-apply discounts at checkout",
      "Real-time redemption tracking",
      "BOGO and tiered discounts",
    ],
    screenshots: [
      "from-rose-500 to-orange-500",
      "from-pink-500 to-rose-500",
      "from-amber-500 to-orange-500",
    ],
    plans: defaultPlans,
    changelog: defaultChangelog,
    route: "/dashboard/apps/discount-generator",
  },
  {
    key: "email-marketing",
    name: "Email Marketing",
    description: "Send beautiful campaigns and newsletters to your customers.",
    longDescription:
      "Design pixel-perfect emails with a drag-and-drop builder, segment your audience, and automate flows that convert.",
    icon: Mail,
    category: "Marketing",
    gradient: "from-blue-500 to-cyan-500",
    developer: "Fennecly",
    rating: 4.7,
    reviewCount: 892,
    features: [
      "Drag-and-drop email builder",
      "Customer segmentation",
      "Automated drip campaigns",
      "A/B testing",
      "Detailed open & click analytics",
    ],
    screenshots: [
      "from-blue-500 to-cyan-500",
      "from-cyan-500 to-teal-500",
      "from-sky-500 to-blue-500",
    ],
    plans: defaultPlans,
    changelog: defaultChangelog,
    route: "/dashboard/apps/email-marketing",
  },
  {
    key: "abandoned-cart",
    name: "Abandoned Cart Recovery",
    description: "Automatically remind shoppers to complete their purchase.",
    longDescription:
      "Recover up to 30% of lost sales with timely email and SMS reminders sent automatically to shoppers who left items behind.",
    icon: ShoppingCart,
    category: "Sales",
    gradient: "from-emerald-500 to-teal-500",
    developer: "Fennecly",
    rating: 4.9,
    reviewCount: 2104,
    features: [
      "Automated email reminders",
      "SMS recovery sequences",
      "Smart timing optimization",
      "One-click checkout links",
      "Recovery revenue dashboard",
    ],
    screenshots: [
      "from-emerald-500 to-teal-500",
      "from-teal-500 to-cyan-500",
      "from-green-500 to-emerald-500",
    ],
    plans: defaultPlans,
    changelog: defaultChangelog,
    route: "/dashboard/apps/abandoned-cart",
  },
  {
    key: "seo-optimizer",
    name: "SEO Optimizer",
    description: "Boost your store ranking with smart on-page SEO suggestions.",
    longDescription:
      "Get instant SEO audits, keyword suggestions, and meta tag optimization to climb Google's rankings.",
    icon: Search,
    category: "Growth",
    gradient: "from-violet-500 to-purple-600",
    developer: "Fennecly",
    rating: 4.6,
    reviewCount: 567,
    features: [
      "Automated SEO audits",
      "Keyword research tools",
      "Meta tag optimization",
      "Schema markup generator",
      "Sitemap auto-generation",
    ],
    screenshots: [
      "from-violet-500 to-purple-500",
      "from-purple-500 to-fuchsia-500",
      "from-indigo-500 to-violet-500",
    ],
    plans: defaultPlans,
    changelog: defaultChangelog,
    route: "/dashboard/apps/seo-optimizer",
  },
  {
    key: "ai-descriptions",
    name: "AI Product Description Generator",
    description: "Generate compelling product copy with one click using AI.",
    longDescription:
      "Turn boring product details into compelling, SEO-optimized copy that sells. Powered by state-of-the-art AI.",
    icon: Sparkles,
    category: "AI",
    gradient: "from-fuchsia-500 to-pink-500",
    developer: "Fennecly AI",
    rating: 4.9,
    reviewCount: 3287,
    features: [
      "One-click generation",
      "Multiple tone options",
      "Bulk generation",
      "SEO-optimized output",
      "Multi-language support",
    ],
    screenshots: [
      "from-fuchsia-500 to-pink-500",
      "from-pink-500 to-rose-500",
      "from-purple-500 to-fuchsia-500",
    ],
    plans: defaultPlans,
    changelog: defaultChangelog,
    route: "/dashboard/apps/ai-descriptions",
  },
  {
    key: "ad-generator",
    name: "AI Ad Generator",
    description: "Generate ready-to-publish Facebook, Instagram, TikTok and Google ads.",
    longDescription:
      "Create scroll-stopping ad copy for every major platform in seconds. Trained on millions of high-performing ads.",
    icon: Megaphone,
    category: "AI",
    gradient: "from-orange-500 to-rose-500",
    developer: "Fennecly AI",
    rating: 4.8,
    reviewCount: 1567,
    features: [
      "Facebook, Instagram, TikTok, Google ads",
      "Multiple variations per generation",
      "Tone & length controls",
      "Headline & description split",
      "One-click copy to clipboard",
    ],
    screenshots: [
      "from-orange-500 to-rose-500",
      "from-rose-500 to-pink-500",
      "from-amber-500 to-orange-500",
    ],
    plans: defaultPlans,
    changelog: defaultChangelog,
    route: "/dashboard/apps/ad-generator",
  },
  {
    key: "image-enhancer",
    name: "AI Image Enhancer",
    description: "Turn ordinary product photos into studio-quality shots.",
    longDescription:
      "Transform product photos into stunning studio, lifestyle, or white-background images with AI in seconds.",
    icon: Wand2,
    category: "AI",
    gradient: "from-cyan-500 to-blue-600",
    developer: "Fennecly AI",
    rating: 4.9,
    reviewCount: 2891,
    features: [
      "Studio, lifestyle & white-bg presets",
      "Background removal",
      "Auto color correction",
      "Batch processing",
      "Export in 4K",
    ],
    screenshots: [
      "from-cyan-500 to-blue-500",
      "from-blue-500 to-indigo-500",
      "from-sky-500 to-cyan-500",
    ],
    plans: defaultPlans,
    changelog: defaultChangelog,
    route: "/dashboard/apps/image-enhancer",
  },
  {
    key: "chatbot",
    name: "Chatbot",
    description: "Answer customer questions 24/7 with an AI-powered assistant.",
    longDescription:
      "An always-on AI assistant trained on your products that answers questions, recommends items, and closes sales.",
    icon: MessageCircle,
    category: "AI",
    gradient: "from-indigo-500 to-violet-500",
    developer: "Fennecly AI",
    rating: 4.7,
    reviewCount: 1102,
    features: [
      "24/7 customer support",
      "Trained on your catalog",
      "Multi-language replies",
      "Live handoff to human",
      "Conversation analytics",
    ],
    screenshots: [
      "from-indigo-500 to-blue-500",
      "from-blue-500 to-violet-500",
      "from-violet-500 to-indigo-500",
    ],
    plans: defaultPlans,
    changelog: defaultChangelog,
    route: "/dashboard/apps/chatbot",
  },
  {
    key: "popup-builder",
    name: "Popup Builder",
    description: "Capture leads and announce offers with custom popups.",
    longDescription:
      "Design beautiful popups for newsletter signups, promotions, and exit-intent offers — no code required.",
    icon: MousePointerClick,
    category: "Marketing",
    gradient: "from-amber-500 to-yellow-500",
    developer: "Fennecly",
    rating: 4.5,
    reviewCount: 743,
    features: [
      "Drag-and-drop builder",
      "Exit-intent triggers",
      "A/B testing",
      "Mobile-optimized templates",
      "Conversion tracking",
    ],
    screenshots: [
      "from-amber-500 to-yellow-500",
      "from-yellow-500 to-orange-500",
      "from-orange-500 to-amber-500",
    ],
    plans: defaultPlans,
    changelog: defaultChangelog,
    route: "/dashboard/apps/popup-builder",
  },
  {
    key: "analytics",
    name: "Analytics Integration",
    description: "Connect Google Analytics, Meta Pixel, and TikTok Pixel.",
    longDescription:
      "Connect every major analytics and ad platform in one click. Track conversions across the entire funnel.",
    icon: BarChart3,
    category: "Analytics",
    gradient: "from-sky-500 to-blue-600",
    developer: "Fennecly",
    rating: 4.6,
    reviewCount: 1456,
    features: [
      "Google Analytics 4",
      "Meta Pixel",
      "TikTok Pixel",
      "Server-side tracking",
      "Custom event mapping",
    ],
    screenshots: [
      "from-sky-500 to-blue-500",
      "from-blue-500 to-cyan-500",
      "from-cyan-500 to-sky-500",
    ],
    plans: defaultPlans,
    changelog: defaultChangelog,
    route: "/dashboard/apps/analytics",
  },
  {
    key: "multi-language",
    name: "Multi-language",
    description: "Translate your store into multiple languages automatically.",
    longDescription:
      "Reach global customers by automatically translating your store into 50+ languages with AI-powered accuracy.",
    icon: Languages,
    category: "Growth",
    gradient: "from-green-500 to-emerald-600",
    developer: "Fennecly",
    rating: 4.4,
    reviewCount: 421,
    features: [
      "50+ languages",
      "Auto-detect visitor language",
      "Manual translation override",
      "SEO-friendly URLs",
      "RTL support",
    ],
    screenshots: [
      "from-green-500 to-emerald-500",
      "from-emerald-500 to-teal-500",
      "from-lime-500 to-green-500",
    ],
    plans: defaultPlans,
    changelog: defaultChangelog,
    route: "/dashboard/apps/multi-language",
  },
  {
    key: "currency-converter",
    name: "Currency Converter",
    description: "Show prices in your visitor's local currency.",
    longDescription:
      "Auto-detect visitor location and convert all prices to their local currency using real-time exchange rates.",
    icon: DollarSign,
    category: "Growth",
    gradient: "from-lime-500 to-green-500",
    developer: "Fennecly",
    rating: 4.5,
    reviewCount: 612,
    features: [
      "150+ currencies",
      "Real-time exchange rates",
      "Auto-detect location",
      "Manual currency switcher",
      "Rounded pricing rules",
    ],
    screenshots: [
      "from-lime-500 to-green-500",
      "from-green-500 to-emerald-500",
      "from-yellow-500 to-lime-500",
    ],
    plans: defaultPlans,
    changelog: defaultChangelog,
    route: "/dashboard/apps/currency-converter",
  },
  {
    key: "whatsapp-notifications",
    name: "WhatsApp Order Notifications",
    description: "Automatically send order updates to customers via WhatsApp.",
    longDescription:
      "Send instant WhatsApp messages to customers when their order is placed, confirmed, shipped, or delivered.",
    icon: MessageSquare,
    category: "Algeria",
    gradient: "from-green-400 to-emerald-500",
    developer: "Fennecly",
    rating: 4.9,
    reviewCount: 1820,
    features: [
      "Auto send on order placed, confirmed, shipped, delivered",
      "Customizable message templates",
      "Customer name & order details in message",
      "Supports all Algerian wilayas",
      "WhatsApp Business API ready",
    ],
    screenshots: [
      "from-green-500 to-emerald-500",
      "from-emerald-500 to-teal-500",
      "from-lime-500 to-green-500",
    ],
    plans: defaultPlans,
    changelog: defaultChangelog,
    route: "/dashboard/apps/whatsapp-notifications",
  },
  {
    key: "fake-order-detector",
    name: "Fake Order Detector",
    description: "Automatically flag suspicious orders before you ship.",
    longDescription: "Reduce wasted shipping costs with smart fake order detection.",
    icon: ShieldAlert,
    category: "Algeria",
    gradient: "from-rose-500 to-red-600",
    developer: "Fennecly",
    rating: 4.8,
    reviewCount: 2340,
    features: [
      "Phone number risk scoring",
      "Duplicate order detection",
      "Suspicious wilaya pattern alerts",
      "Blacklist repeat fake customers",
      "Risk score on every order",
    ],
    screenshots: [
      "from-rose-500 to-red-500",
      "from-red-500 to-orange-500",
      "from-rose-500 to-pink-500",
    ],
    plans: defaultPlans,
    changelog: defaultChangelog,
    route: "/dashboard/apps/fake-order-detector",
  },
  {
    key: "cod-manager",
    name: "COD Manager",
    description: "Track cash on delivery payments, collections and reconciliation.",
    longDescription: "The essential tool for Algerian merchants using Cash on Delivery.",
    icon: Wallet,
    category: "Algeria",
    gradient: "from-amber-400 to-orange-500",
    developer: "Fennecly",
    rating: 4.9,
    reviewCount: 1654,
    features: [
      "COD payment status tracking",
      "Cash in transit dashboard",
      "Delivery company reconciliation",
      "Daily & weekly cash reports",
      "Export to Excel",
    ],
    screenshots: [
      "from-amber-500 to-yellow-500",
      "from-yellow-500 to-orange-500",
      "from-orange-500 to-amber-500",
    ],
    plans: defaultPlans,
    changelog: defaultChangelog,
    route: "/dashboard/apps/cod-manager",
  },
  {
    key: "shopify",
    name: "Shopify Integration",
    description:
      "Sync products and orders between your Shopify store and Fennecly. Bidirectional sync keeps both platforms in harmony.",
    longDescription:
      "Connect your Shopify store to import products, customers, and orders. Changes sync bidirectionally — update a product in Fennecly and it updates in Shopify, and vice versa. Real-time webhooks keep orders in sync automatically.",
    icon: Store,
    icon_url: "/icons/Shopify-logo.png",
    category: "Sales",
    gradient: "from-green-500 to-emerald-600",
    developer: "Fennecly",
    rating: 4.8,
    reviewCount: 124,
    features: [
      "Bidirectional product sync",
      "Order import from Shopify",
      "Real-time webhook updates",
      "Bulk product migration",
      "Variant & image sync",
      "Stock level sync",
    ],
    screenshots: [
      "from-green-500 to-emerald-500",
      "from-emerald-500 to-teal-500",
      "from-teal-500 to-green-500",
    ],
    plans: defaultPlans,
    changelog: defaultChangelog,
    route: "/dashboard/shopify",
  },
];

export const APPS_BY_KEY: Record<string, AppDef> = Object.fromEntries(APPS.map((a) => [a.key, a]));

export const APP_CATEGORIES = [
  "All",
  "Marketing",
  "AI",
  "Sales",
  "Growth",
  "Analytics",
  "Algeria",
] as const;
