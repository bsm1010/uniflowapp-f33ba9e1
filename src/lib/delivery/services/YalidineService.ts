import { YalidineAdapter } from "../adapters/YalidineAdapter";

export interface ApiKeyValidationResult {
  success: boolean;
  message: string;
}

/**
 * Service layer for Yalidine.
 * Encapsulates provider-specific validation so callers (server functions, jobs)
 * never construct adapters directly.
 */
export class YalidineService {
  /**
   * Validate a Yalidine credential pair by issuing a lightweight authenticated
   * request. Yalidine requires both an API ID (apiSecret) and API token (apiKey).
   */
  static async validateApiKey(
    apiKey: string,
    apiSecret = "",
  ): Promise<ApiKeyValidationResult> {
    if (!apiKey || !apiKey.trim()) {
      return { success: false, message: "API token is required." };
    }
    const adapter = new YalidineAdapter({
      apiKey: apiKey.trim(),
      apiSecret: apiSecret.trim(),
    });
    const result = await adapter.validateCredentials();
    return { success: result.ok, message: result.message };
  }
}
