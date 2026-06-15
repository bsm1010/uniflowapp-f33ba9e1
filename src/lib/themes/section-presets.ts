import type { SectionInstance } from "@/components/storefront/blocks/types";

export interface SectionPreset {
  id: string;
  name: string;
  description: string;
  sections: SectionInstance[];
}

export const SECTION_PRESETS: SectionPreset[] = [
  {
    id: "hero-split-grid",
    name: "Split Hero + Feature Grid",
    description:
      "A split hero with image on the right, followed by a 3-column feature grid with icons.",
    sections: [
      {
        id: "hero-1",
        blockKey: "hero.split",
        props: {
          eyebrow: "New Collection",
          title: "Designed for the modern edge",
          subtitle: "Premium quality pieces crafted for those who refuse to blend in.",
          ctaLabel: "Shop Collection",
          ctaHref: "#shop",
          secondaryLabel: "See Lookbook",
          secondaryHref: "#lookbook",
          imageUrl: "",
        },
      },
      {
        id: "features-1",
        blockKey: "content.features",
        props: {
          title: "Why choose us",
          subtitle: "Every detail matters when it comes to your style.",
          items: [
            {
              title: "Premium Materials",
              description: "Sourced from the finest suppliers worldwide.",
              icon: "Gem",
            },
            {
              title: "Free Shipping",
              description: "On all orders over $100, delivered to your door.",
              icon: "Truck",
            },
            {
              title: "24/7 Support",
              description: "Our team is here around the clock to help.",
              icon: "HeadphonesIcon",
            },
          ],
        },
      },
    ],
  },
  {
    id: "hero-centered-bento-testimonials",
    name: "Centered Hero + Bento + Testimonials",
    description: "A centered hero with large heading, bento product grid, and testimonial slider.",
    sections: [
      {
        id: "hero-centered-1",
        blockKey: "hero.centered",
        props: {
          title: "Elevate your everyday",
          subtitle:
            "Curated pieces for the discerning eye. Where craftsmanship meets contemporary design.",
          ctaLabel: "Explore Collection",
          ctaHref: "#shop",
          secondaryLabel: "Our Story",
          secondaryHref: "#about",
        },
      },
      {
        id: "bento-1",
        blockKey: "products.bento",
        props: { title: "Featured drops" },
      },
      {
        id: "testimonials-1",
        blockKey: "social.testimonials",
        props: {
          title: "Loved by thousands",
          items: [
            {
              name: "Sarah K.",
              role: "Verified Buyer",
              avatar: "",
              content:
                "Absolutely stunning quality. The fabric feels premium and the fit is perfect. Will definitely order again.",
              rating: 5,
            },
            {
              name: "Marcus J.",
              role: "Verified Buyer",
              avatar: "",
              content:
                "Fast shipping and exactly as described. This is my go-to store for streetwear now.",
              rating: 5,
            },
            {
              name: "Elena R.",
              role: "Verified Buyer",
              avatar: "",
              content:
                "The attention to detail is incredible. You can feel the quality the moment you unbox.",
              rating: 5,
            },
          ],
        },
      },
    ],
  },
  {
    id: "fullbleed-grid-cta",
    name: "Fullbleed Hero + Grid + CTA",
    description: "Full-bleed hero with gradient overlay, product grid, and bold CTA section.",
    sections: [
      {
        id: "hero-full-1",
        blockKey: "hero.gradient",
        props: {
          title: "Bold by nature",
          subtitle: "Statement pieces that redefine your wardrobe. Drop 2025 is here.",
          ctaLabel: "Shop Drop",
          ctaHref: "#shop",
          gradientFrom: "#0f0f1a",
          gradientTo: "#1a1040",
        },
      },
      {
        id: "grid-1",
        blockKey: "products.grid",
        props: { title: "Latest arrivals", subtitle: "Fresh off the runway", columns: 4 },
      },
      {
        id: "cta-1",
        blockKey: "cta.section",
        props: {
          title: "Join the movement",
          subtitle: "Sign up for early access to our next drop and get 15% off your first order.",
          ctaLabel: "Get Early Access",
          ctaHref: "#",
        },
      },
    ],
  },
];

export function getSectionPreset(id: string): SectionPreset | undefined {
  return SECTION_PRESETS.find((p) => p.id === id);
}
