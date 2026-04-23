import type {
  CreateShipmentInput,
  CreateShipmentResult,
  DeliveryAdapter,
  DeliveryCredentials,
  TrackingResult,
  ValidationResult,
} from "../types";

/**
 * Base class for delivery provider adapters.
 * Provides shared utilities (tracking number generation, fetch helper)
 * so concrete adapters only implement provider-specific logic.
 */
export abstract class BaseDeliveryAdapter implements DeliveryAdapter {
  abstract readonly key: string;
  abstract readonly label: string;

  protected credentials: DeliveryCredentials;

  constructor(credentials: DeliveryCredentials) {
    this.credentials = credentials;
  }

  abstract createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult>;
  abstract trackShipment(trackingNumber: string): Promise<TrackingResult>;
  abstract validateCredentials(): Promise<ValidationResult>;

  /** Generate a fallback tracking number when API is not configured. */
  protected generateTrackingNumber(prefix: string): string {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `${prefix}-${ts}-${rand}`;
  }

  /** Convenience JSON fetch with timeout + error normalization. */
  protected async request<T>(
    url: string,
    init: RequestInit & { timeoutMs?: number } = {},
  ): Promise<T> {
    const { timeoutMs = 15_000, ...rest } = init;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...rest, signal: controller.signal });
      const text = await res.text();
      const data = text ? (JSON.parse(text) as T) : ({} as T);
      if (!res.ok) {
        throw new Error(
          `[${this.label}] Request failed (${res.status}): ${text || res.statusText}`,
        );
      }
      return data;
    } finally {
      clearTimeout(timer);
    }
  }

  protected hasCredentials(): boolean {
    return Boolean(this.credentials.apiKey && this.credentials.apiKey.trim().length > 0);
  }
}
