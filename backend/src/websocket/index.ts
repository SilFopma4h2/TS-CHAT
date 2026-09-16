import type { Server as HttpServer } from 'node:http';
import { WebSocketServer, WebSocket, type RawData } from 'ws';
import jwt from 'jsonwebtoken';
import { getJwtConfig } from '../config/jwt.js';
import type { AuthenticatedUser } from '../types/index.js';
import { db } from '../db/index.js';

export interface WebSocketServerOptions {
  path?: string;
}

/** Parsed WebSocket message from client. */
export interface ClientMessage {
  type: string;
  payload: unknown;
}

/** Server-to-client message format. */
export interface ServerMessage {
  type: string;
  payload: unknown;
}

/** Error response from server. */
export interface ErrorPayload {
  code: string;
  message: string;
}

/** Authenticated WebSocket connection with user info. */
interface AuthenticatedConnection {
  socket: WebSocket;
  user: AuthenticatedUser;
  chats: Set<number>; // chat IDs this user is a member of
}

/** Manages WebSocket connections and message routing. */
export class WebSocketManager {
  private connections = new Map<WebSocket, AuthenticatedConnection>();
  private userConnections = new Map<number, Set<WebSocket>>();
  private userChats = new Map<number, Set<number>>(); // userId -> set of chatIds

  constructor() {}

  /** Handle a new WebSocket connection. */
  handleConnection(socket: WebSocket): void {
    console.log('WebSocket connection opened');

    socket.on('message', (data: RawData) => this.handleMessage(socket, data));
    socket.on('close', () => this.handleClose(socket));
    socket.on('error', (err: Error) => {
      console.error('WebSocket error:', err);
    });
  }

  /** Parse and route incoming message. */
  private async handleMessage(socket: WebSocket, data: RawData): Promise<void> {
    let msg: ClientMessage;
    try {
      const parsed = JSON.parse(data.toString());
      if (!parsed.type || !parsed.payload) throw new Error('Invalid format');
      msg = parsed;
    } catch {
      this.sendError(socket, 'INVALID_MESSAGE', 'Invalid message format');
      return;
    }

    switch (msg.type) {
      case 'auth':
        await this.handleAuth(socket, msg.payload);
        break;
      case 'message.send':
        await this.handleSendMessage(socket, msg.payload);
        break;
      default:
        this.sendError(socket, 'UNKNOWN_TYPE', `Unknown message type: ${msg.type}`);
    }
  }

  /** Handle authentication message. */
  private async handleAuth(socket: WebSocket, payload: unknown): Promise<void> {
    const { token } = (payload as { token?: string }) ?? {};

    if (!token || typeof token !== 'string') {
      this.sendError(socket, 'UNAUTHORIZED', 'Missing token');
      return;
    }

    try {
      const { secret } = getJwtConfig();
      const decoded = jwt.verify(token, secret) as unknown as { sub: number; username: string };

      const user: AuthenticatedUser = {
        id: decoded.sub,
        username: decoded.username,
      };

      // Fetch user's chat memberships.
      const { rows } = await db.query<{ chat_id: number }>(
        'SELECT chat_id FROM chat_members WHERE user_id = $1',
        [user.id],
      );
      const chats = new Set(rows.map((r) => r.chat_id));

      const conn: AuthenticatedConnection = { socket, user, chats };
      this.connections.set(socket, conn);

      // Check if this is the user's first connection (going online)
      const existingSockets = this.userConnections.get(user.id);
      const isFirstConnection = !existingSockets || existingSockets.size === 0;

      if (!this.userConnections.has(user.id)) {
        this.userConnections.set(user.id, new Set());
      }
      this.userConnections.get(user.id)!.add(socket);

      // Store user's chats for presence broadcasting
      this.userChats.set(user.id, chats);

      this.send(socket, { type: 'auth.ok', payload: { userId: user.id, username: user.username } });
      console.log(`User ${user.username} (id: ${user.id}) authenticated via WebSocket`);

      // Broadcast online status to chat members if this was the first connection
      if (isFirstConnection) {
        this.broadcastPresence(user.id, 'user.online');
      }
    } catch {
      this.sendError(socket, 'UNAUTHORIZED', 'Invalid token');
      socket.close(4001, 'Invalid token');
    }
  }

