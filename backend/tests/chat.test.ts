import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { Request, RequestHandler, Response } from 'express';
import type { QueryResult, QueryResultRow } from '../src/db/index.js';
import type { ApiError } from '../src/middleware/api-error.js';
import type { AuthenticatedUser } from '../src/types/index.js';

process.env.JWT_SECRET ??= 'test-secret-not-for-production';
process.env.JWT_EXPIRES_IN ??= '1h';
process.env.BCRYPT_ROUNDS ??= '10';

const { createChatHandlers } = await import('../src/controllers/chat.controller.js');
const { createAuthHandlers } = await import('../src/controllers/auth.controller.js');
const { requireAuth } = await import('../src/middleware/require-auth.js');

function qr<T extends QueryResultRow>(
  rows: T[],
  rowCount: number = rows.length,
): QueryResult<T> {
  return { rows, rowCount, command: '', oid: 0, fields: [] } as unknown as QueryResult<T>;
}

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

function signToken(payload: { sub: number; username: string }): string {
  return jwt.sign(payload, process.env.JWT_SECRET!);
}

function makeAuthReq(token: string): Partial<Request> {
  return { headers: { authorization: `Bearer ${token}` } };
}

describe('POST /chats (one-to-one)', () => {
  it('creates a chat between two users', async () => {
    let chatId = 1;
    let userIdCounter = 1;
    const users = new Map<number, { id: number; passwordHash: string }>();

    const fakeDb = {
      query: async (text: string, params: unknown[]) => {
        if (text.startsWith('SELECT id FROM users WHERE id =')) {
          const id = params[0] as number;
          return qr(users.has(id) ? [{ id }] : [], users.has(id) ? 1 : 0);
        }
        if (text.startsWith('SELECT c.id FROM chats c JOIN chat_members')) {
          return qr<{ id: number }>([], 0);
        }
        if (text.startsWith('INSERT INTO chats')) {
          return qr([{ id: chatId++, created_at: new Date() }]);
        }
        if (text.startsWith('INSERT INTO chat_members')) {
          return qr([], 2);
        }
        if (text.startsWith('SELECT u.id, u.username FROM chat_members')) {
          return qr([
            { chat_id: 1, id: 1, username: 'alice' },
            { chat_id: 1, id: 2, username: 'bob' },
          ]);
        }
        throw new Error(`unexpected query: ${text}`);
      },
      connect: async () => ({
        query: async (text: string, params: unknown[]) => {
          if (text === 'BEGIN') return qr([]);
          if (text === 'COMMIT') return qr([]);
          if (text === 'ROLLBACK') return qr([]);
          return fakeDb.query(text, params);
        },
        release: () => {},
      }),
    } as unknown as Parameters<typeof createChatHandlers>[0];

    const { createChat } = createChatHandlers(fakeDb);
    const { register } = createAuthHandlers();

    // Register two users.
    await register({ body: { username: 'alice', password: 'secret123' } } as never, { status() {}, json() {} } as never, () => {});
    await register({ body: { username: 'bob', password: 'secret123' } } as never, { status() {}, json() {} } as never, () => {});

    const token = signToken({ sub: 1, username: 'alice' });
    const { res, statusCode, body } = makeRes();

    const errors = await invoke(createChat, { ...makeAuthReq(token), body: { userId: 2 } }, res);

    assert.deepEqual(errors, []);
    assert.equal(statusCode(), 201);
    const chat = body() as { id: number; members: { id: number; username: string }[] };
    assert.equal(chat.id, 1);
    assert.equal(chat.members.length, 2);
  });

  it('rejects creating a chat with yourself (400)', async () => {
    const { createChat } = createChatHandlers();
    const token = signToken({ sub: 5, username: 'me' });
    const { res } = makeRes();

    const errors = await invoke(createChat, { ...makeAuthReq(token), body: { userId: 5 } }, res);

    assert.equal(errors.length, 1);
    const err = errors[0] as ApiError;
    assert.equal(err.statusCode, 400);
    assert.match(err.message, /yourself/);
  });

  it('rejects non-existent user (404)', async () => {
    const fakeDb = {
      query: async (text: string, params: unknown[]) => {
        if (text.startsWith('SELECT id FROM users WHERE id =')) {
          return qr<{ id: number }>([], 0);
        }
        throw new Error(`unexpected query: ${text}`);
      },
      connect: async () => ({
        query: async (text: string) => {
          if (text === 'BEGIN') return qr([]);
          if (text === 'COMMIT') return qr([]);
          if (text === 'ROLLBACK') return qr([]);
          return fakeDb.query(text, []);
        },
        release: () => {},
      }),
    } as unknown as Parameters<typeof createChatHandlers>[0];

    const { createChat } = createChatHandlers(fakeDb);
    const token = signToken({ sub: 1, username: 'alice' });
    const { res } = makeRes();

    const errors = await invoke(createChat, { ...makeAuthReq(token), body: { userId: 999 } }, res);

    assert.equal(errors.length, 1);
    const err = errors[0] as ApiError;
    assert.equal(err.statusCode, 404);
    assert.match(err.message, /not found/);
  });

  it('rejects duplicate chat (409)', async () => {
    const fakeDb = {
      query: async (text: string) => {
        if (text.startsWith('SELECT c.id FROM chats c JOIN chat_members')) {
          return qr<{ id: number }>([{ id: 1 }], 1);
        }
        throw new Error(`unexpected query: ${text}`);
      },
      connect: async () => ({
        query: async (text: string) => {
          if (text === 'BEGIN') return qr([]);
          if (text === 'COMMIT') return qr([]);
          if (text === 'ROLLBACK') return qr([]);
          return fakeDb.query(text, []);
        },
        release: () => {},
      }),
    } as unknown as Parameters<typeof createChatHandlers>[0];

    const { createChat } = createChatHandlers(fakeDb);
    const token = signToken({ sub: 1, username: 'alice' });
    const { res } = makeRes();

    const errors = await invoke(createChat, { ...makeAuthReq(token), body: { userId: 2 } }, res);

    assert.equal(errors.length, 1);
    const err = errors[0] as ApiError;
    assert.equal(err.statusCode, 409);
    assert.match(err.message, /already exists/);
  });

  it('rejects invalid userId (400)', async () => {
    const { createChat } = createChatHandlers();
    const token = signToken({ sub: 1, username: 'alice' });
    const { res } = makeRes();

    const errors = await invoke(createChat, { ...makeAuthReq(token), body: { userId: -1 } }, res);

    assert.equal(errors.length, 1);
    const err = errors[0] as ApiError;
    assert.equal(err.statusCode, 400);
    assert.match(err.message, /positive integer/);
  });
});

