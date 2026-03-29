import type { Request, Response, NextFunction } from 'express';
import { getServicesByApiKey } from '../services/merchant.service';

/**
 * Middleware that reads X-Api-Key header, resolves merchant config,
 * and attaches the merchant's AadeClient + WrappClient to the request.
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const apiKey = req.headers['x-api-key'] as string | undefined;

  if (!apiKey) {
    res.status(401).json({ error: 'Missing X-Api-Key header' });
    return;
  }

  const result = getServicesByApiKey(apiKey);
  if (!result) {
    res.status(401).json({ error: 'Invalid API key' });
    return;
  }

  req.merchantKey = result.config.merchantKey;
  req.merchantConfig = result.config;
  req.aadeClient = result.aadeClient;
  req.wrappClient = result.wrappClient;

  next();
}
