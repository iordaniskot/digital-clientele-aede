import { Request, Response, NextFunction } from 'express';
import { ValidationError } from './validation';
import { AadeApiError } from '../services/aadeClient';
import { WrappApiError } from '../services/wrappClient';

/**
 * Global error handler middleware
 */
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  // Validation errors (our middleware)
  if (err instanceof ValidationError) {
    res.status(err.statusCode).json({
      error: 'Validation Error',
      details: err.details,
    });
    return;
  }

  // AADE API errors
  if (err instanceof AadeApiError) {
    res.status(err.statusCode >= 400 && err.statusCode < 600 ? err.statusCode : 502).json({
      error: 'AADE API Error',
      message: err.message,
      aadeResponse: err.responseBody,
    });
    return;
  }

  // Wrapp API errors
  if (err instanceof WrappApiError) {
    res.status(err.statusCode >= 400 && err.statusCode < 600 ? err.statusCode : 502).json({
      error: 'Wrapp API Error',
      message: err.message,
      wrappResponse: err.responseBody,
    });
    return;
  }

  // Unexpected errors
  console.error('Unexpected error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message,
  });
}
