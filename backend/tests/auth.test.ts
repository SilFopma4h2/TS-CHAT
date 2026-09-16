import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { Request, RequestHandler, Response } from 'express';
import type { QueryResult, QueryResultRow } from '../src/db/index.js';
import type { ApiError } from '../src/middleware/api-error.js';
import type { AuthenticatedUser } from '../src/types/index.js';

// Fallbacks so the auth modules load even without a .env file.
process.env.JWT_SECRET ??= 'test-secret-not-for-production';
process.env.JWT_EXPIRES_IN ??= '1h';
process.env.BCRYPT_ROUNDS ??= '10';

// Loaded dynamically so the env fallbacks above and the fake db can be
// injected before the controllers are constructed.
const { createAuthHandlers } = await import('../src/controllers/auth.controller.js');
const { createUsersHandlers } = await import('../src/controllers/users.controller.js');
const { requireAuth } = await import('../src/middleware/require-auth.js');

function qr<T extends QueryResultRow>(
  rows: T[],
  rowCount: number = rows.length,
): QueryResult<T> {
  return { rows, rowCount, command: '', oid: 0, fields: [] } as unknown as QueryResult<T>;
}

/** Runs a handler directly and captures whatever is passed to next().
 * Resolves when the handler's own promise settles — successful handlers
 * respond directly and never call next(), so we must not wait for it. */
async function invoke(
  handler: RequestHandler,
  req: Partial<Request>,
  res: Response,
): Promise<unknown[]> {
  const nextErrors: unknown[] = [];
  await new Promise<void>((resolve) => {
    const next = (err?: unknown): void => {
      if (err !== undefined) nextErrors.push(err);
      resolve();
    };
    let ret: unknown;
    try {
      ret = (handler as unknown as (
        req: Request,
        res: Response,
        next: (err?: unknown) => void,
      ) => unknown)(req as Request, res, next);
    } catch (err) {
      nextErrors.push(err);
      resolve();
      return;
    }
    if (ret instanceof Promise) {
      ret.then(
        () => resolve(),
        (err: unknown) => {
          nextErrors.push(err);
          resolve();
        },
      );
    }
  });
  return nextErrors;
}

/** Minimal Express response mock that records status and body. */
function makeRes(): { res: Response; statusCode: () => number; body: () => unknown } {
  const state = { statusCode: 200, jsonBody: undefined as unknown };
  const res = {
    status(code: number) {
      state.statusCode = code;
      return res;
    },
    json(body: unknown) {
      state.jsonBody = body;
      return res;
    },
  };
  return { res: res as unknown as Response, statusCode: () => state.statusCode, body: () => state.jsonBody };
}

const validCredentials = { username: 'twan', password: 'correct-password' };

describe('POST /auth/register', () => {
  it('registers a new user and returns 201 with an auth token', async () => {
    const fakeDb = {
      query: async (text: string) => {
        if (text.startsWith('SELECT id FROM users')) return qr<{ id: number }>([], 0);
        if (text.startsWith('INSERT INTO users')) {
          return qr<{ id: number; username: string; created_at: Date }>([
            { id: 1, username: 'twan', created_at: new Date('2026-01-02T03:04:05Z') },
          ]);
        }
        throw new Error(`unexpected query: ${text}`);
      },
    } as unknown as Parameters<typeof createAuthHandlers>[0];

    const { register } = createAuthHandlers(fakeDb);
    const { res, statusCode, body } = makeRes();

    const errors = await invoke(register, { body: validCredentials }, res);

    assert.deepEqual(errors, []);
    assert.equal(statusCode(), 201);
    const payload = body() as { id: number; username: string; createdAt: Date; token: string };
    assert.equal(payload.username, 'twan');
    assert.equal(payload.id, 1);
    assert.equal(typeof payload.token, 'string');
    const decoded = jwt.verify(payload.token, process.env.JWT_SECRET!);
    assert.deepEqual(decoded, { sub: 1, username: 'twan', iat: (decoded as { iat: number }).iat, exp: (decoded as { exp: number }).exp });
  });

  it('rejects a duplicate username with 409', async () => {
    const fakeDb = {
      query: async (text: string) => {
        if (text.startsWith('SELECT id FROM users')) return qr([{ id: 1 }], 1);
        throw new Error(`unexpected query: ${text}`);
      },
    } as unknown as Parameters<typeof createAuthHandlers>[0];

    const { register } = createAuthHandlers(fakeDb);
    const { res } = makeRes();

    const errors = await invoke(register, { body: validCredentials }, res);

    assert.equal(errors.length, 1);
    const err = errors[0] as ApiError;
    assert.equal(err.statusCode, 409);
    assert.equal(err.message, 'Username is already taken');
  });

  it('rejects a weak password with 400', async () => {
    const { register } = createAuthHandlers();
    const { res } = makeRes();

    const errors = await invoke(register, { body: { username: 'twan', password: 'short' } }, res);

    assert.equal(errors.length, 1);
    const err = errors[0] as ApiError;
    assert.equal(err.statusCode, 400);
    assert.match(err.message, /at least 8 characters/);
  });

  it('rejects a missing password with 400', async () => {
    const { register } = createAuthHandlers();
    const { res } = makeRes();

    const errors = await invoke(register, { body: { username: 'twan' } }, res);

    assert.equal(errors.length, 1);
    assert.equal((errors[0] as ApiError).statusCode, 400);
  });
});

