/**
 * Block registry — single source of truth for the storefront builder.
 *
 * Each block is lazy-loaded individually so the editor's library panel and
 * the storefront only download the blocks actually used.
 */
import { lazy } from "react";
import type { BlockDefinition } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */
const def = <T,>(d: BlockDefinition<T>): BlockDefinition<any> => d as BlockDefinition<any>;

export const BLOCK_REGISTRY: Record<string, BlockDefinition> = {
  /* ---------------- HERO ---------------- */
  "hero.split": def({
    key: "hero.split",
    label: "Hero — Split",
    description: "Big headline + image side-by-side.",
    category: "hero",
    icon: "Image",
    component: lazy(() => import("./blocks/hero").then((m) => ({ default: m.HeroSplit }))),
    defaultProps: {
      eyebrow: "New collection",
      title: "Designed to stand out.",
      subtitle: "Premium pieces, made for everyday life.",
      ctaLabel: "Shop now",
      ctaHref: "#",
      imageUrl: "",
    },
    schema: {
      fields: [
        { type: "text", key: "eyebrow", label: "Eyebrow" },
        { type: "text", key: "title", label: "Title" },
        { type: "text", key: "subtitle", label: "Subtitle", multiline: true },
        { type: "text", key: "ctaLabel", label: "Button label" },
        { type: "url", key: "ctaHref", label: "Button link" },
        { type: "image", key: "imageUrl", label: "Image" },
      ],
    },
  }),
  "hero.centered": def({
    key: "hero.centered",
    label: "Hero — Centered",
    description: "Centered headline with two CTAs.",
    category: "hero",
    icon: "AlignCenter",
    component: lazy(() => import("./blocks/hero").then((m) => ({ default: m.HeroCentered }))),
    defaultProps: {
      title: "Make every moment iconic.",
      subtitle: "Crafted for those who care about details.",
      ctaLabel: "Shop the collection",
      ctaHref: "#",
      secondaryLabel: "Learn more",
      secondaryHref: "#",
    },
    schema: {
      fields: [
        { type: "text", key: "title", label: "Title" },
        { type: "text", key: "subtitle", label: "Subtitle", multiline: true },
        { type: "text", key: "ctaLabel", label: "Primary label" },
        { type: "url", key: "ctaHref", label: "Primary link" },
        { type: "text", key: "secondaryLabel", label: "Secondary label" },
        { type: "url", key: "secondaryHref", label: "Secondary link" },
      ],
    },
  }),
  "hero.video": def({
    key: "hero.video",
    label: "Hero — Video background",
    description: "Full-bleed autoplay video hero.",
    category: "hero",
    icon: "Video",
    component: lazy(() => import("./blocks/hero").then((m) => ({ default: m.HeroVideo }))),
    defaultProps: {
      title: "Move with us.",
      subtitle: "",
      videoUrl: "",
      posterUrl: "",
      ctaLabel: "Discover",
      ctaHref: "#",
    },
    schema: {
      fields: [
        { type: "text", key: "title", label: "Title" },
        { type: "text", key: "subtitle", label: "Subtitle" },
        { type: "url", key: "videoUrl", label: "Video URL (mp4)" },
        { type: "image", key: "posterUrl", label: "Poster image" },
        { type: "text", key: "ctaLabel", label: "Button label" },
        { type: "url", key: "ctaHref", label: "Button link" },
      ],
    },
  }),
  "hero.gradient": def({
    key: "hero.gradient",
    label: "Hero — Gradient",
    description: "Bold gradient background with centered content.",
    category: "hero",
    icon: "Sparkles",
    component: lazy(() => import("./blocks/hero").then((m) => ({ default: m.HeroGradient }))),
    defaultProps: {
      title: "Bold by design.",
      subtitle: "A statement collection in vivid color.",
      ctaLabel: "Shop now",
      ctaHref: "#",
      gradientFrom: "#7c3aed",
      gradientTo: "#ec4899",
    },
    schema: {
      fields: [
        { type: "text", key: "title", label: "Title" },
        { type: "text", key: "subtitle", label: "Subtitle" },
        { type: "text", key: "ctaLabel", label: "Button label" },
        { type: "url", key: "ctaHref", label: "Button link" },
        { type: "color", key: "gradientFrom", label: "Gradient start" },
        { type: "color", key: "gradientTo", label: "Gradient end" },
      ],
    },
  }),

  /* ---------------- PRODUCTS ---------------- */
  "products.grid": def({
    key: "products.grid",
    label: "Product grid",
    description: "Responsive product grid with 2–5 columns.",
    category: "products",
    icon: "LayoutGrid",
    component: lazy(() => import("./blocks/products").then((m) => ({ default: m.ProductGrid }))),
    defaultProps: { title: "Featured products", subtitle: "", columns: 4, products: [], ctaLabel: "View" },
    schema: {
      fields: [
        { type: "text", key: "title", label: "Title" },
        { type: "text", key: "subtitle", label: "Subtitle" },
        { type: "number", key: "columns", label: "Columns", min: 2, max: 5, step: 1 },
      ],
    },
  }),
  "products.carousel": def({
    key: "products.carousel",
    label: "Product carousel",
    description: "Horizontal scroll of products.",
    category: "products",
    icon: "MoveHorizontal",
    component: lazy(() => import("./blocks/products").then((m) => ({ default: m.ProductCarousel }))),
    defaultProps: { title: "Trending now", products: [] },
    schema: { fields: [{ type: "text", key: "title", label: "Title" }] },
  }),
  "products.featured": def({
    key: "products.featured",
    label: "Featured product",
    description: "Spotlight on a single product.",
    category: "products",
    icon: "Star",
    component: lazy(() => import("./blocks/products").then((m) => ({ default: m.FeaturedProduct }))),
    defaultProps: {
      product: { id: "demo", name: "Hero product", price: 49, imageUrl: "" },
      description: "Our best-seller, reimagined.",
      ctaLabel: "Shop now",
    },
    schema: {
      fields: [
        { type: "text", key: "description", label: "Description", multiline: true },
        { type: "text", key: "ctaLabel", label: "Button label" },
      ],
    },
  }),
  "products.bento": def({
    key: "products.bento",
    label: "Bento products",
    description: "Asymmetric bento grid of products.",
    category: "products",
    icon: "LayoutDashboard",
    component: lazy(() => import("./blocks/products").then((m) => ({ default: m.BentoProducts }))),
    defaultProps: { title: "Shop the look", products: [] },
    schema: { fields: [{ type: "text", key: "title", label: "Title" }] },
  }),

  /* ---------------- SOCIAL PROOF ---------------- */
  "social.testimonials": def({
    key: "social.testimonials",
    label: "Testimonials",
    description: "3-column customer testimonial cards.",
    category: "social-proof",
    icon: "MessageCircle",
    component: lazy(() => import("./blocks/social-proof").then((m) => ({ default: m.Testimonials }))),
    defaultProps: {
      title: "Loved by customers",
      items: [
        { name: "Sara K.", role: "Verified buyer", quote: "Best purchase I've made all year." },
        { name: "Yanis B.", role: "Verified buyer", quote: "Quality is unreal for the price." },
        { name: "Lina M.", role: "Verified buyer", quote: "Fast shipping and gorgeous packaging." },
      ],
    },
    schema: {
      fields: [
        { type: "text", key: "title", label: "Title" },
        {
          type: "list",
          key: "items",
          label: "Testimonials",
          itemLabel: "Testimonial",
          itemFields: [
            { type: "text", key: "name", label: "Name" },
            { type: "text", key: "role", label: "Role" },
            { type: "text", key: "quote", label: "Quote", multiline: true },
            { type: "image", key: "avatarUrl", label: "Avatar" },
          ],
        },
      ],
    },
  }),
  "social.reviews": def({
    key: "social.reviews",
    label: "Reviews slider",
    description: "Star reviews in a horizontal slider.",
    category: "social-proof",
    icon: "Star",
    component: lazy(() => import("./blocks/social-proof").then((m) => ({ default: m.ReviewsSlider }))),
    defaultProps: {
      title: "What customers say",
      reviews: [
        { stars: 5, text: "Absolutely worth it.", author: "Amel" },
        { stars: 5, text: "Even better in person.", author: "Karim" },
        { stars: 4, text: "Great fit.", author: "Inès" },
      ],
    },
    schema: { fields: [{ type: "text", key: "title", label: "Title" }] },
  }),
  "social.brands": def({
    key: "social.brands",
    label: "Brand logos",
    description: "Logo bar of press / partners.",
    category: "social-proof",
    icon: "Building2",
    component: lazy(() => import("./blocks/social-proof").then((m) => ({ default: m.BrandLogos }))),
    defaultProps: {
      title: "As seen in",
      logos: [{ name: "Vogue" }, { name: "Forbes" }, { name: "Wired" }, { name: "TechCrunch" }],
    },
    schema: { fields: [{ type: "text", key: "title", label: "Title" }] },
  }),
  "social.stats": def({
    key: "social.stats",
    label: "Stats counter",
    description: "Numerical proof points.",
    category: "social-proof",
    icon: "TrendingUp",
    component: lazy(() => import("./blocks/social-proof").then((m) => ({ default: m.StatsCounter }))),
    defaultProps: {
      stats: [
        { value: "12k+", label: "Happy customers" },
        { value: "4.9★", label: "Average rating" },
        { value: "48h", label: "Fast delivery" },
        { value: "30d", label: "Easy returns" },
      ],
    },
    schema: { fields: [] },
  }),
  "social.ugc": def({
    key: "social.ugc",
    label: "UGC wall",
    description: "Customer photos in a hover wall.",
    category: "social-proof",
    icon: "Images",
    component: lazy(() => import("./blocks/social-proof").then((m) => ({ default: m.UGCWall }))),
    defaultProps: { title: "@yourbrand on Instagram", posts: [] },
    schema: { fields: [{ type: "text", key: "title", label: "Title" }] },
  }),

  /* ---------------- MEDIA ---------------- */
  "media.gallery": def({
    key: "media.gallery",
    label: "Image gallery",
    description: "Even grid gallery.",
    category: "media",
    icon: "Image",
    component: lazy(() => import("./blocks/media").then((m) => ({ default: m.ImageGallery }))),
    defaultProps: { title: "", images: [] },
    schema: { fields: [{ type: "text", key: "title", label: "Title" }] },
  }),
  "media.masonry": def({
    key: "media.masonry",
    label: "Masonry gallery",
    description: "Pinterest-style masonry layout.",
    category: "media",
    icon: "LayoutGrid",
    component: lazy(() => import("./blocks/media").then((m) => ({ default: m.MasonryGallery }))),
    defaultProps: { title: "", images: [] },
    schema: { fields: [{ type: "text", key: "title", label: "Title" }] },
  }),
  "media.video": def({
    key: "media.video",
    label: "Video section",
    description: "Embedded brand or product video.",
    category: "media",
    icon: "Play",
    component: lazy(() => import("./blocks/media").then((m) => ({ default: m.VideoSection }))),
    defaultProps: { title: "Watch the story", videoUrl: "", posterUrl: "", description: "" },
    schema: {
      fields: [
        { type: "text", key: "title", label: "Title" },
        { type: "text", key: "description", label: "Description" },
        { type: "url", key: "videoUrl", label: "Video URL" },
        { type: "image", key: "posterUrl", label: "Poster" },
      ],
    },
  }),
  "media.beforeafter": def({
    key: "media.beforeafter",
    label: "Before / after",
    description: "Drag-to-compare slider.",
    category: "media",
    icon: "GitCompareArrows",
    component: lazy(() => import("./blocks/media").then((m) => ({ default: m.BeforeAfter }))),
    defaultProps: { title: "Before & after", beforeUrl: "", afterUrl: "" },
    schema: {
      fields: [
        { type: "text", key: "title", label: "Title" },
        { type: "image", key: "beforeUrl", label: "Before image" },
        { type: "image", key: "afterUrl", label: "After image" },
      ],
    },
  }),
  "media.reels": def({
    key: "media.reels",
    label: "TikTok-style reels",
    description: "Vertical video reels carousel.",
    category: "media",
    icon: "Video",
    component: lazy(() => import("./blocks/media").then((m) => ({ default: m.TikTokReels }))),
    defaultProps: { title: "Watch our reels", reels: [] },
    schema: { fields: [{ type: "text", key: "title", label: "Title" }] },
  }),

  /* ---------------- BANNERS ---------------- */
  "banner.marquee": def({
    key: "banner.marquee",
    label: "Marquee",
    description: "Infinite scrolling text bar.",
    category: "banners",
    icon: "Megaphone",
    component: lazy(() => import("./blocks/banners").then((m) => ({ default: m.Marquee }))),
    defaultProps: {
      items: ["Free shipping over $50", "30-day returns", "New drops every Friday"],
      speed: 30,
    },
    schema: { fields: [{ type: "number", key: "speed", label: "Speed (s)", min: 5, max: 120 }] },
  }),
  "banner.announcement": def({
    key: "banner.announcement",
    label: "Announcement bar",
    description: "Top-of-page promo line.",
    category: "banners",
    icon: "Bell",
    component: lazy(() => import("./blocks/banners").then((m) => ({ default: m.AnnouncementBar }))),
    defaultProps: { message: "Free shipping on orders $50+", ctaLabel: "Shop", ctaHref: "#", dismissible: true },
    schema: {
      fields: [
        { type: "text", key: "message", label: "Message" },
        { type: "text", key: "ctaLabel", label: "Button label" },
        { type: "url", key: "ctaHref", label: "Button link" },
        { type: "boolean", key: "dismissible", label: "Allow dismiss" },
      ],
    },
  }),
  "banner.promo": def({
    key: "banner.promo",
    label: "Promo banner",
    description: "Large gradient promo block.",
    category: "banners",
    icon: "Tag",
    component: lazy(() => import("./blocks/banners").then((m) => ({ default: m.PromoBanner }))),
    defaultProps: {
      title: "Summer sale — 30% off",
      subtitle: "Limited time only.",
      ctaLabel: "Shop sale",
      ctaHref: "#",
      imageUrl: "",
    },
    schema: {
      fields: [
        { type: "text", key: "title", label: "Title" },
        { type: "text", key: "subtitle", label: "Subtitle" },
        { type: "text", key: "ctaLabel", label: "Button label" },
        { type: "url", key: "ctaHref", label: "Button link" },
        { type: "image", key: "imageUrl", label: "Background image" },
      ],
    },
  }),
  "banner.countdown": def({
    key: "banner.countdown",
    label: "Countdown banner",
    description: "Live countdown timer.",
    category: "banners",
    icon: "Timer",
    component: lazy(() => import("./blocks/banners").then((m) => ({ default: m.CountdownBanner }))),
    defaultProps: {
      title: "Sale ends in",
      endsAt: new Date(Date.now() + 86400000 * 3).toISOString(),
      ctaLabel: "Shop now",
      ctaHref: "#",
    },
    schema: {
      fields: [
        { type: "text", key: "title", label: "Title" },
        { type: "text", key: "endsAt", label: "Ends at (ISO date)" },
        { type: "text", key: "ctaLabel", label: "Button label" },
        { type: "url", key: "ctaHref", label: "Button link" },
      ],
    },
  }),

  /* ---------------- CONTENT ---------------- */
  "content.faq": def({
    key: "content.faq",
    label: "FAQ",
    description: "Accordion of frequently asked questions.",
    category: "content",
    icon: "HelpCircle",
    component: lazy(() => import("./blocks/content").then((m) => ({ default: m.FAQ }))),
    defaultProps: {
      title: "Frequently asked questions",
      items: [
        { question: "How long does shipping take?", answer: "2–5 business days." },
        { question: "What is your return policy?", answer: "30-day free returns on all orders." },
      ],
    },
    schema: {
      fields: [
        { type: "text", key: "title", label: "Title" },
        {
          type: "list",
          key: "items",
          label: "Questions",
          itemFields: [
            { type: "text", key: "question", label: "Question" },
            { type: "text", key: "answer", label: "Answer", multiline: true },
          ],
        },
      ],
    },
  }),
  "content.features": def({
    key: "content.features",
    label: "Features",
    description: "Iconified feature grid.",
    category: "content",
    icon: "Sparkles",
    component: lazy(() => import("./blocks/content").then((m) => ({ default: m.Features }))),
    defaultProps: {
      title: "Why our customers love us",
      subtitle: "",
      items: [
        { title: "Premium materials", description: "Sourced from trusted suppliers." },
        { title: "Made to last", description: "Backed by a 2-year warranty." },
        { title: "Fast delivery", description: "Ships within 24 hours." },
      ],
    },
    schema: {
      fields: [
        { type: "text", key: "title", label: "Title" },
        { type: "text", key: "subtitle", label: "Subtitle" },
      ],
    },
  }),
  "content.comparison": def({
    key: "content.comparison",
    label: "Comparison table",
    description: "Compare your product vs competitors.",
    category: "content",
    icon: "Table",
    component: lazy(() => import("./blocks/content").then((m) => ({ default: m.ComparisonTable }))),
    defaultProps: {
      title: "Why we're different",
      columns: ["Us", "Brand A", "Brand B"],
      rows: [
        { feature: "Free shipping", values: [true, false, true] },
        { feature: "30-day returns", values: [true, false, false] },
        { feature: "Lifetime support", values: [true, false, false] },
      ],
    },
    schema: { fields: [{ type: "text", key: "title", label: "Title" }] },
  }),
  "content.pricing": def({
    key: "content.pricing",
    label: "Pricing table",
    description: "Plans / tiers comparison.",
    category: "content",
    icon: "DollarSign",
    component: lazy(() => import("./blocks/content").then((m) => ({ default: m.Pricing }))),
    defaultProps: {
      title: "Simple pricing",
      plans: [
        { name: "Starter", price: "$9", period: "mo", features: ["1 store", "Basic support"], ctaLabel: "Start", ctaHref: "#" },
        { name: "Pro", price: "$29", period: "mo", features: ["5 stores", "Priority support", "AI tools"], ctaLabel: "Go Pro", ctaHref: "#", highlighted: true },
        { name: "Business", price: "$79", period: "mo", features: ["Unlimited", "Dedicated CSM"], ctaLabel: "Contact us", ctaHref: "#" },
      ],
    },
    schema: { fields: [{ type: "text", key: "title", label: "Title" }] },
  }),
  "content.bento": def({
    key: "content.bento",
    label: "Bento grid",
    description: "Asymmetric content tiles.",
    category: "content",
    icon: "LayoutDashboard",
    component: lazy(() => import("./blocks/content").then((m) => ({ default: m.BentoGrid }))),
    defaultProps: {
      title: "What's inside",
      items: [
        { title: "Modular design", description: "Build any layout you want." },
        { title: "Fast loading", description: "Optimized for speed." },
        { title: "Mobile first", description: "Looks great everywhere." },
        { title: "SEO-ready", description: "Built for discovery." },
      ],
    },
    schema: { fields: [{ type: "text", key: "title", label: "Title" }] },
  }),
  "content.cards": def({
    key: "content.cards",
    label: "Interactive cards",
    description: "3-column linkable cards.",
    category: "content",
    icon: "MousePointer",
    component: lazy(() => import("./blocks/content").then((m) => ({ default: m.InteractiveCards }))),
    defaultProps: {
      title: "Explore",
      cards: [
        { title: "Shop new", description: "Latest arrivals.", href: "#" },
        { title: "Best sellers", description: "Loved by everyone.", href: "#" },
        { title: "On sale", description: "Up to 50% off.", href: "#" },
      ],
    },
    schema: { fields: [{ type: "text", key: "title", label: "Title" }] },
  }),

  /* ---------------- TRUST ---------------- */
  "trust.badges": def({
    key: "trust.badges",
    label: "Trust badges",
    description: "Free shipping, returns, secure checkout, etc.",
    category: "trust",
    icon: "ShieldCheck",
    component: lazy(() => import("./blocks/trust").then((m) => ({ default: m.TrustBadges }))),
    defaultProps: {
      items: [
        { icon: "truck" as const, label: "Free shipping", description: "On orders over $50" },
        { icon: "rotate" as const, label: "30-day returns", description: "No questions asked" },
        { icon: "lock" as const, label: "Secure checkout", description: "256-bit SSL" },
        { icon: "support" as const, label: "24/7 support", description: "Always here for you" },
      ],
    },
    schema: { fields: [] },
  }),
  "trust.guarantees": def({
    key: "trust.guarantees",
    label: "Guarantees",
    description: "3-column trust guarantees.",
    category: "trust",
    icon: "Shield",
    component: lazy(() => import("./blocks/trust").then((m) => ({ default: m.Guarantees }))),
    defaultProps: {
      title: "Our guarantee to you",
      items: [
        { title: "Quality promise", description: "If you don't love it, we'll make it right." },
        { title: "Secure payment", description: "Encrypted at every step." },
        { title: "Real humans", description: "Talk to our team anytime." },
      ],
    },
    schema: { fields: [{ type: "text", key: "title", label: "Title" }] },
  }),
  "trust.shipping": def({
    key: "trust.shipping",
    label: "Shipping table",
    description: "Region / time / price grid.",
    category: "trust",
    icon: "Truck",
    component: lazy(() => import("./blocks/trust").then((m) => ({ default: m.Shipping }))),
    defaultProps: {
      title: "Shipping & delivery",
      zones: [
        { region: "Algeria", time: "2–4 days", price: "Free over 5000 DA" },
        { region: "MENA", time: "5–8 days", price: "From 1500 DA" },
        { region: "International", time: "7–14 days", price: "From 3500 DA" },
      ],
    },
    schema: { fields: [{ type: "text", key: "title", label: "Title" }] },
  }),

  /* ---------------- CTA ---------------- */
  "cta.section": def({
    key: "cta.section",
    label: "CTA section",
    description: "Big gradient call-to-action.",
    category: "cta",
    icon: "Megaphone",
    component: lazy(() => import("./blocks/cta").then((m) => ({ default: m.CTASection }))),
    defaultProps: {
      title: "Ready to upgrade your style?",
      subtitle: "Join 12,000+ happy customers worldwide.",
      ctaLabel: "Start shopping",
      ctaHref: "#",
    },
    schema: {
      fields: [
        { type: "text", key: "title", label: "Title" },
        { type: "text", key: "subtitle", label: "Subtitle" },
        { type: "text", key: "ctaLabel", label: "Button label" },
        { type: "url", key: "ctaHref", label: "Button link" },
      ],
    },
  }),
  "cta.newsletter": def({
    key: "cta.newsletter",
    label: "Newsletter",
    description: "Email capture with subscribe form.",
    category: "cta",
    icon: "Mail",
    component: lazy(() => import("./blocks/cta").then((m) => ({ default: m.Newsletter }))),
    defaultProps: {
      title: "Join our newsletter",
      subtitle: "Get 10% off your first order.",
      placeholder: "you@email.com",
      ctaLabel: "Subscribe",
    },
    schema: {
      fields: [
        { type: "text", key: "title", label: "Title" },
        { type: "text", key: "subtitle", label: "Subtitle" },
        { type: "text", key: "placeholder", label: "Input placeholder" },
        { type: "text", key: "ctaLabel", label: "Button label" },
      ],
    },
  }),
  "cta.contact": def({
    key: "cta.contact",
    label: "Contact form",
    description: "Name / email / message form.",
    category: "cta",
    icon: "MessageSquare",
    component: lazy(() => import("./blocks/cta").then((m) => ({ default: m.ContactForm }))),
    defaultProps: { title: "Get in touch", subtitle: "We reply within 24 hours.", submitLabel: "Send message" },
    schema: {
      fields: [
        { type: "text", key: "title", label: "Title" },
        { type: "text", key: "subtitle", label: "Subtitle" },
        { type: "text", key: "submitLabel", label: "Submit label" },
      ],
    },
  }),
  "cta.floating": def({
    key: "cta.floating",
    label: "Floating button",
    description: "Always-visible floating CTA.",
    category: "cta",
    icon: "MousePointerClick",
    component: lazy(() => import("./blocks/cta").then((m) => ({ default: m.FloatingButton }))),
    defaultProps: { label: "Chat with us", href: "#", position: "bottom-right" as const },
    schema: {
      fields: [
        { type: "text", key: "label", label: "Label" },
        { type: "url", key: "href", label: "Link" },
        {
          type: "select",
          key: "position",
          label: "Position",
          options: [
            { value: "bottom-right", label: "Bottom right" },
            { value: "bottom-left", label: "Bottom left" },
          ],
        },
      ],
    },
  }),
  "cta.stickycart": def({
    key: "cta.stickycart",
    label: "Sticky add-to-cart",
    description: "Sticky bottom bar with product + add-to-cart.",
    category: "cta",
    icon: "ShoppingBag",
    component: lazy(() => import("./blocks/cta").then((m) => ({ default: m.StickyCart }))),
    defaultProps: { productName: "Featured product", price: "$49", ctaLabel: "Add to cart", ctaHref: "#" },
    schema: {
      fields: [
        { type: "text", key: "productName", label: "Product name" },
        { type: "text", key: "price", label: "Price" },
        { type: "text", key: "ctaLabel", label: "Button label" },
        { type: "url", key: "ctaHref", label: "Button link" },
      ],
    },
  }),
};

/** Ordered list — useful for category panels in the editor. */
export const BLOCK_LIST: BlockDefinition[] = Object.values(BLOCK_REGISTRY);

export const BLOCK_CATEGORIES: Array<{ key: string; label: string }> = [
  { key: "hero", label: "Hero" },
  { key: "products", label: "Products" },
  { key: "social-proof", label: "Social proof" },
  { key: "media", label: "Media" },
  { key: "banners", label: "Banners" },
  { key: "content", label: "Content" },
  { key: "trust", label: "Trust" },
  { key: "cta", label: "Call to action" },
];

export function getBlock(key: string): BlockDefinition | undefined {
  return BLOCK_REGISTRY[key];
}
