import type { RequestHandler } from 'express';
import { db, type Queryable } from '../db/index.js';
import { ApiError } from '../middleware/api-error.js';

/** Shape returned to clients (never includes password_hash). */
export interface UserResponse {
  id: number;
  username: string;
  createdAt: Date;
}

export function createUsersHandlers(database: Queryable = db): { getMe: RequestHandler } {
  /** GET /users/me — returns the authenticated user's profile. */
  const getMe: RequestHandler = async (req, res, next) => {
    try {
      const userId = req.user?.id;
      if (userId == null) throw new ApiError('Authentication required', 401);

      const { rows } = await database.query<{ id: number; username: string; created_at: Date }>(
        'SELECT id, username, created_at FROM users WHERE id = $1',
        [userId],
      );

      const user = rows[0];
      if (!user) throw new ApiError('User not found', 404);

      res.json({
        id: user.id,
        username: user.username,
        createdAt: user.created_at,
      } satisfies UserResponse);
    } catch (err) {
      next(err);
    }
  };

  return { getMe };
}