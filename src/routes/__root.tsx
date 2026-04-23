import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { AuthProvider } from "@/hooks/use-auth";
import "@/lib/i18n";
import { applyDirection } from "@/lib/i18n";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Fenncly" },
      { name: "description", content: "Fennecly is a simple, powerful app that lets you build and launch your own online store in minutes—no coding needed. Design, customize, and start selling—all in" },
      { name: "author", content: "Lovable" },
      { property: "og:title", content: "Fenncly" },
      { property: "og:description", content: "Fennecly is a simple, powerful app that lets you build and launch your own online store in minutes—no coding needed. Design, customize, and start selling—all in" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "Fenncly" },
      { name: "twitter:description", content: "Fennecly is a simple, powerful app that lets you build and launch your own online store in minutes—no coding needed. Design, customize, and start selling—all in" },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/90abd9e0-e710-4cac-b932-bc0b5d29baec" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/90abd9e0-e710-4cac-b932-bc0b5d29baec" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;700&family=Playfair+Display:wght@400;600;800&family=DM+Serif+Display&family=JetBrains+Mono:wght@400;600&family=Manrope:wght@400;600;800&family=Sora:wght@400;600;800&family=Outfit:wght@400;600;800&family=Bricolage+Grotesque:wght@400;600;800&family=Fraunces:wght@400;600;800&family=Cormorant+Garamond:wght@400;600;700&family=IBM+Plex+Sans:wght@400;500;700&family=Bebas+Neue&family=Archivo+Black&family=Syne:wght@500;700;800&family=Plus+Jakarta+Sans:wght@400;600;800&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { i18n } = useTranslation();
  useEffect(() => {
    applyDirection(i18n.language);
  }, [i18n.language]);
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}
