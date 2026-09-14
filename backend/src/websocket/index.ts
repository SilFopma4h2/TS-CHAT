import type { Server as HttpServer } from 'node:http';
import { WebSocketServer, type WebSocket } from 'ws';

export interface WebSocketServerOptions {
  /** URL path the WebSocket endpoint is served on. */
  path?: string;
}

/**
 * Attach the WebSocket transport to the HTTP server.
 *
 * The realtime messaging layer is implemented in Deel 2; this only
 * wires the transport so the architecture is ready.
 */
export function attachWebSocketServer(
  httpServer: HttpServer,
  options: WebSocketServerOptions = {},
): WebSocketServer {
  const wss = new WebSocketServer({
    server: httpServer,
    path: options.path ?? '/ws',
  });

  wss.on('connection', (socket: WebSocket) => {
    // Deel 2: authentication, presence and chat messages.
    socket.on('error', (err: Error) => {
      console.error('WebSocket error:', err);
    });
  });

  return wss;
}