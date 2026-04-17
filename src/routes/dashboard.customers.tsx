import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/dashboard/PageHeader";

export const Route = createFileRoute("/dashboard/customers")({
  component: CustomersPage,
  head: () => ({ meta: [{ title: "Customers — Storely" }] }),
});

function CustomersPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        eyebrow="Audience"
        title="Customers"
        description="Get to know the people buying from your store."
      />
      <EmptyState
        icon={Users}
        title="No customers yet"
        description="Customer profiles appear here after their first order."
      />
    </div>
  );
}
