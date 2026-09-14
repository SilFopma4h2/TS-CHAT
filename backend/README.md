# DuoChat Backend

Realtime chat backend for DuoChat. REST API + WebSocket-ready transport on Node.js + TypeScript (ESM).

## Requirements

- Node.js >= 20
- npm

## Setup

```bash
cd backend
cp .env.example .env   # adjust values if needed
npm install
```

## Commands

| Command                | Description                              |
| ---------------------- | ---------------------------------------- |
| `npm run dev`          | Start dev server with hot reload (tsx)   |
| `npm run build`        | Compile TypeScript to `dist/`            |
| `npm start`            | Run the compiled production build        |
| `npm run typecheck`    | Type-check the source (no emit)          |
| `npm test`             | Run tests (node:test)                    |

## Structure

```
src/
  config/       environment configuration (dotenv)
  controllers/  request handlers
  middleware/   ApiError, central error handler, 404 handler
  routes/       express routers
  services/     business logic (Deel 2)
  db/           PostgreSQL wiring (Deel 2)
  websocket/    WebSocket transport wiring (Deel 2 messaging)
  types/        shared TypeScript types
  app.ts        Express app factory
  server.ts     HTTP + WebSocket entrypoint
tests/          API tests (node:test)
```

## Health check

```bash
curl http://localhost:3000/health
# {"status":"ok"}
```

API contracts live in `docs/API.md` (repo root).