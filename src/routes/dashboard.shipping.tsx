import { createFileRoute } from "@tanstack/react-router";
import { Truck } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShippingCompaniesSection } from "@/components/dashboard/ShippingCompaniesSection";
import { TariffsSection } from "@/components/dashboard/TariffsSection";

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
