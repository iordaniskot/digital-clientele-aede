import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  aade: {
    baseUrl: process.env.AADE_BASE_URL || 'https://mydataapidev.aade.gr/DCL',
    userId: process.env.AADE_USER_ID || '',
    subscriptionKey: process.env.AADE_SUBSCRIPTION_KEY || '',
  },
  wrapp: {
    baseUrl: process.env.WRAPP_BASE_URL || 'https://wrapp.ai/api/v1',
    apiKey: process.env.WRAPP_API_KEY || '',
    email: process.env.WRAPP_EMAIL || '',
    wrappUserId: process.env.WRAPP_USER_ID || '',
  },
} as const;
