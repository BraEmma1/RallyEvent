import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

// A single .env lives at the repo root (matches .env.example). Resolve it
// relative to this module so it loads no matter what cwd the script runs from.
const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(here, '../../../.env') });

const nodeEnv = process.env.NODE_ENV ?? 'development';

/**
 * Server-side config. Secrets stay here on the server and are never bundled
 * toward the browser (only VITE_* reaches the web client).
 */
export const env = {
  nodeEnv,
  isProd: nodeEnv === 'production',
  port: Number(process.env.PORT ?? 4000),
  webOrigin: process.env.APP_BASE_URL ?? 'http://localhost:5173',

  databaseUrl: process.env.DATABASE_URL ?? '',

  supabaseUrl: process.env.SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?? '',

  jwt: {
    secret: process.env.JWT_SECRET ?? '',
    accessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
    refreshTtl: process.env.JWT_REFRESH_TTL ?? '30d',
  },
};
