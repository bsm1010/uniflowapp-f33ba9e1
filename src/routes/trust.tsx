import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/landing/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, Database, Mail, FileText, UserCheck } from "lucide-react";

export const Route = createFileRoute("/trust")({
  head: () => ({
    meta: [
      { title: "Trust & Security — Fennecly" },
      {
        name: "description",
        content:
          "Learn how Fennecly protects your data, manages access, and handles privacy requests.",
      },
      { property: "og:title", content: "Trust & Security — Fennecly" },
      {
        property: "og:description",
        content:
          "How Fennecly handles security, privacy, data, and shared responsibility with its hosting platform.",
      },
    ],
  }),
  component: TrustPage,
});

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Shield;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3 space-y-0">
        <div className="rounded-md bg-primary/10 p-2 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground leading-relaxed space-y-3">
        {children}
      </CardContent>
    </Card>
  );
}

function TrustPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto max-w-4xl px-4 py-12 md:py-20">
        <header className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Trust & Security
          </h1>
          <p className="mt-3 text-muted-foreground">
            This page is maintained by the Fennecly team to answer common
            security and privacy questions about the platform. It describes
            current practices and is not an independent certification or audit.
          </p>
        </header>

        <div className="grid gap-5 md:grid-cols-2">
          <Section icon={Lock} title="Authentication & Access">
            <p>
              Sign-in is handled by our managed authentication provider with
              email/password and Google OAuth. Sessions use short-lived access
              tokens that are automatically refreshed.
            </p>
            <p>
              Access to your store data is enforced server-side using
              row-level security tied to your account.
            </p>
          </Section>

          <Section icon={Shield} title="Platform & Hosting">
            <p>
              Fennecly runs on managed cloud infrastructure (Lovable Cloud,
              built on Supabase, and Cloudflare for edge delivery). Encryption
              in transit (HTTPS/TLS) is enabled on all public endpoints.
            </p>
            <p>
              Security of the underlying platform is a shared responsibility
              between the hosting providers and the Fennecly team.
            </p>
          </Section>

          <Section icon={Database} title="Data You Provide">
            <p>
              We store the data you create in the app: store settings,
              products, orders, customer contact info you enter, and content
              you upload. Sensitive operational fields (such as integration
              tokens) are stored in restricted columns that are never returned
              to the browser.
            </p>
            <p>
              Payment processing details handled by third parties (e.g. Stripe
              Connect identifiers) are kept server-side and are not exposed in
              the client.
            </p>
          </Section>

          <Section icon={UserCheck} title="Subprocessors & Integrations">
            <p>
              Optional integrations you choose to enable (Telegram, Instagram,
              Resend, ElevenLabs, Infobip, and others) receive only the data
              required to perform the requested action. You can disconnect
              them at any time from your dashboard.
            </p>
          </Section>

          <Section icon={FileText} title="Retention & Deletion">
            <p>
              You can delete stores, products, orders, and other records from
              your dashboard. Account deletion removes your profile and the
              business data tied to it on a best-effort basis, subject to
              short retention for backups and legal requirements.
            </p>
          </Section>

          <Section icon={Mail} title="Privacy Requests & Contact">
            <p>
              For privacy requests, security reports, or questions about how
              your data is handled, please reach out from the contact page or
              email the address listed there. We aim to acknowledge security
              reports promptly.
            </p>
            <p>
              <Link to="/" className="text-primary hover:underline">
                Back to home
              </Link>
            </p>
          </Section>
        </div>

        <p className="mt-10 text-xs text-muted-foreground">
          This page describes Fennecly's current practices and may be updated
          as the product evolves. It does not constitute legal advice or a
          guarantee of any specific compliance framework.
        </p>
      </main>
    </div>
  );
}
