import express from 'express';
import cors from 'cors';
import { env } from './env';
import { healthRouter } from './routes/health';

/**
 * Build the Express app without starting a listener, so tests can drive it
 * in-process. `index.ts` is the only place that calls `listen`.
 */
export function createApp() {
  const app = express();

  app.use(cors({ origin: env.webOrigin }));
  app.use(express.json());

  app.use('/health', healthRouter);

  return app;
}
