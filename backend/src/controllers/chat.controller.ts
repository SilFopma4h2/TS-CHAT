import type { RequestHandler } from 'express';
import { db, type Queryable, type QueryResult } from '../db/index.js';
import { ApiError } from '../middleware/api-error.js';

/** Shape returned to clients. */
export interface ChatResponse {
  id: number;
  createdAt: Date;
  members: ChatMemberResponse[];
}

export interface ChatMemberResponse {
  id: number;
  username: string;
}

/** Factory producing chat handlers with injectable database. */
export function createChatHandlers(database: Queryable = db): {
  createChat: RequestHandler;
  getChats: RequestHandler;
} {
  /** POST /chats — create a one-to-one chat with another user. */
  const createChat: RequestHandler = async (req, res, next) => {
    try {
      const userId = req.user?.id;
      if (userId == null) throw new ApiError('Authentication required', 401);

      const { userId: otherUserId } = req.body ?? {};
      if (typeof otherUserId !== 'number' || !Number.isInteger(otherUserId) || otherUserId <= 0) {
        throw new ApiError('userId must be a positive integer', 400);
      }

      if (otherUserId === userId) throw new ApiError('Cannot create a chat with yourself', 400);

      const client = await database.connect();
      try {
        await client.query('BEGIN');

        // Check if other user exists.
        const otherUser = await client.query<{ id: number }>(
          'SELECT id FROM users WHERE id = $1',
          [otherUserId],
        );
        if (otherUser.rowCount === 0) throw new ApiError('User not found', 404);

        // Check if a 1:1 chat already exists between these two users.
        // We look for a chat that has exactly these two members and no others.
        const existing = await client.query<{ id: number }>(
          `SELECT c.id
           FROM chats c
           JOIN chat_members cm ON cm.chat_id = c.id
           WHERE cm.user_id IN ($1, $2)
           GROUP BY c.id
           HAVING COUNT(cm.user_id) = 2
              AND SUM(CASE WHEN cm.user_id = $1 THEN 1 ELSE 0 END) = 1
              AND SUM(CASE WHEN cm.user_id = $2 THEN 1 ELSE 0 END) = 1`,
          [userId, otherUserId],
        );
        if (existing.rowCount && existing.rowCount > 0) {
          throw new ApiError('Chat already exists', 409);
        }

        // Create chat and add both members.
        const chatResult = await client.query<{ id: number; created_at: Date }>(
          'INSERT INTO chats DEFAULT VALUES RETURNING id, created_at',
        );
        const chat = chatResult.rows[0]!;

        await client.query(
          'INSERT INTO chat_members (chat_id, user_id) VALUES ($1, $2), ($1, $3)',
          [chat.id, userId, otherUserId],
        );

        // Fetch member usernames for response.
        const membersResult = await client.query<{ id: number; username: string }>(
          `SELECT u.id, u.username
           FROM chat_members cm
           JOIN users u ON u.id = cm.user_id
           WHERE cm.chat_id = $1`,
          [chat.id],
        );

        await client.query('COMMIT');

        res.status(201).json({
          id: chat.id,
          createdAt: chat.created_at,
          members: membersResult.rows.map((m) => ({ id: m.id, username: m.username })),
        } satisfies ChatResponse);
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } catch (err) {
      next(err);
    }
  };

  /** GET /chats — list all chats the authenticated user is a member of. */
  const getChats: RequestHandler = async (req, res, next) => {
    try {
      const userId = req.user?.id;
      if (userId == null) throw new ApiError('Authentication required', 401);

      const { rows } = await database.query<{ id: number; created_at: Date }>(
        `SELECT c.id, c.created_at
         FROM chats c
         JOIN chat_members cm ON cm.chat_id = c.id
         WHERE cm.user_id = $1
         ORDER BY c.created_at DESC`,
        [userId],
      );

      if (rows.length === 0) {
        res.json([]);
        return;
      }

      const chatIds = rows.map((r) => r.id);

      // Fetch all members for these chats in a single query.
      const membersResult = await database.query<{
        chat_id: number;
        id: number;
        username: string;
      }>(
        `SELECT cm.chat_id, u.id, u.username
         FROM chat_members cm
         JOIN users u ON u.id = cm.user_id
         WHERE cm.chat_id = ANY($1)`,
        [chatIds],
      );

      // Group members by chat_id.
      const membersByChat = new Map<number, ChatMemberResponse[]>();
      for (const m of membersResult.rows) {
        const list = membersByChat.get(m.chat_id) ?? [];
        list.push({ id: m.id, username: m.username });
        membersByChat.set(m.chat_id, list);
      }

      res.json(
        rows.map((chat) => ({
          id: chat.id,
          createdAt: chat.created_at,
          members: membersByChat.get(chat.id) ?? [],
        })),
      );
    } catch (err) {
      next(err);
    }
  };

  return { createChat, getChats };
}