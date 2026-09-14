import { Pool } from 'pg';
import config from '../config/index.js';

if (!config.databaseUrl) {
  throw new Error(
    'DATABASE_URL is not set. Copy backend/.env.example to backend/.env and set DATABASE_URL to your local PostgreSQL.',
  );
}

// Single shared connection pool. Controllers/services go through the db
// façade (src/db/index.ts) and never create connections themselves.
export const pool = new Pool({ connectionString: config.databaseUrl });