import { createFileRoute } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/dashboard/PageHeader";

export const Route = createFileRoute("/dashboard/orders")({
  component: OrdersPage,
  head: () => ({ meta: [{ title: "Orders — Storely" }] }),
});

function OrdersPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        eyebrow="Sales"
        title="Orders"
        description="Track, fulfill, and manage customer orders."
      />
      <EmptyState
        icon={ShoppingBag}
        title="No orders yet"
        description="Once customers buy, their orders show up here."
      />
    </div>
  );
}
