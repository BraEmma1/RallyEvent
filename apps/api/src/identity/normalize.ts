import { parsePhoneNumberFromString } from 'libphonenumber-js';
import type { IdentifierType } from '@rally/shared';

export class InvalidIdentifierError extends Error {
  constructor(public readonly kind: IdentifierType) {
    super(`Invalid ${kind}`);
    this.name = 'InvalidIdentifierError';
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Trim + lowercase. Storing one canonical form is what makes dedup reliable. */
export function normalizeEmail(raw: string): string {
  const value = raw.trim().toLowerCase();
  if (!EMAIL_RE.test(value)) {
    throw new InvalidIdentifierError('email');
  }
  return value;
}

/** Parse to E.164. Pilot default region is Ghana for numbers typed without a +code. */
export function normalizePhone(raw: string, defaultCountry: 'GH' = 'GH'): string {
  const parsed = parsePhoneNumberFromString(raw.trim(), defaultCountry);
  if (!parsed || !parsed.isValid()) {
    throw new InvalidIdentifierError('phone');
  }
  return parsed.number; // E.164, e.g. +233...
}

export function normalizeIdentifierValue(type: IdentifierType, raw: string): string {
  return type === 'email' ? normalizeEmail(raw) : normalizePhone(raw);
}
