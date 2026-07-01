import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Shield } from "lucide-react";
import DOMPurify from "isomorphic-dompurify";
import { StorefrontShell } from "@/components/storefront/StorefrontShell";
import {
  getPrivacyPolicyBySlug,
  type PrivacyPolicySettings,
} from "@/lib/gdpr/privacy-policy.functions";
import { type StoreSettings } from "@/lib/storeTheme";
import { fetchSettings } from "@/lib/storefrontCache";

export const Route = createFileRoute("/s/$slug/privacy")({
  component: PrivacyPolicyPage,
  loader: ({ params }) => fetchSettings(params.slug),
  head: ({ params, loaderData }) => ({
    meta: [{ title: `Privacy Policy — ${loaderData?.store_name ?? params.slug}` }],
  }),
});

function PrivacyPolicyPage() {
  const params = Route.useParams();
  const loaderData = Route.useLoaderData();
  const [policy, setPolicy] = useState<PrivacyPolicySettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPrivacyPolicyBySlug({ data: { slug: params.slug } }).then((p) => {
      setPolicy(p);
      setLoading(false);
    });
  }, [params.slug]);

  // Sanitize merchant-provided HTML to prevent stored XSS (SEC-XSS-001)
  const sanitizedCustomHtml = useMemo(() => {
    if (!policy?.custom_html) return "";
    return DOMPurify.sanitize(policy.custom_html, {
      USE_PROFILES: { html: true },
      FORBID_TAGS: ["style", "script", "iframe", "object", "embed", "form"],
      FORBID_ATTR: ["style", "onerror", "onload", "onclick"],
    });
  }, [policy?.custom_html]);

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
        <div className="flex items-center gap-3 mb-8">
          <div className="grid place-items-center h-12 w-12 rounded-2xl bg-gradient-to-br from-red-500 to-rose-500 text-white shadow-md">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Privacy Policy</h1>
            <p className="text-sm text-muted-foreground">
              Last updated:{" "}
              {policy?.last_updated ? new Date(policy.last_updated).toLocaleDateString() : "N/A"}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : !policy || !policy.enabled ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No privacy policy available for this store.</p>
          </div>
        ) : policy.custom_html ? (
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: sanitizedCustomHtml }}
          />
        ) : (
          <div className="space-y-8">
            {policy.sections?.map((section, index) => (
              <div key={index}>
                <h2 className="text-lg font-semibold mb-2">{section.title}</h2>
                <p className="text-muted-foreground leading-relaxed">{section.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </StorefrontShell>
  );
}
