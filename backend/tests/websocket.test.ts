import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { WebSocket } from 'ws';
import { once } from 'node:events';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { attachWebSocketServer, getWebSocketManager, resetWebSocketManager, type ServerMessage } from '../src/websocket/index.js';
import { createApp } from '../src/app.js';
import { db } from '../src/db/index.js';

process.env.JWT_SECRET ??= 'test-secret-not-for-production';
process.env.JWT_EXPIRES_IN ??= '1h';
process.env.BCRYPT_ROUNDS ??= '10';

const testPort = 4999;

describe('WebSocket realtime messaging', () => {
  let server: ReturnType<typeof createServer>;
  let baseUrl: string;
  let wsUrl: string;

  before(async () => {
    resetWebSocketManager();
    const app = createApp();
    server = createServer(app);
    attachWebSocketServer(server);

    await new Promise<void>((resolve) => {
      server.listen(testPort, () => resolve());
    });

    const { port } = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${port}`;
    wsUrl = `ws://127.0.0.1:${port}/ws`;
  });

  after(async () => {
    const mgr = getWebSocketManager();
    if (mgr) {
      // Close all connections
      for (const conn of mgr['connections']?.keys() ?? []) {
        conn.close();
      }
    }
    await new Promise<void>((resolve) => server.close(() => resolve()));
    resetWebSocketManager();
  });

  /** Helper to connect WebSocket and wait for open. */
  function connectWs(): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(wsUrl);
      const timeout = setTimeout(() => reject(new Error('Connection timeout')), 5000);
      ws.on('open', () => {
        clearTimeout(timeout);
        resolve(ws);
      });
      ws.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  }

  /** Helper to send a message and wait for a response of a specific type. */
  function sendAndWait<T>(
    ws: WebSocket,
    message: { type: string; payload: unknown },
    expectedType: string,
    timeoutMs = 3000,
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error(`Timeout waiting for ${expectedType}`)), timeoutMs);
      const handler = (data: Buffer) => {
        const msg = JSON.parse(data.toString()) as ServerMessage;
        if (msg.type === expectedType || msg.type === 'error') {
          clearTimeout(timeout);
          ws.off('message', handler);
          resolve(msg as T);
        }
      };
      ws.on('message', handler);
      ws.send(JSON.stringify(message));
    });
  }

  /** Create a test user and return { token, userId }. */
  async function createTestUser(username: string): Promise<{ token: string; userId: number }> {
    const password = 'password123';
    const hash = await bcrypt.hash(password, 4);

    // Create user in DB.
    const { rows } = await db.query<{ id: number }>(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id',
      [username, hash],
    );
    const userId = rows[0]!.id;

    const token = jwt.sign({ sub: userId, username }, process.env.JWT_SECRET!);
    return { token, userId };
  }

  /** Create a chat between two users and return chatId. */
  async function createChat(userId1: number, userId2: number): Promise<number> {
    const { rows } = await db.query<{ id: number }>(
      'INSERT INTO chats DEFAULT VALUES RETURNING id',
    );
    const chatId = rows[0]!.id;
    await db.query(
      'INSERT INTO chat_members (chat_id, user_id) VALUES ($1, $2), ($1, $3)',
      [chatId, userId1, userId2],
    );
    return chatId;
  }

  it('rejects connection without authentication', async () => {
    const ws = await connectWs();
    const msg = await sendAndWait<ServerMessage>(ws, { type: 'message.send', payload: { chatId: 1, content: 'hi' } }, 'error');
    assert.equal(msg.type, 'error');
    assert.equal((msg.payload as { code: string }).code, 'UNAUTHORIZED');
    ws.close();
  });

  it('authenticates with valid token', async () => {
    const { token } = await createTestUser('ws_user_1');
    const ws = await connectWs();

    const authMsg = await sendAndWait<ServerMessage>(ws, { type: 'auth', payload: { token } }, 'auth.ok');
    assert.equal(authMsg.type, 'auth.ok');
    assert.equal((authMsg.payload as { userId: number }).userId, (jwt.decode(token) as unknown as { sub: number }).sub);

    ws.close();
  });

  it('rejects invalid token', async () => {
    const ws = await connectWs();
    const msg = await sendAndWait<ServerMessage>(ws, { type: 'auth', payload: { token: 'invalid.token.here' } }, 'error');
    assert.equal(msg.type, 'error');
    assert.equal((msg.payload as { code: string }).code, 'UNAUTHORIZED');
    ws.close();
  });

  it('sends and receives message.created for chat member', async () => {
    const user1 = await createTestUser('ws_user_2');
    const user2 = await createTestUser('ws_user_3');
    const chatId = await createChat(user1.userId, user2.userId);

    const ws1 = await connectWs();
    const ws2 = await connectWs();

    // Both authenticate.
    await sendAndWait(ws1, { type: 'auth', payload: { token: user1.token } }, 'auth.ok');
    await sendAndWait(ws2, { type: 'auth', payload: { token: user2.token } }, 'auth.ok');

    // User1 sends a message.
    const createdPromise = sendAndWait<ServerMessage>(ws2, { type: 'message.send', payload: { chatId, content: 'Hello from user1!' } }, 'message.created');
    await sendAndWait(ws1, { type: 'message.send', payload: { chatId, content: 'Hello from user1!' } }, 'message.created');

    const received = await createdPromise;
    assert.equal(received.type, 'message.created');
    const payload = received.payload as { content: string; senderId: number; chatId: number };
    assert.equal(payload.content, 'Hello from user1!');
    assert.equal(payload.senderId, user1.userId);
    assert.equal(payload.chatId, chatId);

    ws1.close();
    ws2.close();
  });

  it('rejects message.send without auth', async () => {
    const ws = await connectWs();
    const msg = await sendAndWait<ServerMessage>(ws, { type: 'message.send', payload: { chatId: 1, content: 'hi' } }, 'error');
    assert.equal(msg.type, 'error');
    assert.equal((msg.payload as { code: string }).code, 'UNAUTHORIZED');
    ws.close();
  });

  it('rejects message.send with invalid payload', async () => {
    const { token } = await createTestUser('ws_user_4');
    const ws = await connectWs();
    await sendAndWait(ws, { type: 'auth', payload: { token } }, 'auth.ok');

    // Missing chatId
    const msg1 = await sendAndWait<ServerMessage>(ws, { type: 'message.send', payload: { content: 'hi' } }, 'error');
    assert.equal((msg1.payload as { code: string }).code, 'INVALID_PAYLOAD');

    // Invalid chatId
    const msg2 = await sendAndWait<ServerMessage>(ws, { type: 'message.send', payload: { chatId: -1, content: 'hi' } }, 'error');
    assert.equal((msg2.payload as { code: string }).code, 'INVALID_PAYLOAD');

    // Empty content
    const msg3 = await sendAndWait<ServerMessage>(ws, { type: 'message.send', payload: { chatId: 1, content: '' } }, 'error');
    assert.equal((msg3.payload as { code: string }).code, 'INVALID_PAYLOAD');

    ws.close();
  });

  it('rejects message.send for chat user is not member of', async () => {
    const user1 = await createTestUser('ws_user_5');
    const user2 = await createTestUser('ws_user_6');
    const chatId = await createChat(user1.userId, user2.userId);

    const outsider = await createTestUser('ws_outsider');
    const ws = await connectWs();
    await sendAndWait(ws, { type: 'auth', payload: { token: outsider.token } }, 'auth.ok');

    const msg = await sendAndWait<ServerMessage>(ws, { type: 'message.send', payload: { chatId, content: 'I should not be here' } }, 'error');
    assert.equal(msg.type, 'error');
    assert.equal((msg.payload as { code: string }).code, 'FORBIDDEN');

    ws.close();
  });

  it('persists message in database', async () => {
    const user1 = await createTestUser('ws_user_7');
    const user2 = await createTestUser('ws_user_8');
    const chatId = await createChat(user1.userId, user2.userId);

    const ws1 = await connectWs();
    const ws2 = await connectWs();

    await sendAndWait(ws1, { type: 'auth', payload: { token: user1.token } }, 'auth.ok');
    await sendAndWait(ws2, { type: 'auth', payload: { token: user2.token } }, 'auth.ok');

    await sendAndWait(ws1, { type: 'message.send', payload: { chatId, content: 'Persisted message' } }, 'message.created');
    await sendAndWait(ws2, { type: 'message.send', payload: { chatId, content: 'Persisted message' } }, 'message.created');

    // Verify message exists in database.
    const { rows } = await db.query<{ content: string; sender_id: number }>(
      'SELECT content, sender_id FROM messages WHERE chat_id = $1 ORDER BY created_at DESC LIMIT 1',
      [chatId],
    );
    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.content, 'Persisted message');
    assert.equal(rows[0]?.sender_id, user1.userId);

    ws1.close();
    ws2.close();
  });

  it('broadcasts message to all connections of a user', async () => {
    const user1 = await createTestUser('ws_user_9');
    const user2 = await createTestUser('ws_user_10');
    const chatId = await createChat(user1.userId, user2.userId);

    // User1 has two connections
    const ws1a = await connectWs();
    const ws1b = await connectWs();
    await sendAndWait(ws1a, { type: 'auth', payload: { token: user1.token } }, 'auth.ok');
    await sendAndWait(ws1b, { type: 'auth', payload: { token: user1.token } }, 'auth.ok');

    // User2 has one connection
    const ws2 = await connectWs();
    await sendAndWait(ws2, { type: 'auth', payload: { token: user2.token } }, 'auth.ok');

    // User2 sends a message - both of user1's connections should receive it
    const p1 = sendAndWait<ServerMessage>(ws1a, { type: 'message.send', payload: { chatId, content: 'broadcast test' } }, 'message.created');
    const p2 = sendAndWait<ServerMessage>(ws1b, { type: 'message.send', payload: { chatId, content: 'broadcast test' } }, 'message.created');
    await sendAndWait(ws2, { type: 'message.send', payload: { chatId, content: 'broadcast test' } }, 'message.created');

    const [msg1, msg2] = await Promise.all([p1, p2]);
    assert.equal(msg1.type, 'message.created');
    assert.equal(msg2.type, 'message.created');

    ws1a.close();
    ws1b.close();
    ws2.close();
  });

  it('handles unknown message type gracefully', async () => {
    const { token } = await createTestUser('ws_user_11');
    const ws = await connectWs();
    await sendAndWait(ws, { type: 'auth', payload: { token } }, 'auth.ok');

    const msg = await sendAndWait<ServerMessage>(ws, { type: 'unknown.type', payload: {} }, 'error');
    assert.equal(msg.type, 'error');
    assert.equal((msg.payload as { code: string }).code, 'UNKNOWN_TYPE');

    ws.close();
  });
});