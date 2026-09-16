import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { PoolClient } from 'pg';
import config from '../src/config/index.js';

// The db module throws at import when DATABASE_URL is unset, so load it
// dynamically and probe the connection. When no database is reachable the
// whole suite is skipped instead of failing.
let db: typeof import('../src/db/index.js')['db'] | undefined;
let available = false;

if (config.databaseUrl) {
  try {
    ({ db } = await import('../src/db/index.js'));
    await db.query('SELECT 1');
    await db.applyMigrations();
    available = true;
  } catch (err) {
    console.log(`DB tests skipped (database unreachable): ${(err as Error).message}`);
    available = false;
  }
}

/** Runs a test body inside a rolled-back transaction (no data left behind). */
async function withTx<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await db!.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('ROLLBACK');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

describe('database (PostgreSQL)', { skip: !available }, () => {
  it('has a reachable connection', async () => {
    const { rows } = await db!.query<{ one: number }>('SELECT 1 AS one');
    assert.strictEqual(rows[0]?.one, 1);
  });

  it('created all four tables via migration', async () => {
    const { rows } = await db!.query<{ table_name: string }>(
      `SELECT table_name
         FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name IN ('users', 'chats', 'chat_members', 'messages')`,
    );
    const names = rows.map((r) => r.table_name).sort();
    assert.deepEqual(names, ['chat_members', 'chats', 'messages', 'users']);
  });

  it('users: inserts a user with generated id and created_at', async () => {
    await withTx(async (client) => {
      const { rows } = await client.query<{ id: string; username: string; created_at: Date }>(
        `INSERT INTO users (username, password_hash)
         VALUES ($1, $2)
         RETURNING id, username, created_at`,
        ['alice', 'hashed-secret'],
      );
      assert.strictEqual(rows[0]?.username, 'alice');
      assert.match(rows[0]?.id ?? '', /^\d+$/);
      assert.ok(rows[0]?.created_at instanceof Date);
    });
  });

  it('users: rejects duplicate usernames (UNIQUE)', async () => {
    await withTx(async (client) => {
      await client.query(
        'INSERT INTO users (username, password_hash) VALUES ($1, $2)',
        ['dup-user', 'hash'],
      );
      await assert.rejects(
        client.query(
          'INSERT INTO users (username, password_hash) VALUES ($1, $2)',
          ['dup-user', 'hash2'],
        ),
        (err: unknown) => (err as { code?: string }).code === '23505' /* unique_violation */,
      );
    });
  });

  it('chats: inserts a chat with generated id and created_at', async () => {
    await withTx(async (client) => {
      const { rows } = await client.query<{ id: string; created_at: Date }>(
        'INSERT INTO chats DEFAULT VALUES RETURNING id, created_at',
      );
      assert.match(rows[0]?.id ?? '', /^\d+$/);
      assert.ok(rows[0]?.created_at instanceof Date);
    });
  });

  it('chat_members: allows one member row per (chat_id, user_id)', async () => {
    await withTx(async (client) => {
      const user = await client.query<{ id: string }>(
        'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id',
        ['bob', 'hash'],
      );
      const chat = await client.query<{ id: string }>(
        'INSERT INTO chats DEFAULT VALUES RETURNING id',
      );
      const member = await client.query(
        'INSERT INTO chat_members (chat_id, user_id) VALUES ($1, $2)',
        [chat.rows[0]!.id, user.rows[0]!.id],
      );
      assert.strictEqual(member.rowCount, 1);
    });
  });

  it('chat_members: rejects a duplicate member (PK) and unknown FKs', async () => {
    await withTx(async (client) => {
      const user = await client.query<{ id: string }>(
        'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id',
        ['carol', 'hash'],
      );
      const chat = await client.query<{ id: string }>(
        'INSERT INTO chats DEFAULT VALUES RETURNING id',
      );

      await client.query('INSERT INTO chat_members (chat_id, user_id) VALUES ($1, $2)', [
        chat.rows[0]!.id,
        user.rows[0]!.id,
      ]);
      await assert.rejects(
        client.query('INSERT INTO chat_members (chat_id, user_id) VALUES ($1, $2)', [
          chat.rows[0]!.id,
          user.rows[0]!.id,
        ]),
        (err: unknown) => (err as { code?: string }).code === '23505' /* duplicate member */,
      );
      await assert.rejects(
        client.query('INSERT INTO chat_members (chat_id, user_id) VALUES ($1, $2)', [
          chat.rows[0]!.id,
          '999999999',
        ]),
        (err: unknown) => (err as { code?: string }).code === '23503' /* foreign_key_violation */,
      );
    });
  });

  it('messages: inserts a message and rejects empty content', async () => {
    await withTx(async (client) => {
      const user = await client.query<{ id: string }>(
        'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id',
        ['dave', 'hash'],
      );
      const chat = await client.query<{ id: string }>(
        'INSERT INTO chats DEFAULT VALUES RETURNING id',
      );

      const { rows } = await client.query<{ id: string; content: string; created_at: Date }>(
        `INSERT INTO messages (chat_id, sender_id, content)
         VALUES ($1, $2, $3)
         RETURNING id, content, created_at`,
        [chat.rows[0]!.id, user.rows[0]!.id, 'Hello DuoChat!'],
      );
      assert.strictEqual(rows[0]?.content, 'Hello DuoChat!');
      assert.ok(rows[0]?.created_at instanceof Date);

      await assert.rejects(
        client.query(
          'INSERT INTO messages (chat_id, sender_id, content) VALUES ($1, $2, $3)',
          [chat.rows[0]!.id, user.rows[0]!.id, '   '],
        ),
        (err: unknown) => (err as { code?: string }).code === '23514' /* check_violation */,
      );
    });
  });
});