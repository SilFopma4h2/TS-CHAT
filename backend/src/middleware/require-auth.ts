import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { getJwtConfig } from '../config/jwt.js';
import { ApiError } from './api-error.js';
import type { AuthPayload } from '../types/index.js';

/**
 * Express middleware that verifies a Bearer token in the Authorization
 * header and attaches the authenticated user to `req.user`.
 *
 * On failure the request is rejected with 401 — never with details about
 * what specifically went wrong (no token-expiry vs signature hints).
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    next(new ApiError('Authentication required', 401));
    return;
  }

  const token = header.slice(7);

  try {
    // jwt.verify returns string | JwtPayload; the claimed token was signed as
    // an AuthPayload, so it can be narrowed safely.
    const payload = jwt.verify(token, getJwtConfig().secret) as unknown as AuthPayload;

    req.user = {
      id: payload.sub,
      username: payload.username,
    };

    next();
  } catch {
    next(new ApiError('Authentication required', 401));
  }
}
