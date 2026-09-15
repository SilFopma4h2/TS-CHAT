import type { RequestHandler } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getJwtConfig } from '../config/jwt.js';
import { ApiError } from '../middleware/api-error.js';
import type { AuthPayload } from '../types/index.js';
import { db, type Queryable } from '../db/index.js';

/** Passwords shorter than this are rejected at the API layer. */
const MIN_PASSWORD_LENGTH = 8;

function validateUsername(username: unknown): string {
  if (typeof username !== 'string') throw new ApiError('Username is required', 400);
  const trimmed = username.trim();
  if (trimmed.length === 0) throw new ApiError('Username must not be empty', 400);
  if (trimmed.length > 32) throw new ApiError('Username is too long (max 32 characters)', 400);
  return trimmed;
}

function validatePassword(password: unknown): string {
  if (typeof password !== 'string') throw new ApiError('Password is required', 400);
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new ApiError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`, 400);
  }
  return password;
}

function hashPassword(password: string): Promise<string> {
  const rounds = Number.parseInt(process.env.BCRYPT_ROUNDS ?? '12', 10);
  return bcrypt.hash(password, rounds);
}

function signToken(payload: AuthPayload): string {
  const { secret, expiresIn } = getJwtConfig();
  return jwt.sign(payload, secret, {
    expiresIn: expiresIn as jwt.SignOptions['expiresIn'],
  });
}

/** Returns the register and login handlers with a switchable database. */
export function createAuthHandlers(database: Queryable = db): {
  register: RequestHandler;
  login: RequestHandler;
} {
  /** POST /auth/register */
  const register: RequestHandler = async (req, res, next) => {
    try {
      const username = validateUsername(req.body?.username);
      const password = validatePassword(req.body?.password);

      const existing = await database.query<{ id: number }>(
        'SELECT id FROM users WHERE username = $1',
        [username],
      );
      if ((existing.rowCount ?? 0) > 0) throw new ApiError('Username is already taken', 409);

      const passwordHash = await hashPassword(password);

      const { rows } = await database.query<{ id: number; username: string; created_at: Date }>(
        `INSERT INTO users (username, password_hash)
         VALUES ($1, $2)
         RETURNING id, username, created_at`,
        [username, passwordHash],
      );
      const user = rows[0];

      res.status(201).json({
        id: user?.id,
        username: user?.username,
        createdAt: user?.created_at,
        token: signToken({ sub: user!.id, username: user!.username }),
      });
    } catch (err) {
      next(err);
    }
  };

  /** POST /auth/login */
  const login: RequestHandler = async (req, res, next) => {
    try {
      const { username, password } = req.body ?? {};

      if (typeof username !== 'string' || typeof password !== 'string') {
        throw new ApiError('Invalid credentials', 401);
      }

      const { rows } = await database.query<{
        id: number;
        username: string;
        password_hash: string;
      }>('SELECT id, username, password_hash FROM users WHERE username = $1', [username.trim()]);

      const user = rows[0];
      if (!user || !(await bcrypt.compare(password, user.password_hash))) {
        throw new ApiError('Invalid credentials', 401);
      }

      res.json({ token: signToken({ sub: user.id, username: user.username }) });
    } catch (err) {
      next(err);
    }
  };

  return { register, login };
}