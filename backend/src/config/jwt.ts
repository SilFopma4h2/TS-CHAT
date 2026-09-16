import config from './index.js';

/** JWT configuration, resolved lazily from environment variables. */
export function getJwtConfig(): { secret: string; expiresIn: string } {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error(
      'JWT_SECRET is not set. Add JWT_SECRET to backend/.env (see .env.example).',
    );
  }

  return {
    secret,
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  };
}