import type { ComponentType } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Package, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, EmptyState } from "@/components/dashboard/PageHeader";

export const Route = createFileRoute("/dashboard/products")({
  component: ProductsPage,
  head: () => ({ meta: [{ title: "Products — Storely" }] }),
});

function ProductsPage() {
  const Icon: ComponentType<{ className?: string }> = Package;
  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        eyebrow="Catalog"
        title="Products"
        description="Manage everything you sell in one place."
        actions={
          <Button>
            <Plus className="h-4 w-4" /> Add product
          </Button>
        }
      />
      <EmptyState
        icon={Icon}
        title="No products yet"
        description="Start building your catalog by adding your first product."
        action={
          <Button>
            <Plus className="h-4 w-4" /> Add your first product
          </Button>
        }
      />
    </div>
  );
}
