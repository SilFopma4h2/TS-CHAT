# DuoChat Backend

Realtime chat backend for DuoChat. REST API + WebSocket transport + PostgreSQL on Node.js + TypeScript (ESM).

## Requirements

- Node.js >= 20
- npm
- PostgreSQL (local install or Docker)

## Setup

```bash
cd backend
cp .env.example .env        # set DATABASE_URL to your local PostgreSQL
npm install
npm run db:migrate           # create tables (idempotent; safe to run again)
```

The server starts without a running database — only queries will fail until
PostgreSQL is reachable.

## Quick local PostgreSQL

Any of these work; just set `DATABASE_URL` in `.env` to the matching connection string.

### Option A — native install (Windows)

```powershell
winget install PostgreSQL.PostgreSQL.16   # creates a Windows service
# Create database + user (adjust password):
psql -U postgres -c "CREATE USER duochat WITH PASSWORD 'duochat';"
psql -U postgres -c "CREATE DATABASE duochat OWNER duochat;"
```

Set in `.env`:
```
DATABASE_URL=postgres://duochat:duochat@localhost:5432/duochat
```

### Option B — Docker

```bash
docker run -d --name duochat-pg \
  -p 5432:5432 \
  -e POSTGRES_USER=duochat \
  -e POSTGRES_PASSWORD=duochat \
  -e POSTGRES_DB=duochat \
  postgres:16
```

Use the same `DATABASE_URL` as Option A; stop/destroy with `docker rm -f duochat-pg`.

## Commands

| Command              | Description                               |
| -------------------- | ----------------------------------------- |
| `npm run dev`        | Start dev server with hot reload (tsx)    |
| `npm run build`      | Compile TypeScript to `dist/` (includes SQL migration copy) |
| `npm start`          | Run the compiled production build         |
| `npm run typecheck`  | Type-check the source (no emit)           |
| `npm test`           | Run tests (node:test); DB tests skip if no DB |
| `npm run db:migrate` | Apply pending database migrations         |

## Structure

```
src/
  config/          environment configuration (dotenv)
  controllers/     request handlers
  middleware/      ApiError, central error handler, 404 handler
  routes/          express routers
  services/        business logic (Deel 3)
  db/
    index.ts       db façade — query/connect/applyMigrations/close
    pool.ts        pg.Pool wrapper
    migrations.ts  migration runner (records applied files in schema_migrations)
    migrate.ts     CLI entrypoint (npm run db:migrate)
    migrations/    numbered .sql migration files
  websocket/       WebSocket transport wiring (Deel 3 messaging)
  types/           shared TypeScript types
  app.ts           Express app factory
  server.ts        HTTP + WebSocket entrypoint + graceful shutdown
tests/
  health.test.ts   REST health-check tests
  db.test.ts       database connectivity + schema tests (skip if no DB)
```

## Health check

```bash
curl http://localhost:3000/health
# {"status":"ok"}
```

API contracts live in `docs/API.md` (repo root).