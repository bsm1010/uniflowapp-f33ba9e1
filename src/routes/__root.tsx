import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { AuthProvider } from "@/hooks/use-auth";
import "@/lib/i18n";
import { applyDirection } from "@/lib/i18n";

import appCss from "../styles.css?url";
import fennecyLogo from "@/assets/fennecly-logo.webp";

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
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#6d28d9" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "apple-mobile-web-app-title", content: "Fenncly" },
      { name: "mobile-web-app-capable", content: "yes" },
      { title: "Fennecly" },
      { name: "description", content: "Fennecly is a simple, powerful app that lets you build and launch your own online store in minutes—no coding needed. Design, customize, and start selling—all in" },
      { name: "author", content: "Lovable" },
      { property: "og:title", content: "Fennecly" },
      { property: "og:description", content: "Fennecly is a simple, powerful app that lets you build and launch your own online store in minutes—no coding needed. Design, customize, and start selling—all in" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "Fennecly" },
      { name: "twitter:description", content: "Fennecly is a simple, powerful app that lets you build and launch your own online store in minutes—no coding needed. Design, customize, and start selling—all in" },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/FhcV6bRv25eUX8Qg7W7DIEWJK802/social-images/social-1779851845531-KDF.webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/FhcV6bRv25eUX8Qg7W7DIEWJK802/social-images/social-1779851845531-KDF.webp" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "preload",
        as: "style",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Space+Grotesk:wght@400;500;700&family=Tajawal:wght@400;500;700&display=swap&font-display=swap",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Space+Grotesk:wght@400;500;700&family=Tajawal:wght@400;500;700&display=swap&font-display=swap",
      },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/icons/apple-touch-icon.png" },
      { rel: "icon", type: "image/png", sizes: "192x192", href: "/icons/icon-192.png" },
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
        <style
          dangerouslySetInnerHTML={{
              __html: `
              #app-boot-loader{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#fff;z-index:9999;transition:opacity .25s ease}
              #app-boot-loader.dark{background:#0b0a14}
              #app-boot-loader .logo{height:56px;width:180px;-webkit-mask:url(${fennecyLogo}) center/contain no-repeat;mask:url(${fennecyLogo}) center/contain no-repeat;background:oklch(0.47 0.27 295);animation:fennecly-pulse 1.4s ease-in-out infinite}
              #app-boot-loader.dark .logo{background:#fff}
              @keyframes fennecly-pulse{0%,100%{opacity:.55;transform:scale(1)}50%{opacity:1;transform:scale(1.04)}}
              .app-booted #app-boot-loader{opacity:0;pointer-events:none}
            `,
          }}
        />
      </head>
      <body>
        <div
          id="app-boot-loader"
          className={
            typeof document !== "undefined" &&
            document.documentElement.classList.contains("dark")
              ? "dark"
              : ""
          }
        >
          <div className="logo" role="img" aria-label="Fennecly" />
        </div>
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

  useEffect(() => {
    const t = window.setTimeout(() => {
      document.documentElement.classList.add("app-booted");
    }, 50);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}
