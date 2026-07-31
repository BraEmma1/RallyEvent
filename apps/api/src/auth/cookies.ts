import type { CookieOptions } from 'express';
import { env } from '../env';

export const REFRESH_COOKIE = 'rally_refresh';

const TTL_UNITS = {
  s: 1_000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
} as const;

/** Convert TTL strings like "30d" / "15m" to milliseconds (for cookie maxAge). */
export function ttlToMs(ttl: string): number {
  const match = /^(\d+)([smhd])$/.exec(ttl.trim());
  if (!match) {
    return 0;
  }
  const unit = match[2] as keyof typeof TTL_UNITS;
  return Number(match[1]) * TTL_UNITS[unit];
}

export function refreshCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.isProd,
    path: '/auth',
    maxAge: ttlToMs(env.jwt.refreshTtl),
  };
}