describe('GET /chats (list)', () => {
  it('returns chats for the authenticated user with members', async () => {
    const fakeDb = {
      query: async (text: string, params: unknown[]) => {
        if (text.startsWith('SELECT c.id, c.created_at FROM chats c JOIN chat_members')) {
          return qr([
            { id: 1, created_at: new Date('2026-01-01T00:00:00Z') },
            { id: 2, created_at: new Date('2026-01-02T00:00:00Z') },
          ]);
        }
        if (text.startsWith('SELECT cm.chat_id, u.id, u.username FROM chat_members')) {
          return qr([
            { chat_id: 1, id: 1, username: 'alice' },
            { chat_id: 1, id: 2, username: 'bob' },
            { chat_id: 2, id: 1, username: 'alice' },
            { chat_id: 2, id: 3, username: 'carol' },
          ]);
        }
        throw new Error(`unexpected query: ${text}`);
      },
      connect: async () => ({ query: async () => qr([]), release: () => {} }),
    } as unknown as Parameters<typeof createChatHandlers>[0];

    const { getChats } = createChatHandlers(fakeDb);
    const token = signToken({ sub: 1, username: 'alice' });
    const { res, body } = makeRes();

    const errors = await invoke(getChats, makeAuthReq(token), res);

    assert.deepEqual(errors, []);
    const chats = body() as { id: number; members: { id: number; username: string }[] }[];
    assert.equal(chats.length, 2);
    assert.equal(chats[0].members.length, 2);
    assert.equal(chats[1].members.length, 2);
  });

  async function withAuth(
  token: string,
  handler: RequestHandler,
  req: Partial<Request>,
  res: Response,
): Promise<unknown[]> {
  const { res: authRes } = makeRes();
  await invoke(requireAuth as RequestHandler, makeAuthReq(token), authRes);
  return invoke(handler, { ...req, ...makeAuthReq(token), user: authRes.locals?.user }, res);
}

  it('returns empty array when user has no chats', async () => {
    const fakeDb = {
      query: async (text: string) => {
        if (text.startsWith('SELECT c.id, c.created_at FROM chats c JOIN chat_members')) {
          return qr([]);
        }
        throw new Error(`unexpected query: ${text}`);
      },
      connect: async () => ({ query: async () => qr([]), release: () => {} }),
    } as unknown as Parameters<typeof createChatHandlers>[0];

    const { getChats } = createChatHandlers(fakeDb);
    const token = signToken({ sub: 99, username: 'lonely' });
    const { res, body } = makeRes();

    const errors = await withAuth(token, getChats, {}, res);

    assert.deepEqual(errors, []);
    const chats = body() as unknown[];
    assert.deepEqual(chats, []);
  });

  it('only returns chats where the user is a member (authorization)', async () => {
    const fakeDb = {
      query: async (text: string, params: unknown[]) => {
        if (text.startsWith('SELECT c.id, c.created_at FROM chats c JOIN chat_members')) {
          // User 1 has chat 1; user 2 has chat 2; they shouldn't see each other's.
          const userId = params[0];
          if (userId === 1) {
            return qr([{ id: 1, created_at: new Date() }]);
          }
          return qr([{ id: 2, created_at: new Date() }]);
        }
        if (text.startsWith('SELECT cm.chat_id, u.id, u.username FROM chat_members')) {
          const chatIds = params[0] as number[];
          if (chatIds.includes(1)) {
            return qr([{ chat_id: 1, id: 1, username: 'alice' }, { chat_id: 1, id: 2, username: 'bob' }]);
          }
          if (chatIds.includes(2)) {
            return qr([{ chat_id: 2, id: 2, username: 'bob' }, { chat_id: 2, id: 3, username: 'carol' }]);
          }
          return qr([]);
        }
        throw new Error(`unexpected query: ${text}`);
      },
      connect: async () => ({ query: async () => qr([]), release: () => {} }),
    } as unknown as Parameters<typeof createChatHandlers>[0];

    const { getChats } = createChatHandlers(fakeDb);

    // Alice (user 1) should only see chat 1.
    const aliceToken = signToken({ sub: 1, username: 'alice' });
    const { res: res1, body: body1 } = makeRes();
    await withAuth(aliceToken, getChats, {}, res1);
    const aliceChats = body1() as { id: number }[];
    assert.deepEqual(aliceChats.map((c) => c.id), [1]);

    // Bob (user 2) should only see chat 2.
    const bobToken = signToken({ sub: 2, username: 'bob' });
    const { res: res2, body: body2 } = makeRes();
    await withAuth(bobToken, getChats, {}, res2);
    const bobChats = body2() as { id: number }[];
    assert.deepEqual(bobChats.map((c) => c.id), [2]);
  });

  it('rejects unauthenticated requests (401)', async () => {
    const { getChats } = createChatHandlers();
    const { res } = makeRes();

    const errors = await invoke(getChats, { headers: {} }, res);

    assert.equal(errors.length, 1);
    const err = errors[0] as ApiError;
    assert.equal(err.statusCode, 401);
  });
});