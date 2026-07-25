import { Router } from 'express';
import type { HealthResponse } from '@rally/shared';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  const body: HealthResponse = {
    status: 'ok',
    service: 'rally-api',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  };
  res.json(body);
});
