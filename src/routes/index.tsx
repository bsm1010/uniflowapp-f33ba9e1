import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
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
const OutboundLottie = lazy(() =>
  import("@/components/landing/OutboundLottie").then((m) => ({
    default: m.OutboundLottie,
  })),
);
const WindowsDownload = lazy(() =>
  import("@/components/landing/WindowsDownload").then((m) => ({
    default: m.WindowsDownload,
  })),
);
const PhoneLottie = lazy(() =>
  import("@/components/landing/PhoneLottie").then((m) => ({
    default: m.PhoneLottie,
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
      { title: "Fennecly — All the tools you need, in one place" },
      {
        name: "description",
        content:
          "All the tools you need to manage your entire e-commerce business from a single, intuitive dashboard.",
      },
      {
        property: "og:title",
        content: "Fennecly — All the tools you need, in one place",
      },
      {
        property: "og:description",
        content:
          "Manage your entire e-commerce business from a single, intuitive dashboard — products, orders, shipping, marketing, and more.",
      },
    ],
    links: [{ rel: "canonical", href: "https://fennecly.online/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Fennecly",
          url: "https://fennecly.online",
          logo: "https://fennecly.online/icons/icon-512.png",
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Fennecly",
          url: "https://fennecly.online",
        }),
      },
    ],
  }),
});
function SectionFallback() {
  return <div className="h-[400px]" aria-hidden />;
}
function Index() {
  return (
    <main className="min-h-screen bg-[#0a0a14] text-white">
      <Navbar />
      <Hero />
      <Suspense fallback={<SectionFallback />}>
        <div className="cv-auto">
          <DashboardTools />
        </div>
        <div className="cv-auto">
          <WindowsDownload />
        </div>
        <div className="cv-auto">
          <OutboundLottie />
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
        <div className="cv-auto">
          <PhoneLottie />
        </div>
        <Footer />
      </Suspense>
    </main>
  );
}
