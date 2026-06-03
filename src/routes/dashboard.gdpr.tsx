import { createFileRoute } from "@tanstack/react-router";
import { Shield } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { CookieConsentSettings } from "@/components/gdpr/CookieConsentSettings";
import { ConsentStatsCard } from "@/components/gdpr/ConsentStatsCard";
import { PrivacyPolicyEditor } from "@/components/gdpr/PrivacyPolicyEditor";
import { DataExportSection } from "@/components/gdpr/DataExportSection";
import { DeletionRequestsSection } from "@/components/gdpr/DeletionRequestsSection";

export const Route = createFileRoute("/dashboard/gdpr")({
  component: GdprPage,
  head: () => ({ meta: [{ title: "GDPR & Privacy — Fennecly" }] }),
});

function GdprPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        eyebrow="Compliance"
        title="GDPR & Privacy"
        description="Manage cookie consent, privacy policy, data exports, and deletion requests"
        icon={Shield}
        gradient="from-red-500 via-rose-500 to-pink-500"
      />

      <div className="grid gap-6">
        <CookieConsentSettings />
        <ConsentStatsCard />
        <PrivacyPolicyEditor />
        <DataExportSection />
        <DeletionRequestsSection />
      </div>
    </div>
  );
}
