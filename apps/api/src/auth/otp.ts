import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '../env';

/** Raised when Supabase rejects an OTP request or verification (wrong/expired/etc). */
export class OtpError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OtpError';
  }
}

/**
 * Verifies email ownership via a one-time code. We lean on Supabase Auth for
 * this (free email delivery, hashed codes + expiry managed server-side), then
 * treat a successful verification as proof of email ownership before we touch
 * our own account tables.
 */
export interface OtpVerifier {
  requestEmailOtp(email: string): Promise<void>;
  verifyEmailOtp(input: { email: string; code: string }): Promise<void>;
}

export class SupabaseOtpVerifier implements OtpVerifier {
  private client: SupabaseClient | undefined;

  private getClient(): SupabaseClient {
    if (!this.client) {
      if (!env.supabaseUrl || !env.supabaseAnonKey) {
        throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY are required for email OTP');
      }
      this.client = createClient(env.supabaseUrl, env.supabaseAnonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
    }
    return this.client;
  }

  async requestEmailOtp(email: string): Promise<void> {
    const { error } = await this.getClient().auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    if (error) {
      throw new OtpError(error.message);
    }
  }

  async verifyEmailOtp({ email, code }: { email: string; code: string }): Promise<void> {
    const { error } = await this.getClient().auth.verifyOtp({
      email,
      token: code,
      type: 'email',
    });
    if (error) {
      throw new OtpError(error.message);
    }
  }
}
