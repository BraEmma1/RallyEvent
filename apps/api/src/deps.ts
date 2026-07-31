import type { Db } from './db/queryable';
import { createPgDatabase } from './db/pool';
import type { OtpVerifier } from './auth/otp';
import { SupabaseOtpVerifier } from './auth/otp';
import type { TokenService } from './auth/tokens';
import { createTokenService } from './auth/tokens';

/** Everything the request handlers need, injectable so tests can supply fakes. */
export interface AppDeps {
  db: Db;
  otp: OtpVerifier;
  tokens: TokenService;
}

/** Production wiring: real Postgres pool, Supabase OTP, env-configured tokens. */
export function defaultDeps(): AppDeps {
  return {
    db: createPgDatabase(),
    otp: new SupabaseOtpVerifier(),
    tokens: createTokenService(),
  };
}
