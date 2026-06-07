// Module augmentation for TanStack Router/Start type registration.
// Keep this OUTSIDE src/routeTree.gen.ts (the generated file) so that
// the next `vite dev` regeneration does not silently drop the Register
// interface and break router/link typings.
import type { getRouter } from "./router";
import type { startInstance } from "./start";

declare module "@tanstack/react-start" {
  interface Register {
    ssr: true;
    router: Awaited<ReturnType<typeof getRouter>>;
    config: Awaited<ReturnType<typeof startInstance.getOptions>>;
  }
}

export {};
