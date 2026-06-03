import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Download, Mail, Send, CheckCircle } from "lucide-react";
import { StorefrontShell } from "@/components/storefront/StorefrontShell";
import { fetchSettings, type StoreSettings } from "@/lib/storeTheme";
import { requestDataExportAsCustomer } from "@/lib/gdpr/data-export.functions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export const Route = createFileRoute("/s/$slug/gdpr/export")({
  component: DataExportRequestPage,
  loader: ({ params }) => fetchSettings(params.slug),
  head: ({ params, loaderData }) => ({
    meta: [
      { title: `Data Export — ${loaderData?.store_name ?? params.slug}` },
    ],
  }),
});

function DataExportRequestPage() {
  const params = Route.useParams();
  const loaderData = Route.useLoaderData();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<"download" | "email">("download");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!loaderData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Store not found</p>
      </div>
    );
  }

  const storeId = loaderData.user_id;
  const storeName = loaderData.store_name ?? params.slug;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error("Please fill in your name and email");
      return;
    }

    setSubmitting(true);
    try {
      await requestDataExportAsCustomer({
        data: {
          storeId,
          name: name.trim(),
          email: email.trim(),
          deliveryMethod,
        },
      });
      setSubmitted(true);
      toast.success("Export request submitted");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <StorefrontShell settings={loaderData as StoreSettings}>
      <div className="max-w-3xl mx-auto px-4 py-12">
        {submitted ? (
          <Card className="border-border/60 shadow-soft max-w-lg mx-auto">
            <CardContent className="p-8 text-center">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white shadow-lg mb-4">
                <CheckCircle className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold mb-2">Request Submitted</h3>
              <p className="text-muted-foreground">
                Your data export request has been submitted to {storeName}. The store owner will
                process your request and provide your data shortly.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border/60 shadow-soft max-w-lg mx-auto">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="grid place-items-center h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-md">
                  <Download className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base">Request Your Data</CardTitle>
                  <CardDescription>
                    Request a copy of your personal data from {storeName}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="export-name">Full Name *</Label>
                  <Input
                    id="export-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="export-email">Email Address *</Label>
                  <Input
                    id="export-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div className="space-y-3">
                  <Label>Delivery Method</Label>
                  <RadioGroup value={deliveryMethod} onValueChange={(v) => setDeliveryMethod(v as any)}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="download" id="dl" />
                      <Label htmlFor="dl" className="flex items-center gap-2 cursor-pointer">
                        <Download className="h-4 w-4" /> Download JSON
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="email" id="em" />
                      <Label htmlFor="em" className="flex items-center gap-2 cursor-pointer">
                        <Mail className="h-4 w-4" /> Email
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                <Button type="submit" disabled={submitting} className="w-full">
                  <Send className="h-4 w-4 mr-2" />
                  {submitting ? "Submitting..." : "Submit Request"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </StorefrontShell>
  );
}
