import { EcoCourierAdapter } from "../adapters/EcoCourierAdapter";
import type { ApiKeyValidationResult } from "./YalidineService";

export class EcoCourierService {
  static async validateApiKey(apiKey: string, apiSecret = ""): Promise<ApiKeyValidationResult> {
    if (!apiKey || !apiKey.trim()) {
      return { success: false, message: "API key is required." };
    }
    const adapter = new EcoCourierAdapter({
      apiKey: apiKey.trim(),
      apiSecret: apiSecret.trim(),
    });
    const result = await adapter.validateCredentials();
    return { success: result.ok, message: result.message };
  }
}
