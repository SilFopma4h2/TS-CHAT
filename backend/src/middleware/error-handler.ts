import type { NextFunction, Request, Response } from 'express';
import { ApiError } from './api-error.js';

/**
 * Central error handler. Express 5 automatically forwards rejected promises
 * from async route handlers here. Must stay registered LAST.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
}