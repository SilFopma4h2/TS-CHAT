import { Router } from 'express';
import { createAuthHandlers } from '../controllers/auth.controller.js';

const { register, login } = createAuthHandlers();

const router = Router();

router.post('/auth/register', register);
router.post('/auth/login', login);

export default router;