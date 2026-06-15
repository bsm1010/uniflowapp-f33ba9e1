import {
  Sparkles,
  FileText,
  Mic,
  BarChart3,
  ShoppingBag,
  Users,
  Mail,
  MessageCircle,
  Megaphone,
  Search,
  MousePointerClick,
  Store,
  Truck,
  ShoppingCart,
  Tag,
  Wand2,
  Globe,
  Palette,
  ExternalLink,
  Star,
  Settings,
  Database,
  Code,
  Layout,
  Layers,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type CopilotAction = {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  prompt: string;
};

type RouteActions = {
  pattern: RegExp;
  getActions: (pathname: string) => CopilotAction[];
};

const ALL_ACTIONS: RouteActions[] = [
  {
    pattern: /^\/dashboard\/products(\/|$)/,
    getActions: () => [
      {
        id: "improve-description",
        label: "Improve description",
        description: "Generate a compelling AI product description",
        icon: FileText,
        prompt:
          "Give me tips and best practices for writing better e-commerce product descriptions that convert. Focus on structure, keywords, and emotional triggers.",
      },
      {
        id: "write-seo-title",
        label: "Write SEO title",
        description: "Create a search-optimized product title",
        icon: Search,
        prompt:
          "Write 5 SEO-optimized product title templates for e-commerce. Each under 60 characters. Include keywords naturally.",
      },
      {
        id: "product-voice",
        label: "Generate voice-over",
        description: "Create audio narration for this product",
        icon: Mic,
        prompt:
          "Write a short, engaging 30-second product narration script that highlights features and benefits.",
      },
    ],
  },
  {
    pattern: /^\/dashboard(\/|$)/,
    getActions: () => [
      {
        id: "summarize",
        label: "Summarize dashboard",
        description: "Get a quick overview of key metrics",
        icon: Sparkles,
        prompt:
          "Give me a quick checklist of the most important dashboard metrics an e-commerce store owner should track daily. Keep it concise and actionable.",
      },
      {
        id: "explain-metrics",
        label: "Explain KPIs",
        description: "Understand what each metric means",
        icon: BarChart3,
        prompt:
          "Explain the key e-commerce KPIs (conversion rate, AOV, CAC, LTV, churn rate) in simple terms. Include what good benchmarks look like.",
      },
    ],
  },
  {
    pattern: /^\/dashboard\/analytics/,
    getActions: () => [
      {
        id: "explain-trends",
        label: "Explain trends",
        description: "Understand your data patterns",
        icon: BarChart3,
        prompt:
          "What are the most important e-commerce trends to watch in analytics? Give me 5 key metrics to focus on and what they reveal about business health.",
      },
      {
        id: "suggest-improvements",
        label: "Suggest improvements",
        description: "Data-driven recommendations",
        icon: Wand2,
        prompt:
          "Based on typical e-commerce analytics data, suggest 5 actionable improvements a store owner can make to increase conversions and revenue.",
      },
    ],
  },
  {
    pattern: /^\/dashboard\/orders/,
    getActions: () => [
      {
        id: "analyze-orders",
        label: "Analyze orders",
        description: "Spot patterns in your orders",
        icon: ShoppingBag,
        prompt:
          "Give me a framework for analyzing e-commerce order data. What patterns should I look for? How do I identify issues and opportunities?",
      },
      {
        id: "reduce-returns",
        label: "Reduce returns",
        description: "Tips to minimize product returns",
        icon: Truck,
        prompt:
          "List 7 practical strategies to reduce product returns in e-commerce. Focus on prevention through better descriptions, images, and sizing guides.",
      },
    ],
  },
  {
    pattern: /^\/dashboard\/customers/,
    getActions: () => [
      {
        id: "customer-insights",
        label: "Customer insights",
        description: "Understand your customer base",
        icon: Users,
        prompt:
          "What are the most valuable customer insights an e-commerce store should track? Give me a framework for segmenting customers and personalizing outreach.",
      },
    ],
  },
  {
    pattern: /^\/dashboard\/email-marketing/,
    getActions: () => [
      {
        id: "rewrite-email",
        label: "Rewrite professionally",
        description: "Polish your email copy",
        icon: Mail,
        prompt:
          "Give me 5 proven email marketing templates for e-commerce: welcome series, abandoned cart, post-purchase, re-engagement, and promotional. Keep them concise and persuasive.",
      },
      {
        id: "improve-subject",
        label: "Improve subject lines",
        description: "Higher open rates",
        icon: MessageCircle,
        prompt:
          "List 15 email subject line formulas that drive opens for e-commerce. Include urgency, curiosity, social proof, and personalization approaches.",
      },
    ],
  },
  {
    pattern: /^\/dashboard\/ad-generator/,
    getActions: () => [
      {
        id: "better-ad-copy",
        label: "Better ad copy",
        description: "More effective advertisements",
        icon: Megaphone,
        prompt:
          "Write 5 high-converting ad copy templates for Facebook/Instagram e-commerce ads. Include hooks, benefits, social proof, and CTAs.",
      },
    ],
  },
  {
    pattern: /^\/dashboard\/chatbot/,
    getActions: () => [
      {
        id: "optimize-chatbot",
        label: "Optimize chatbot",
        description: "Improve AI customer conversations",
        icon: MessageCircle,
        prompt:
          "Give me 10 best practices for optimizing an e-commerce AI chatbot. Cover tone, response structure, escalation triggers, and常见 questions.",
      },
    ],
  },
  {
    pattern: /^\/dashboard\/seo-optimizer/,
    getActions: () => [
      {
        id: "seo-tips",
        label: "SEO tips",
        description: "Rank higher in search",
        icon: Search,
        prompt:
          "List 10 actionable SEO tips for e-commerce product pages. Cover meta titles, descriptions, headings, image alt text, and structured data.",
      },
    ],
  },
  {
    pattern: /^\/dashboard\/popup-builder/,
    getActions: () => [
      {
        id: "popup-copy",
        label: "Improve popup copy",
        description: "Higher conversion popups",
        icon: MousePointerClick,
        prompt:
          "Write 5 high-converting popup copy templates for e-commerce: discount offer, exit intent, email capture, free shipping threshold, and social proof.",
      },
    ],
  },
  {
    pattern: /^\/dashboard\/store(\/|$)/,
    getActions: () => [
      {
        id: "improve-store",
        label: "Improve store description",
        description: "Better store branding",
        icon: Store,
        prompt:
          "Give me a template for a compelling e-commerce store 'About Us' page that builds trust and tells the brand story.",
      },
    ],
  },
  {
    pattern: /^\/dashboard\/shipping/,
    getActions: () => [
      {
        id: "optimize-shipping",
        label: "Optimize shipping",
        description: "Better delivery strategy",
        icon: Truck,
        prompt:
          "List 7 strategies to optimize e-commerce shipping: pricing, carriers, zones, packaging, tracking, returns, and communication.",
      },
    ],
  },
  {
    pattern: /^\/dashboard\/abandoned-cart/,
    getActions: () => [
      {
        id: "recovery-flow",
        label: "Optimize recovery flow",
        description: "Win back lost sales",
        icon: ShoppingCart,
        prompt:
          "Design a 3-step abandoned cart recovery flow: timing, email content, discount strategy, and SMS follow-up. Include actual templates.",
      },
    ],
  },
  {
    pattern: /^\/dashboard\/discount-generator/,
    getActions: () => [
      {
        id: "discount-strategies",
        label: "Discount strategies",
        description: "Smart pricing tactics",
        icon: Tag,
        prompt:
          "List 10 creative discount and promotion strategies for e-commerce that drive sales without hurting brand perception.",
      },
    ],
  },
  {
    pattern: /^\/dashboard\/landing-generator/,
    getActions: () => [
      {
        id: "landing-tips",
        label: "Landing page tips",
        description: "Higher converting landing pages",
        icon: Layout,
        prompt:
          "Give me 10 best practices for high-converting e-commerce landing pages. Cover headline, social proof, urgency, and CTA placement.",
      },
    ],
  },
  {
    pattern: /^\/dashboard\/theme-presets/,
    getActions: () => [
      {
        id: "theme-tips",
        label: "Theme recommendations",
        description: "Design best practices",
        icon: Palette,
        prompt:
          "Give me 5 e-commerce store design principles for higher conversions: color psychology, typography, layout, mobile optimization, and loading speed.",
      },
    ],
  },
  {
    pattern: /^\/dashboard\/domains/,
    getActions: () => [
      {
        id: "domain-tips",
        label: "Domain name tips",
        description: "Choose the right domain",
        icon: ExternalLink,
        prompt:
          "Give me 5 tips for choosing the perfect e-commerce domain name: length, keywords, brandability, TLD selection, and memorability.",
      },
    ],
  },
  {
    pattern: /^\/dashboard\/referrals/,
    getActions: () => [
      {
        id: "referral-tips",
        label: "Improve referral program",
        description: "Get more word-of-mouth",
        icon: Star,
        prompt:
          "Design a viral referral program for an e-commerce store. Include incentive structure, sharing mechanics, and tracking approach.",
      },
    ],
  },
  {
    pattern: /^\/dashboard\/credits/,
    getActions: () => [
      {
        id: "earn-credits",
        label: "Earn more credits",
        description: "Tips to maximize credits",
        icon: Sparkles,
        prompt:
          "List creative ways an e-commerce store owner can earn more credits or reduce AI usage costs while still improving their store.",
      },
    ],
  },
  {
    pattern: /^\/dashboard\/settings(\/|$)/,
    getActions: () => [
      {
        id: "settings-tips",
        label: "Settings optimization",
        description: "Configure for success",
        icon: Settings,
        prompt:
          "What are the most important e-commerce store settings to configure correctly? Give me a checklist of 10 critical settings.",
      },
    ],
  },
  {
    pattern: /^\/dashboard\/builder/,
    getActions: () => [
      {
        id: "builder-tips",
        label: "Section builder tips",
        description: "Build better store sections",
        icon: Layers,
        prompt:
          "Give me 7 tips for designing effective e-commerce store sections: hero, featured products, testimonials, FAQ, and footer.",
      },
    ],
  },
  {
    pattern: /^\/dashboard\/categories/,
    getActions: () => [
      {
        id: "category-tips",
        label: "Organize categories",
        description: "Better product organization",
        icon: Layers,
        prompt:
          "Give me best practices for organizing e-commerce product categories: hierarchy, naming conventions, filters, and cross-linking.",
      },
    ],
  },
  {
    pattern: /^\/dashboard\/database/,
    getActions: () => [
      {
        id: "database-tips",
        label: "Database tips",
        description: "Manage your data better",
        icon: Database,
        prompt:
          "Give me tips for managing e-commerce product data: bulk editing, export/import best practices, data hygiene, and backup strategies.",
      },
    ],
  },
  {
    pattern: /^\/dashboard\/developer/,
    getActions: () => [
      {
        id: "api-tips",
        label: "API integration tips",
        description: "Connect your tools",
        icon: Code,
        prompt:
          "Give me an overview of common e-commerce API integrations and how to leverage them: shipping carriers, payment gateways, analytics tools, and marketing platforms.",
      },
    ],
  },
];

export function getActionsForPage(pathname: string): CopilotAction[] {
  const matched = ALL_ACTIONS.find((r) => r.pattern.test(pathname));
  if (!matched) {
    return [
      {
        id: "general-tip",
        label: "Page tips",
        description: "Get helpful tips for this page",
        icon: Sparkles,
        prompt: `Give me 3 useful tips about the ${pathname.replace(/\/dashboard\//, "").replace(/\//g, " ")} page in Fennecly e-commerce platform. What can I do here? How does it help my store?`,
      },
    ];
  }
  return matched.getActions(pathname);
}
