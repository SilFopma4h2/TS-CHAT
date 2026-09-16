import type { RequestHandler } from 'express';
import type { HealthResponse } from '../types/index.js';

export const getHealth: RequestHandler<void, HealthResponse> = (_req, res) => {
  res.json({ status: 'ok' });
};