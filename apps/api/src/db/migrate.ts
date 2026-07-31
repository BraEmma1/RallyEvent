import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Pool } from 'pg';
import { env } from '../env';

// apps/api/src/db -> repo root -> supabase/migrations
const migrationsDir = fileURLToPath(new URL('../../../../supabase/migrations', import.meta.url));

async function main(): Promise<void> {
  if (!env.databaseUrl) {
    throw new Error('DATABASE_URL is not set (copy .env.example to .env and fill it in)');
  }
  const pool = new Pool({ connectionString: env.databaseUrl });
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  try {
    for (const file of files) {
      process.stdout.write(`applying ${file} ... `);
      await pool.query(readFileSync(path.join(migrationsDir, file), 'utf8'));
      console.log('ok');
    }
  } finally {
    await pool.end();
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
