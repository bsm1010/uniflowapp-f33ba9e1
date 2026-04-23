import type { DeliveryAdapter, DeliveryCredentials } from "./types";
import { YalidineAdapter } from "./adapters/YalidineAdapter";
import { ZRExpressAdapter } from "./adapters/ZRExpressAdapter";

/**
 * Factory map of provider key → adapter constructor.
 * To add a new provider:
 *   1. Create `adapters/MyProviderAdapter.ts` extending BaseDeliveryAdapter
 *   2. Register it here under a stable lowercase key
 *   3. (Optional) seed it in the delivery_companies table
 */
type AdapterCtor = new (creds: DeliveryCredentials) => DeliveryAdapter;

const ADAPTER_REGISTRY: Record<string, AdapterCtor> = {
  yalidine: YalidineAdapter,
  zr_express: ZRExpressAdapter,
  zrexpress: ZRExpressAdapter, // alias tolerant of stored variants
};

export function normalizeProviderKey(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, "_");
}

export function getAdapterCtor(name: string): AdapterCtor | null {
  return ADAPTER_REGISTRY[normalizeProviderKey(name)] ?? null;
}

export function listSupportedProviders(): string[] {
  return Object.keys(ADAPTER_REGISTRY);
}
