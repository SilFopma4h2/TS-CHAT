import { db } from './index.js';

/**
 * Migration CLI entrypoint. Run with:
 *   npm run db:migrate
 */
try {
  const applied = await db.applyMigrations();
  if (applied.length === 0) {
    console.log('Database is up to date — no migrations to apply.');
  } else {
    console.log(`Applied migrations: ${applied.join(', ')}`);
  }
} catch (err) {
  console.error('Migration failed:', err);
  process.exitCode = 1;
} finally {
  await db.close();
}