describe('POST /auth/login', () => {
  const goodHashPromise = bcrypt.hash('correct-password', 4);

  it('returns an auth token for valid credentials', async () => {
    const goodHash = await goodHashPromise;
    const fakeDb = {
      query: async (text: string) => {
        if (text.startsWith('SELECT id, username, password_hash FROM users')) {
          return qr([{ id: 7, username: 'twan', password_hash: goodHash }]);
        }
        throw new Error(`unexpected query: ${text}`);
      },
    } as unknown as Parameters<typeof createAuthHandlers>[0];

    const { login } = createAuthHandlers(fakeDb);
    const { res, body } = makeRes();

    const errors = await invoke(login, { body: validCredentials }, res);

    assert.deepEqual(errors, []);
    const payload = body() as { token: string };
    assert.equal(typeof payload.token, 'string');
    assert.ok(payload.token.length > 20);
  });

  it('rejects a wrong password with a generic 401', async () => {
    const goodHash = await goodHashPromise;
    const fakeDb = {
      query: async (text: string) => {
        if (text.startsWith('SELECT id, username, password_hash FROM users')) {
          return qr([{ id: 7, username: 'twan', password_hash: goodHash }]);
        }
        throw new Error(`unexpected query: ${text}`);
      },
    } as unknown as Parameters<typeof createAuthHandlers>[0];

    const { login } = createAuthHandlers(fakeDb);
    const { res } = makeRes();

    const errors = await invoke(
      login,
      { body: { username: 'twan', password: 'wrong-password' } },
      res,
    );

    assert.equal(errors.length, 1);
    const err = errors[0] as ApiError;
    assert.equal(err.statusCode, 401);
    assert.equal(err.message, 'Invalid credentials');
  });
});

describe('requireAuth (protects /users/me)', () => {
  it('rejects a request without a Bearer token with 401', async () => {
    const { res } = makeRes();
    const errors = await invoke(requireAuth as RequestHandler, { headers: {} }, res);
    assert.equal((errors[0] as ApiError).statusCode, 401);
  });

  it('attaches the authenticated user for a valid token', async () => {
    const token = jwt.sign({ sub: 42, username: 'alice' }, process.env.JWT_SECRET!);

    const req: Partial<Request> = { headers: { authorization: `Bearer ${token}` } };
    const { res } = makeRes();
    const errors = await invoke(requireAuth as RequestHandler, req, res);

    assert.deepEqual(errors, []);
    const user = req.user as AuthenticatedUser;
    assert.equal(user.id, 42);
    assert.equal(user.username, 'alice');
  });
});

describe('GET /users/me', () => {
  it('returns the profile for an authenticated user (valid auth end-to-end)', async () => {
    const fakeDb = {
      query: async (text: string) => {
        if (text.startsWith('SELECT id, username, created_at FROM users')) {
          return qr([{ id: 42, username: 'alice', created_at: new Date('2026-01-01T00:00:00Z') }]);
        }
        throw new Error(`unexpected query: ${text}`);
      },
    } as unknown as Parameters<typeof createUsersHandlers>[0];

    const { getMe } = createUsersHandlers(fakeDb);
    const { res, body } = makeRes();

    const token = jwt.sign({ sub: 42, username: 'alice' }, process.env.JWT_SECRET!);
    const req: Partial<Request> = { headers: { authorization: `Bearer ${token}` } };
    const authErrors = await invoke(requireAuth as RequestHandler, req, res);
    assert.deepEqual(authErrors, []);

    const errors = await invoke(getMe, req, res);
    assert.deepEqual(errors, []);
    const user = body() as { id: number; username: string; createdAt: Date };
    assert.equal(user.id, 42);
    assert.equal(user.username, 'alice');
  });
});