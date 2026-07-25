import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

// A single .env lives at the repo root (matches .env.example). Resolve it
// relative to this module so it loads no matter what cwd the script runs from.
const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(here, '../../../.env') });

/**
 * Server-side operational config only. Secrets (Supabase keys, JWT/HMAC
 * secrets) are read where they are used — never bundled toward the browser.
 */
export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  webOrigin: process.env.APP_BASE_URL ?? 'http://localhost:5173',
};
