import { ZRExpressAdapter } from "../adapters/ZRExpressAdapter";
import type { ApiKeyValidationResult } from "./YalidineService";

/**
 * Service layer for ZR Express (Procolis).
 * ZR Express requires both a `token` (apiKey) and a `key` (apiSecret).
 */
export class ZRExpressService {
  static async validateApiKey(
    apiKey: string,
    apiSecret = "",
  ): Promise<ApiKeyValidationResult> {
    if (!apiKey || !apiKey.trim()) {
      return { success: false, message: "API token is required." };
    }
    const adapter = new ZRExpressAdapter({
      apiKey: apiKey.trim(),
      apiSecret: apiSecret.trim(),
    });
    const result = await adapter.validateCredentials();
    return { success: result.ok, message: result.message };
  }
}
