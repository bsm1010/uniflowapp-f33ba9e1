import { YalidineService, type ApiKeyValidationResult } from "./YalidineService";
import { ZRExpressService } from "./ZRExpressService";
import { MaystroService } from "./MaystroService";
import { SherpaService } from "./SherpaService";
import { EcoCourierService } from "./EcoCourierService";
import { AndersonService } from "./AndersonService";
import { GuepexService } from "./GuepexService";
import { DHDService } from "./DHDService";
import { ChronorexService } from "./ChronorexService";
import { normalizeProviderKey } from "../registry";

export {
  YalidineService,
  ZRExpressService,
  MaystroService,
  SherpaService,
  EcoCourierService,
  AndersonService,
  GuepexService,
  DHDService,
  ChronorexService,
};
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
    case "maystro":
    case "maystro_delivery":
      return MaystroService.validateApiKey(apiKey, apiSecret);
    case "sherpa":
      return SherpaService.validateApiKey(apiKey, apiSecret);
    case "eco_courier":
    case "eco_courier_dz":
      return EcoCourierService.validateApiKey(apiKey, apiSecret);
    case "anderson":
    case "anderson_ecommerce":
      return AndersonService.validateApiKey(apiKey, apiSecret);
    case "guepex":
      return GuepexService.validateApiKey(apiKey, apiSecret);
    case "dhd":
    case "dhd_livraison":
      return DHDService.validateApiKey(apiKey, apiSecret);
    case "chronorex":
    case "chronorex_express":
      return ChronorexService.validateApiKey(apiKey, apiSecret);
    default:
      return { success: false, message: `No service registered for ${companyName}.` };
  }
}
