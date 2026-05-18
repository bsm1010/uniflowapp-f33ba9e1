import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";

import flowImage from "@/assets/fennecly-flow.png";

const DashboardTools = lazy(() =>
  import("@/components/landing/DashboardTools").then((m) => ({
    default: m.DashboardTools,
  })),
);

const Features = lazy(() =>
  import("@/components/landing/Features").then((m) => ({
    default: m.Features,
  })),
);

const HowItWorks = lazy(() =>
  import("@/components/landing/HowItWorks").then((m) => ({
    default: m.HowItWorks,
  })),
);

const Pricing = lazy(() =>
  import("@/components/landing/Pricing").then((m) => ({
    default: m.Pricing,
  })),
);

const Testimonials = lazy(() =>
  import("@/components/landing/Testimonials").then((m) => ({
    default: m.Testimonials,
  })),
);

const CTA = lazy(() =>
  import("@/components/landing/CTA").then((m) => ({
    default: m.CTA,
  })),
);

const WindowsDownload = lazy(() =>
  import("@/components/landing/WindowsDownload").then((m) => ({
    default: m.WindowsDownload,
  })),
);

const Footer = lazy(() =>
  import("@/components/landing/Footer").then((m) => ({
    default: m.Footer,
  })),
);

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Fennecly — Build Your Online Store" },
      {
        name: "description",
        content:
          "Launch your online store in minutes. Manage products, orders, and delivery all in one place. No coding needed.",
      },
      {
        property: "og:title",
        content: "Fennecly — Build Your Online Store",
      },
      {
        property: "og:description",
        content:
          "The easiest way to sell online in Algeria. Launch your store in minutes.",
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

      {/* IMAGE SHOWCASE SECTION */}
      <section className="relative overflow-hidden py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="relative">
            {/* Purple glow behind card */}
            <div className="absolute inset-0 rounded-[40px] bg-purple-600/20 blur-3xl" />

            {/* Big image card - no text, no buttons */}
            <div className="relative overflow-hidden rounded-[40px] border border-purple-500/20 bg-black/40 p-8 backdrop-blur-xl shadow-2xl shadow-purple-900/30">
              <img
                src={flowImage}
                alt="Fennecly platform"
                className="w-full object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      <Suspense fallback={<SectionFallback />}>
        <div className="cv-auto">
          <DashboardTools />
        </div>

        <div className="cv-auto">
          <WindowsDownload />
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
