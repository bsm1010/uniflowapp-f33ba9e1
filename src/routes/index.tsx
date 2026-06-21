import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { DashboardTools } from "@/components/landing/DashboardTools";
import { WindowsDownload } from "@/components/landing/WindowsDownload";
import { DeliveryNetwork } from "@/components/landing/DeliveryNetwork";
import { Features } from "@/components/landing/Features";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Pricing } from "@/components/landing/Pricing";
import { Testimonials } from "@/components/landing/Testimonials";
import { CTA } from "@/components/landing/CTA";
import { Footer } from "@/components/landing/Footer";

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

function Index() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />
      <Hero />
      <div className="cv-auto">
        <DashboardTools />
      </div>
      <div className="cv-auto">
        <WindowsDownload />
      </div>
      <div className="cv-auto">
        <DeliveryNetwork />
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
    </main>
  );
}
