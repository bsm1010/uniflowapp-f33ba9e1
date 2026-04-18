import { createFileRoute, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Mail, MapPin, Map as MapIcon, Phone, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { StorefrontShell } from "@/components/storefront/StorefrontShell";
import { getStoreTokens, type StoreSettings } from "@/lib/storeTheme";

export const Route = createFileRoute("/s/$slug/contact")({
  loader: async ({ params }) => {
    const { data, error } = await supabase
      .from("store_settings")
      .select("*")
      .eq("slug", params.slug)
      .maybeSingle();
    if (error || !data) throw notFound();
    return { settings: data as unknown as StoreSettings };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData
          ? `Contact — ${loaderData.settings.store_name}`
          : "Contact",
      },
      {
        name: "description",
        content: loaderData?.settings.contact_intro?.slice(0, 155) ?? "",
      },
    ],
  }),
  component: ContactPage,
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center text-center p-8">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Store not found</h1>
        <p className="text-muted-foreground">This store does not exist.</p>
      </div>
    </div>
  ),
});

function ContactPage() {
  const { settings } = Route.useLoaderData();
  const t = getStoreTokens(settings);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }
    if (message.length > 4000) {
      toast.error("Message is too long.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("contact_messages").insert({
      store_owner_id: settings.user_id,
      store_slug: settings.slug,
      sender_name: name.trim().slice(0, 120),
      sender_email: email.trim().slice(0, 200),
      message: message.trim(),
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
    setName("");
    setEmail("");
    setMessage("");
    toast.success("Message sent. We'll get back to you soon!");
  };

  const hasAnyDetail =
    settings.contact_email || settings.contact_phone || settings.contact_address;

  return (
    <StorefrontShell settings={settings}>
      <article className="max-w-5xl mx-auto px-4 sm:px-6 py-12 md:py-20">
        <div className="space-y-3 mb-10">
          <div
            className="text-xs uppercase tracking-[0.2em] font-medium"
            style={{ color: t.muted }}
          >
            {settings.store_name}
          </div>
          <h1
            className="text-4xl md:text-5xl font-semibold leading-tight tracking-tight"
            style={{ fontFamily: t.fontHeading, color: t.fg }}
          >
            Get in touch
          </h1>
          <p className="text-base md:text-lg max-w-2xl" style={{ color: t.muted }}>
            {settings.contact_intro || "Have a question? We'd love to hear from you."}
          </p>
        </div>

        <div className="grid gap-10 md:grid-cols-2">
          {/* Details */}
          <div className="space-y-6">
            {hasAnyDetail ? (
              <div className="space-y-4">
                {settings.contact_email && (
                  <DetailRow
                    icon={<Mail className="h-4 w-4" />}
                    label="Email"
                    href={`mailto:${settings.contact_email}`}
                    value={settings.contact_email}
                    t={t}
                  />
                )}
                {settings.contact_phone && (
                  <DetailRow
                    icon={<Phone className="h-4 w-4" />}
                    label="Phone"
                    href={`tel:${settings.contact_phone.replace(/\s+/g, "")}`}
                    value={settings.contact_phone}
                    t={t}
                  />
                )}
                {settings.contact_address && (
                  <DetailRow
                    icon={<MapPin className="h-4 w-4" />}
                    label="Address"
                    value={settings.contact_address}
                    t={t}
                  />
                )}
              </div>
            ) : (
              <p style={{ color: t.muted }}>
                The store hasn't added contact details yet.
              </p>
            )}

            {settings.contact_map_url && (
              <a
                href={settings.contact_map_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
                style={{
                  backgroundColor: t.primary,
                  color: t.onPrimary,
                  borderRadius: t.buttonRadius,
                }}
              >
                <MapIcon className="h-4 w-4" /> Get directions
              </a>
            )}
          </div>

          {/* Form */}
          {settings.contact_form_enabled && (
            <div
              className="p-6 md:p-8"
              style={{
                backgroundColor: t.surface,
                border: `1px solid ${t.border}`,
                borderRadius: t.radius.lg,
              }}
            >
              <h2
                className="text-xl font-semibold mb-5"
                style={{ fontFamily: t.fontHeading, color: t.fg }}
              >
                Send us a message
              </h2>

              {sent ? (
                <div
                  className="text-center py-10"
                  style={{ color: t.fg }}
                >
                  <div
                    className="mx-auto h-12 w-12 rounded-full flex items-center justify-center mb-3"
                    style={{ backgroundColor: t.primary, color: t.onPrimary }}
                  >
                    <Send className="h-5 w-5" />
                  </div>
                  <div className="font-medium">Thanks for reaching out!</div>
                  <p className="text-sm mt-1" style={{ color: t.muted }}>
                    We'll reply as soon as we can.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSent(false)}
                    className="mt-5 text-sm underline"
                    style={{ color: t.muted }}
                  >
                    Send another
                  </button>
                </div>
              ) : (
                <form onSubmit={submit} className="space-y-4">
                  <FormField label="Your name" t={t}>
                    <input
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={120}
                      className="w-full h-10 px-3 text-sm focus:outline-none"
                      style={{
                        backgroundColor: t.bg,
                        color: t.fg,
                        border: `1px solid ${t.border}`,
                        borderRadius: t.radius.sm,
                      }}
                    />
                  </FormField>
                  <FormField label="Your email" t={t}>
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      maxLength={200}
                      className="w-full h-10 px-3 text-sm focus:outline-none"
                      style={{
                        backgroundColor: t.bg,
                        color: t.fg,
                        border: `1px solid ${t.border}`,
                        borderRadius: t.radius.sm,
                      }}
                    />
                  </FormField>
                  <FormField label="Message" t={t}>
                    <textarea
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={5}
                      maxLength={4000}
                      className="w-full px-3 py-2 text-sm focus:outline-none resize-y"
                      style={{
                        backgroundColor: t.bg,
                        color: t.fg,
                        border: `1px solid ${t.border}`,
                        borderRadius: t.radius.sm,
                      }}
                    />
                  </FormField>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-60"
                    style={{
                      backgroundColor: t.primary,
                      color: t.onPrimary,
                      borderRadius: t.buttonRadius,
                    }}
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Send message
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </article>
    </StorefrontShell>
  );
}

function DetailRow({
  icon,
  label,
  value,
  href,
  t,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
  t: ReturnType<typeof getStoreTokens>;
}) {
  const body = (
    <div className="flex items-start gap-4">
      <div
        className="h-10 w-10 rounded-full flex items-center justify-center shrink-0"
        style={{ backgroundColor: t.surface, color: t.fg }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-xs uppercase tracking-wider" style={{ color: t.muted }}>
          {label}
        </div>
        <div className="text-base whitespace-pre-line break-words" style={{ color: t.fg }}>
          {value}
        </div>
      </div>
    </div>
  );
  return href ? (
    <a href={href} className="block hover:opacity-80 transition-opacity">
      {body}
    </a>
  ) : (
    body
  );
}

function FormField({
  label,
  children,
  t,
}: {
  label: string;
  children: React.ReactNode;
  t: ReturnType<typeof getStoreTokens>;
}) {
  return (
    <div className="space-y-1.5">
      <label
        className="text-xs uppercase tracking-wider font-medium"
        style={{ color: t.muted }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}
