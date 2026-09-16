import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Pool } from 'pg';

// Resolves to src/db/migrations in dev (tsx) and dist/db/migrations in the
// production build (postbuild copies the .sql files there).
const migrationsDir = fileURLToPath(new URL('./migrations', import.meta.url));

interface AppliedMigration {
  name: string;
  applied_at: string;
}

/**
 * Applies all pending .sql files from src/db/migrations (sorted, newest
 * last). Applied files are tracked in schema_migrations so each runs
 * exactly once. Each migration runs inside its own transaction.
 *
 * Returns the names of migrations that were applied.
 */
export async function applyMigrations(pool: Pool): Promise<string[]> {
  const client = await pool.connect();
  const applied: string[] = [];

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name       TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    const files = (await readdir(migrationsDir)).filter((f) => f.endsWith('.sql')).sort();

    for (const file of files) {
      const existing = await client.query<AppliedMigration>(
        'SELECT name FROM schema_migrations WHERE name = $1',
        [file],
      );
      if ((existing.rowCount ?? 0) > 0) continue;

      const sql = await readFile(path.join(migrationsDir, file), 'utf8');

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      }

      applied.push(file);
    }
  } finally {
    client.release();
  }

  return applied;
}