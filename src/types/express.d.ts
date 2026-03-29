import type { MerchantConfig } from '../config/merchant.config';
import type { AadeClient } from '../services/aadeClient';
import type { WrappClient } from '../services/wrappClient';

declare global {
  namespace Express {
    interface Request {
      merchantKey?: string;
      merchantConfig?: MerchantConfig;
      aadeClient?: AadeClient;
      wrappClient?: WrappClient;
    }
  }
}
