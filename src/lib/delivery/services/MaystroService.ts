import { MaystroAdapter } from "../adapters/MaystroAdapter";
import type { ApiKeyValidationResult } from "./YalidineService";

export class MaystroService {
  static async validateApiKey(apiKey: string, apiSecret = ""): Promise<ApiKeyValidationResult> {
    if (!apiKey || !apiKey.trim()) {
      return { success: false, message: "API key is required." };
    }
    const adapter = new MaystroAdapter({
      apiKey: apiKey.trim(),
      apiSecret: apiSecret.trim(),
    });
    const result = await adapter.validateCredentials();
    return { success: result.ok, message: result.message };
  }
}
