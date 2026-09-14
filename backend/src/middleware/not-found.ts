import type { NextFunction, Request, Response } from 'express';
import { ApiError } from './api-error.js';

/** 404 for routes the REST API does not expose. */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new ApiError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}