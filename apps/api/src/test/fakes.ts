import type { OtpVerifier } from '../auth/otp';
import { OtpError } from '../auth/otp';
import type { TokenService } from '../auth/tokens';
import { createTokenService } from '../auth/tokens';

/** In-memory OTP verifier for tests. Optionally always fails verification. */
export class FakeOtpVerifier implements OtpVerifier {
  public readonly requested: string[] = [];

  constructor(private readonly opts: { failVerify?: boolean } = {}) {}

  async requestEmailOtp(email: string): Promise<void> {
    this.requested.push(email);
  }

  async verifyEmailOtp(): Promise<void> {
    if (this.opts.failVerify) {
      throw new OtpError('invalid or expired code');
    }
  }
}

export function testTokens(): TokenService {
  return createTokenService({
    secret: 'test-secret-that-is-at-least-32-bytes-long!!',
    accessTtl: '15m',
    refreshTtl: '30d',
  });
}
