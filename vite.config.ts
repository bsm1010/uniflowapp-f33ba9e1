// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
    importProtection: {
      // .functions.ts files wrap server logic in createServerFn().handler(...) and
      // are imported by client routes for the RPC bridge. The static imports of
      // `*.server.*` modules inside them are stripped from the client bundle by
      // the bundler, so allow them here.
      exclude: ["**/*.functions.ts"],
    },
  },
  vite: {
    server: {
      host: true,
    },
    build: {
      target: "es2022",
      rollupOptions: {
        output: {
          manualChunks: {
            "vendor-react": ["react", "react-dom"],
            "vendor-ui": ["@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu", "@radix-ui/react-select", "@radix-ui/react-tooltip", "@radix-ui/react-popover"],
            "vendor-charts": ["recharts"],
            "vendor-motion": ["framer-motion"],
            "vendor-pdf": ["pdf-lib"],
            "vendor-supabase": ["@supabase/supabase-js"],
          },
        },
      },
    },
  },
});
