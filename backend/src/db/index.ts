import type { PoolClient, QueryResult, QueryResultRow } from 'pg';
import { pool } from './pool.js';
import { applyMigrations } from './migrations.js';

export { pool } from './pool.js';
export { applyMigrations } from './migrations.js';
export type { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

/**
 * Single database façade used by controllers/services. Nothing in the app
 * creates its own connections — always go through `db`.
 *
 * - db.query(text, params) executes a parameterized query on the pool.
 * - db.connect() hands out a pooled client (for transactions in tests).
 * - db.applyMigrations() runs pending migrations.
 * - db.close() ends the pool, called during graceful shutdown.
 */
export const db = {
  pool,
  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params: unknown[] = [],
  ): Promise<QueryResult<T>> {
    return pool.query<T>(text, params);
  },
  connect(): Promise<PoolClient> {
    return pool.connect();
  },
  applyMigrations(): Promise<string[]> {
    return applyMigrations(pool);
  },
  close(): Promise<void> {
    return pool.end();
  },
};

export default db;