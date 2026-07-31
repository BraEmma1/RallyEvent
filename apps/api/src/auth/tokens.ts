import { SignJWT, jwtVerify } from 'jose';
import { env } from '../env';

export interface TokenConfig {
  secret: string;
  accessTtl: string;
  refreshTtl: string;
}

export interface AccessClaims {
  sub: string;
}

export interface TokenService {
  signAccess(claims: AccessClaims): Promise<string>;
  signRefresh(claims: AccessClaims): Promise<string>;
  verifyRefresh(token: string): Promise<AccessClaims>;
}

const defaultConfig = (): TokenConfig => ({
  secret: env.jwt.secret,
  accessTtl: env.jwt.accessTtl,
  refreshTtl: env.jwt.refreshTtl,
});

/**
 * Stateless JWT session. Access token is returned to the client; the refresh
 * token rides in an httpOnly cookie. No server-side session store — the tokens
 * are self-contained and verified by signature.
 */
export function createTokenService(config: TokenConfig = defaultConfig()): TokenService {
  const key = new TextEncoder().encode(config.secret);

  const sign = (sub: string, type: 'access' | 'refresh', ttl: string): Promise<string> =>
    new SignJWT({ type })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(sub)
      .setIssuedAt()
      .setExpirationTime(ttl)
      .sign(key);

  return {
    signAccess: ({ sub }) => sign(sub, 'access', config.accessTtl),
    signRefresh: ({ sub }) => sign(sub, 'refresh', config.refreshTtl),
    async verifyRefresh(token) {
      const { payload } = await jwtVerify(token, key);
      if (payload.type !== 'refresh' || typeof payload.sub !== 'string') {
        throw new Error('Not a valid refresh token');
      }
      return { sub: payload.sub };
    },
  };
}
