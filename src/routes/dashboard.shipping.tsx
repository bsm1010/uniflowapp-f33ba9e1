import { createFileRoute } from "@tanstack/react-router";
import { Truck } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShippingCompaniesSection } from "@/components/dashboard/ShippingCompaniesSection";
import { TariffsSection } from "@/components/dashboard/TariffsSection";
import deliveryTruck from "@/assets/delivery-truck.png";

export const Route = createFileRoute("/dashboard/shipping")({
  component: ShippingSettingsPage,
  head: () => ({
    meta: [
      { title: "Shipping Settings — Fennecly" },
      {
        name: "description",
        content:
          "Manage delivery companies and per-wilaya tariffs for your store.",
      },
    ],
  }),
});

function ShippingSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={Truck}
        title="Shipping Settings"
        description="Manage your delivery companies and set tariffs per wilaya."
      />

      {/* Hero showcase */}
      <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 text-white shadow-lg">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 80% 60%, white 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative grid items-center gap-6 p-6 sm:p-8 md:grid-cols-2 md:gap-4">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
              🚚 Fennecly Delivery Network
            </span>
            <h2 className="text-2xl font-bold leading-tight sm:text-3xl md:text-4xl">
              وصّل طلباتك لكل ولاية في الجزائر 🇩🇿
            </h2>
            <p className="text-sm leading-relaxed text-white/80 sm:text-base">
              Connect with Algeria's top delivery companies. Set custom tariffs per wilaya, track shipments in real-time, and grow your business with confidence.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium backdrop-blur">58 Wilayas</span>
              <span className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium backdrop-blur">Yalidine</span>
              <span className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium backdrop-blur">ZR Express</span>
              <span className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium backdrop-blur">+ More</span>
            </div>
          </div>
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 bg-white/10 blur-3xl rounded-full" />
            <img
              src={deliveryTruck}
              alt="Fennecly delivery truck with packages"
              className="relative w-full max-w-md drop-shadow-2xl animate-[float_6s_ease-in-out_infinite]"
            />
          </div>
        </div>
        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
        `}</style>
      </section>

      <Tabs defaultValue="companies" className="space-y-4">
        <TabsList className="grid w-full max-w-sm grid-cols-2">
          <TabsTrigger value="companies">Companies</TabsTrigger>
          <TabsTrigger value="tariffs">Tariffs</TabsTrigger>
        </TabsList>

        <TabsContent value="companies" className="space-y-4">
          <ShippingCompaniesSection />
        </TabsContent>

        <TabsContent value="tariffs" className="space-y-4">
          <TariffsSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
