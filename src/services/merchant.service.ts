import { getMerchantByApiKey, type MerchantConfig } from '../config/merchant.config';
import { AadeClient } from './aadeClient';
import { WrappClient } from './wrappClient';

interface MerchantServices {
  config: MerchantConfig;
  aadeClient: AadeClient;
  wrappClient: WrappClient;
}

// Lazy-created singleton instances per merchant
const serviceInstances = new Map<string, MerchantServices>();

function getOrCreateServices(config: MerchantConfig): MerchantServices {
  let services = serviceInstances.get(config.merchantKey);
  if (!services) {
    services = {
      config,
      aadeClient: new AadeClient(config.aade),
      wrappClient: new WrappClient(config.wrapp),
    };
    serviceInstances.set(config.merchantKey, services);
  }
  return services;
}

export function getServicesByApiKey(apiKey: string): MerchantServices | undefined {
  const merchantConfig = getMerchantByApiKey(apiKey);
  if (!merchantConfig) return undefined;
  return getOrCreateServices(merchantConfig);
}
