import express from 'express';
import type { Express, NextFunction, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './env';
import { healthRouter } from './routes/health';
import { createAuthRouter } from './auth/routes';
import type { AppDeps } from './deps';
import { defaultDeps } from './deps';

/**
 * Build the Express app without starting a listener, so tests can drive it
 * in-process with injected dependencies. `index.ts` is the only caller that
 * uses the default (production) dependencies and calls `listen`.
 */
export function createApp(deps: AppDeps = defaultDeps()): Express {
  const app = express();

  // credentials:true so the browser will send/receive the httpOnly refresh cookie.
  app.use(cors({ origin: env.webOrigin, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  app.use('/health', healthRouter);
  app.use('/auth', createAuthRouter(deps));

  // Catch-all error handler (async route rejections are routed here).
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(500).json({ error: 'internal_error' });
  });

  return app;
}