  /** Handle message.send event. */
  private async handleSendMessage(socket: WebSocket, payload: unknown): Promise<void> {
    const conn = this.connections.get(socket);
    if (!conn) {
      this.sendError(socket, 'UNAUTHORIZED', 'Not authenticated');
      return;
    }

    const { chatId, content } = (payload as { chatId?: number; content?: string }) ?? {};

    if (typeof chatId !== 'number' || !Number.isInteger(chatId) || chatId <= 0) {
      this.sendError(socket, 'INVALID_PAYLOAD', 'chatId must be a positive integer');
      return;
    }

    if (typeof content !== 'string' || content.trim().length === 0) {
      this.sendError(socket, 'INVALID_PAYLOAD', 'content must be a non-empty string');
      return;
    }

    // Authorization: check if user is member of the chat.
    if (!conn.chats.has(chatId)) {
      this.sendError(socket, 'FORBIDDEN', 'Not a member of this chat');
      return;
    }

    const client = await db.connect();
    try {
      await client.query('BEGIN');

      // Insert message into database.
      const { rows } = await client.query<{
        id: number;
        chat_id: number;
        sender_id: number;
        content: string;
        created_at: Date;
      }>(
        `INSERT INTO messages (chat_id, sender_id, content)
         VALUES ($1, $2, $3)
         RETURNING id, chat_id, sender_id, content, created_at`,
        [chatId, conn.user.id, content.trim()],
      );

      const message = rows[0]!;

      // Fetch all members of this chat to broadcast.
      const { rows: members } = await client.query<{ user_id: number }>(
        'SELECT user_id FROM chat_members WHERE chat_id = $1',
        [chatId],
      );

      await client.query('COMMIT');

      const createdPayload = {
        id: message.id,
        chatId: message.chat_id,
        senderId: message.sender_id,
        content: message.content,
        createdAt: message.created_at.toISOString(),
      };

      // Broadcast to all members of the chat.
      this.broadcastToUsers(
        members.map((m) => m.user_id),
        { type: 'message.created', payload: createdPayload },
      );
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Failed to send message:', err);
      this.sendError(socket, 'INTERNAL_ERROR', 'Failed to send message');
    } finally {
      client.release();
    }
  }

  /** Broadcast a message to multiple users (all their connections). */
  private broadcastToUsers(userIds: number[], message: ServerMessage): void {
    for (const userId of userIds) {
      const sockets = this.userConnections.get(userId);
      if (sockets) {
        for (const socket of sockets) {
          if (socket.readyState === WebSocket.OPEN) {
            this.send(socket, message);
          }
        }
      }
    }
  }

  /** Handle connection close. */
  private handleClose(socket: WebSocket): void {
    const conn = this.connections.get(socket);
    if (conn) {
      const userId = conn.user.id;
      const userSockets = this.userConnections.get(userId);
      if (userSockets) {
        userSockets.delete(socket);
        if (userSockets.size === 0) {
          this.userConnections.delete(userId);
          // This was the last connection - user goes offline
          this.broadcastPresence(userId, 'user.offline');
          this.userChats.delete(userId);
        }
      }
      this.connections.delete(socket);
      console.log(`User ${conn.user.username} (id: ${userId}) disconnected`);
    }
  }

  /** Broadcast online/offline presence to relevant chat members. */
  private broadcastPresence(userId: number, type: 'user.online' | 'user.offline'): void {
    const chats = this.userChats.get(userId);
    if (!chats || chats.size === 0) return;

    const payload = { userId };

    // For each chat the user is in, broadcast to all other members
    for (const chatId of chats) {
      // We need to get chat members from the database to know who to notify
      // For now, broadcast to all connected users who have this chat in their chats set
      for (const [otherUserId, otherChats] of this.userChats.entries()) {
        if (otherUserId !== userId && otherChats.has(chatId)) {
          const sockets = this.userConnections.get(otherUserId);
          if (sockets) {
            for (const socket of sockets) {
              if (socket.readyState === WebSocket.OPEN) {
                this.send(socket, { type, payload });
              }
            }
          }
        }
      }
    }
  }

  /** Send a JSON message to a socket. */
  private send(socket: WebSocket, message: ServerMessage): void {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  }

  /** Send an error response to a socket. */
  private sendError(socket: WebSocket, code: string, message: string): void {
    this.send(socket, {
      type: 'error',
      payload: { code, message },
    } satisfies ServerMessage);
  }

  /** Get connection count for monitoring. */
  getConnectionCount(): number {
    return this.connections.size;
  }
}

/** Singleton manager instance. */
let managerInstance: WebSocketManager | null = null;

/**
 * Attach the WebSocket transport to the HTTP server.
 * This implements the full realtime messaging layer for Deel 6.
 */
export function attachWebSocketServer(
  httpServer: HttpServer,
  options: WebSocketServerOptions = {},
): WebSocketServer {
  if (managerInstance) {
    console.warn('WebSocket server already attached');
    return managerInstance as unknown as WebSocketServer;
  }

  const wss = new WebSocketServer({
    server: httpServer,
    path: options.path ?? '/ws',
  });

  managerInstance = new WebSocketManager();

  wss.on('connection', (socket: WebSocket) => {
    managerInstance!.handleConnection(socket);
  });

  wss.on('error', (err: Error) => {
    console.error('WebSocket server error:', err);
  });

  console.log(`WebSocket server attached at ${options.path ?? '/ws'}`);
  return wss;
}

/** Get the manager instance (for testing). */
export function getWebSocketManager(): WebSocketManager | null {
  return managerInstance;
}

/** Reset manager (for testing). */
export function resetWebSocketManager(): void {
  managerInstance = null;
}