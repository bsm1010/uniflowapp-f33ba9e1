import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";

// Defer below-the-fold sections so the hero paints faster.
const EcommerceBanner = lazy(() =>
  import("@/components/landing/EcommerceBanner").then((m) => ({ default: m.EcommerceBanner })),
);
const DashboardTools = lazy(() =>
  import("@/components/landing/DashboardTools").then((m) => ({ default: m.DashboardTools })),
);
const Features = lazy(() =>
  import("@/components/landing/Features").then((m) => ({ default: m.Features })),
);
const HowItWorks = lazy(() =>
  import("@/components/landing/HowItWorks").then((m) => ({ default: m.HowItWorks })),
);
const Pricing = lazy(() =>
  import("@/components/landing/Pricing").then((m) => ({ default: m.Pricing })),
);
const Testimonials = lazy(() =>
  import("@/components/landing/Testimonials").then((m) => ({ default: m.Testimonials })),
);
const CTA = lazy(() =>
  import("@/components/landing/CTA").then((m) => ({ default: m.CTA })),
);
const Footer = lazy(() =>
  import("@/components/landing/Footer").then((m) => ({ default: m.Footer })),
);

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Storely — Build Your Online Store in Minutes" },
      {
        name: "description",
        content:
          "Create, customize, and launch your e-commerce business without code. Drag-and-drop builder, beautiful themes, secure payments, and analytics.",
      },
      { property: "og:title", content: "Storely — Build Your Online Store in Minutes" },
      {
        property: "og:description",
        content: "Launch your e-commerce store in minutes — no code required.",
      },
    ],
  }),
});

function SectionFallback() {
  return <div className="h-[400px]" aria-hidden />;
}

function Index() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <Suspense fallback={<SectionFallback />}>
        <div className="cv-auto">
          <EcommerceBanner />
        </div>
        <div className="cv-auto">
          <Features />
        </div>
        <div className="cv-auto">
          <HowItWorks />
        </div>
        <div className="cv-auto">
          <Pricing />
        </div>
        <div className="cv-auto">
          <Testimonials />
        </div>
        <div className="cv-auto">
          <CTA />
        </div>
        <Footer />
      </Suspense>
    </main>
  );
}
