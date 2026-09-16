import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

// Load backend/.env. Resolved relative to this file so it works both from
// src/config (dev) and dist/config (production build).
dotenv.config({
  path: path.resolve(fileURLToPath(new URL('../../.env', import.meta.url))),
});

export interface Config {
  env: 'development' | 'production' | 'test';
  port: number;
  isProduction: boolean;
  databaseUrl: string;
}

const parsePort = (raw: string | undefined): number => {
  const port = Number.parseInt(raw ?? '3000', 10);
  return Number.isInteger(port) && port > 0 ? port : 3000;
};

const config: Config = {
  env: (process.env.NODE_ENV as Config['env']) ?? 'development',
  port: parsePort(process.env.PORT),
  isProduction: process.env.NODE_ENV === 'production',
  databaseUrl: process.env.DATABASE_URL ?? '',
};

export default config;