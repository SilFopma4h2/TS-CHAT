import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { createApp } from './app.js';
import config from './config/index.js';
import { attachWebSocketServer } from './websocket/index.js';

const app = createApp();
const httpServer = createServer(app);

// Attach the WebSocket transport to the same HTTP server (Deel 2: /ws messages).
attachWebSocketServer(httpServer);

httpServer.listen(config.port, () => {
  const { port } = httpServer.address() as AddressInfo;
  console.log(`DuoChat backend listening on http://localhost:${port} (${config.env})`);
});

function shutdown(signal: string): void {
  console.log(`${signal} received — shutting down`);
  httpServer.close(() => process.exit(0));
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));