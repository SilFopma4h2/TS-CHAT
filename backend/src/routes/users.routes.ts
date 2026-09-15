import { Router } from 'express';
import { createUsersHandlers } from '../controllers/users.controller.js';
import { requireAuth } from '../middleware/require-auth.js';

const { getMe } = createUsersHandlers();

const router = Router();

// All user routes are protected.
router.get('/users/me', requireAuth, getMe);

export default router;