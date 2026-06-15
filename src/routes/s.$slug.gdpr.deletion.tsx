import { createFileRoute } from "@tanstack/react-router";
import { StorefrontShell } from "@/components/storefront/StorefrontShell";
import { DeletionRequestForm } from "@/components/gdpr/DeletionRequestForm";
import { type StoreSettings } from "@/lib/storeTheme";
import { fetchSettings } from "@/lib/storefrontCache";

export const Route = createFileRoute("/s/$slug/gdpr/deletion")({
  component: DeletionRequestPage,
  loader: ({ params }) => fetchSettings(params.slug),
  head: ({ params, loaderData }) => ({
    meta: [{ title: `Data Deletion — ${loaderData?.store_name ?? params.slug}` }],
  }),
});

function DeletionRequestPage() {
  const params = Route.useParams();
  const loaderData = Route.useLoaderData();

  if (!loaderData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Store not found</p>
      </div>
    );
  }

  return (
    <StorefrontShell settings={loaderData as StoreSettings}>
      <div className="max-w-3xl mx-auto px-4 py-12">
        <DeletionRequestForm
          storeId={loaderData.user_id}
          storeName={loaderData.store_name ?? params.slug}
        />
      </div>
    </StorefrontShell>
  );
}
