import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";

import flowImage from "@/assets/fennecly-flow.png";

// Defer below-the-fold sections so the hero paints faster.
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
      { title: "Fennecly — AI Automation Platform" },
      {
        name: "description",
        content:
          "Automate customer conversations, generate leads, and increase sales with Fennecly AI-powered messaging automation.",
      },
      {
        property: "og:title",
        content: "Fennecly — AI Automation Platform",
      },
      {
        property: "og:description",
        content:
          "Automate Instagram, Messenger, and WhatsApp conversations using AI.",
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

      {/* NEW AI WORKFLOW SECTION */}
      <section className="relative overflow-hidden py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            
            {/* LEFT CONTENT */}
            <div>
              <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white backdrop-blur">
                ⚡ AI Automation Platform
              </div>

              <h2 className="mt-6 text-5xl font-bold tracking-tight text-white">
                Turn conversations into
                <span className="block text-orange-500">
                  real revenue
                </span>
              </h2>

              <p className="mt-6 text-lg leading-8 text-zinc-400">
                Fennecly helps businesses automate replies,
                capture leads, and boost sales directly from
                Instagram, Messenger, and WhatsApp using AI.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <button className="rounded-2xl bg-orange-500 px-6 py-3 font-medium text-white transition hover:scale-105 hover:bg-orange-400">
                  Start Free
                </button>

                <button className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3 font-medium text-white backdrop-blur transition hover:bg-white/10">
                  Learn More
                </button>
              </div>
            </div>

            {/* RIGHT IMAGE */}
            <div className="relative">
              <div className="absolute inset-0 rounded-[40px] bg-orange-500/20 blur-3xl" />

              <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-black/40 p-6 backdrop-blur-xl">
                <img
                  src={flowImage}
                  alt="Fennecly workflow"
                  className="w-full object-contain"
                />
              </div>
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
