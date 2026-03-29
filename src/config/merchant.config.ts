import crypto from 'crypto';

export interface AadeConfig {
  baseUrl: string;
  userId: string;
  subscriptionKey: string;
}

export interface WrappConfig {
  baseUrl: string;
  apiKey: string;
  email: string;
  wrappUserId: string;
}

export interface MerchantConfig {
  merchantKey: string;
  apiKey: string;
  aade: AadeConfig;
  wrapp: WrappConfig;
}

// Registry: apiKey -> MerchantConfig
const merchantsByApiKey = new Map<string, MerchantConfig>();
// Registry: merchantKey -> MerchantConfig
const merchantsByKey = new Map<string, MerchantConfig>();

/**
 * Scan environment variables for MERCHANT_* prefixes and build merchant configs.
 * Pattern: MERCHANT_{key}_API_KEY, MERCHANT_{key}_AADE_USER_ID, etc.
 */
export function loadMerchantConfigs(): void {
  merchantsByApiKey.clear();
  merchantsByKey.clear();

  // Shared base URLs (same for all merchants)
  const aadeBaseUrl = process.env.AADE_BASE_URL || 'https://mydataapidev.aade.gr/DCL';
  const wrappBaseUrl = process.env.WRAPP_BASE_URL || 'https://wrapp.ai/api/v1';

  // Find all unique merchant keys from env vars
  const merchantKeys = new Set<string>();
  for (const key of Object.keys(process.env)) {
    const match = key.match(/^MERCHANT_([^_]+)_/);
    if (match?.[1]) {
      merchantKeys.add(match[1]);
    }
  }

  for (const merchantKey of merchantKeys) {
    const prefix = `MERCHANT_${merchantKey}_`;

    const merchantApiKey = process.env[`${prefix}API_KEY`] || '';
    const aadeUserId = process.env[`${prefix}AADE_USER_ID`] || '';
    const aadeSubscriptionKey = process.env[`${prefix}AADE_SUBSCRIPTION_KEY`] || '';
    const wrappApiKey = process.env[`${prefix}WRAPP_API_KEY`] || '';
    const wrappEmail = process.env[`${prefix}WRAPP_EMAIL`] || '';
    const wrappUserId = process.env[`${prefix}WRAPP_USER_ID`] || '';

    if (!aadeUserId || !aadeSubscriptionKey) {
      console.warn(`⚠️  Merchant "${merchantKey}": missing AADE_USER_ID or AADE_SUBSCRIPTION_KEY, skipping`);
      continue;
    }

    if (!merchantApiKey) {
      console.warn(`⚠️  Merchant "${merchantKey}": missing API_KEY, generating a random one`);
    }

    const apiKey = merchantApiKey || crypto.randomBytes(24).toString('hex');

    const config: MerchantConfig = {
      merchantKey,
      apiKey,
      aade: {
        baseUrl: aadeBaseUrl,
        userId: aadeUserId,
        subscriptionKey: aadeSubscriptionKey,
      },
      wrapp: {
        baseUrl: wrappBaseUrl,
        apiKey: wrappApiKey,
        email: wrappEmail,
        wrappUserId,
      },
    };

    merchantsByApiKey.set(apiKey, config);
    merchantsByKey.set(merchantKey, config);
  }
}

export function getMerchantByApiKey(apiKey: string): MerchantConfig | undefined {
  return merchantsByApiKey.get(apiKey);
}

export function getMerchantByKey(merchantKey: string): MerchantConfig | undefined {
  return merchantsByKey.get(merchantKey);
}

export function getAllMerchants(): MerchantConfig[] {
  return Array.from(merchantsByKey.values());
}

export function validateMerchantConfigs(): boolean {
  return merchantsByKey.size > 0;
}
