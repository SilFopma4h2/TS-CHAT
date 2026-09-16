import { Router } from 'express';
import healthRouter from './health.routes.js';
import authRouter from './auth.routes.js';
import usersRouter from './users.routes.js';
import chatRouter from './chat.routes.js';

const router = Router();

// Register route modules here (Deel 5: rooms, messages, WebSocket).
router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(chatRouter);

export default router;