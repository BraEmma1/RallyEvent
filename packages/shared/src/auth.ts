/** Identifier kinds. Both are unique keys to a single account (dedup). */
export type IdentifierType = 'email' | 'phone';

/** OTP delivery channels. Only email is enabled in the pilot. */
export type OtpChannel = 'email' | 'phone';

// POST /auth/request-otp
export interface RequestOtpBody {
  identifier: string;
  channel: OtpChannel;
}
export interface RequestOtpResponse {
  sent: boolean;
  channel: OtpChannel;
}

// POST /auth/verify-otp
export interface VerifyOtpBody {
  identifier: string;
  code: string;
}
export interface VerifyOtpResponse {
  /** Short-lived access token (JWT). The refresh token rides in an httpOnly cookie. */
  token: string;
  isNewUser: boolean;
}

// POST /auth/refresh
export interface RefreshResponse {
  token: string;
}
