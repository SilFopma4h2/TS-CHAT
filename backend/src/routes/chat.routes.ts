import { Router } from 'express';
import { createChatHandlers } from '../controllers/chat.controller.js';
import { requireAuth } from '../middleware/require-auth.js';

const { createChat, getChats } = createChatHandlers();

const router = Router();

// All chat routes are protected.
router.post('/chats', requireAuth, createChat);
router.get('/chats', requireAuth, getChats);

export default router;