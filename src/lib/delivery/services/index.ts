import { YalidineService, type ApiKeyValidationResult } from "./YalidineService";
import { ZRExpressService } from "./ZRExpressService";
import { normalizeProviderKey } from "../registry";

export { YalidineService, ZRExpressService };
export type { ApiKeyValidationResult };

/**
 * Resolve a provider service by company name and validate an API key.
 * Lets callers stay generic without knowing which concrete service to use.
 */
export async function validateApiKeyForCompany(
  companyName: string,
  apiKey: string,
  apiSecret = "",
): Promise<ApiKeyValidationResult> {
  const key = normalizeProviderKey(companyName);
  switch (key) {
    case "yalidine":
      return YalidineService.validateApiKey(apiKey, apiSecret);
    case "zr_express":
    case "zrexpress":
      return ZRExpressService.validateApiKey(apiKey, apiSecret);
    default:
      return { success: false, message: `No service registered for ${companyName}.` };
  }
}
