import { Router } from 'express';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { z } from 'zod';
import type { RefreshResponse, RequestOtpResponse, VerifyOtpResponse } from '@rally/shared';
import type { AppDeps } from '../deps';
import { findOrCreateAccountByIdentifier } from '../identity/accounts';
import { InvalidIdentifierError, normalizeEmail } from '../identity/normalize';
import { OtpError } from './otp';
import { REFRESH_COOKIE, refreshCookieOptions } from './cookies';

const requestOtpSchema = z.object({
  identifier: z.string().min(1),
  channel: z.enum(['email', 'phone']),
});

const verifyOtpSchema = z.object({
  identifier: z.string().min(1),
  code: z.string().min(1),
});

// Express 4 does not catch async errors, so route the rejection to next().
type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;
const wrap =
  (fn: AsyncHandler): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };

export function createAuthRouter(deps: AppDeps): Router {
  const router = Router();

  // POST /auth/request-otp { identifier, channel } → sends an email OTP.
  router.post(
    '/request-otp',
    wrap(async (req, res) => {
      const parsed = requestOtpSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'invalid_request' });
      }
      const { identifier, channel } = parsed.data;

      if (channel === 'phone') {
        // Field accepted, but no SMS in the pilot.
        return res.status(400).json({
          error: 'phone_not_enabled',
          message: 'Phone OTP is not enabled in the pilot. Use email.',
        });
      }

      let email: string;
      try {
        email = normalizeEmail(identifier);
      } catch (err) {
        if (err instanceof InvalidIdentifierError) {
          return res.status(400).json({ error: 'invalid_email' });
        }
        throw err;
      }

      try {
        await deps.otp.requestEmailOtp(email);
      } catch (err) {
        if (err instanceof OtpError) {
          return res.status(502).json({ error: 'otp_send_failed' });
        }
        throw err;
      }

      const body: RequestOtpResponse = { sent: true, channel: 'email' };
      return res.json(body);
    }),
  );

  // POST /auth/verify-otp { identifier, code } → { token, isNewUser }.
  router.post(
    '/verify-otp',
    wrap(async (req, res) => {
      const parsed = verifyOtpSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'invalid_request' });
      }
      const { identifier, code } = parsed.data;

      let email: string;
      try {
        email = normalizeEmail(identifier);
      } catch {
        return res.status(400).json({ error: 'invalid_email' });
      }

      // Verify the code BEFORE creating any account.
      try {
        await deps.otp.verifyEmailOtp({ email, code });
      } catch (err) {
        if (err instanceof OtpError) {
          return res.status(401).json({ error: 'invalid_or_expired_code' });
        }
        throw err;
      }

      const { account, isNewUser } = await findOrCreateAccountByIdentifier(deps.db, 'email', email);

      const accessToken = await deps.tokens.signAccess({ sub: account.id });
      const refreshToken = await deps.tokens.signRefresh({ sub: account.id });
      res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());

      const body: VerifyOtpResponse = { token: accessToken, isNewUser };
      return res.status(200).json(body);
    }),
  );

  // POST /auth/refresh (refresh cookie) → new access token.
  router.post(
    '/refresh',
    wrap(async (req, res) => {
      const cookies = req.cookies as Record<string, string> | undefined;
      const token = cookies?.[REFRESH_COOKIE];
      if (!token) {
        return res.status(401).json({ error: 'missing_refresh_token' });
      }

      try {
        const { sub } = await deps.tokens.verifyRefresh(token);
        const accessToken = await deps.tokens.signAccess({ sub });
        const body: RefreshResponse = { token: accessToken };
        return res.json(body);
      } catch {
        res.clearCookie(REFRESH_COOKIE, refreshCookieOptions());
        return res.status(401).json({ error: 'invalid_refresh_token' });
      }
    }),
  );

  return router;
}
