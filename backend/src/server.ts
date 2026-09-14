import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { createApp } from './app.js';
import config from './config/index.js';
import { db } from './db/index.js';
import { attachWebSocketServer } from './websocket/index.js';

const app = createApp();
const httpServer = createServer(app);

// Attach the WebSocket transport to the same HTTP server (Deel 2: /ws messages).
attachWebSocketServer(httpServer);

httpServer.listen(config.port, () => {
  const { port } = httpServer.address() as AddressInfo;
  console.log(`DuoChat backend listening on http://localhost:${port} (${config.env})`);
});

async function shutdown(signal: string): Promise<void> {
  console.log(`${signal} received — shutting down`);
  httpServer.close(async () => {
    try {
      // Close the PostgreSQL connection pool so the process exits cleanly.
      await db.close();
    } finally {
      process.exit(0);
    }
  });
}

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});
process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});