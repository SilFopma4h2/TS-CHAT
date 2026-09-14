import { Router } from 'express';
import healthRouter from './health.routes.js';

const router = Router();

// Register route modules here (Deel 2: chat, rooms, etc.).
router.use(healthRouter);

export default router;