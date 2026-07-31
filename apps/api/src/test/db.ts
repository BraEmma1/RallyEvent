import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';
import { Pool } from 'pg';
import type { Db } from '../db/queryable';

// apps/api/src/test -> repo root -> supabase/migrations
const migrationsDir = fileURLToPath(new URL('../../../../supabase/migrations', import.meta.url));

function migrationFiles(): string[] {
  return readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .map((f) => readFileSync(path.join(migrationsDir, f), 'utf8'));
}

export interface TestDb extends Db {
  close(): Promise<void>;
}

/**
 * A real-Postgres test database seeded with the project migrations.
 *
 * Default: PGlite (in-process, no Docker) — real constraints/transactions via
 * its internally-serialised transaction lock.
 *
 * Set TEST_DATABASE_URL to run the identical suite against a real pooled
 * Postgres for a genuine multi-connection race (tables truncated between runs).
 */
export async function createTestDb(): Promise<TestDb> {
  const url = process.env.TEST_DATABASE_URL;
  return url ? createPgTestDb(url) : createPgliteTestDb();
}

async function createPgliteTestDb(): Promise<TestDb> {
  const pg = new PGlite();
  for (const sql of migrationFiles()) {
    await pg.exec(sql);
  }
  return {
    async query(text, params) {
      const r = await pg.query(text, params);
      return r as unknown as { rows: never[] };
    },
    async transaction(fn) {
      // PGlite serialises transactions internally, so this is race-safe.
      const result = await pg.transaction(async (tx) =>
        fn({
          async query(text, params) {
            const r = await tx.query(text, params);
            return r as unknown as { rows: never[] };
          },
        }),
      );
      return result as unknown as Awaited<ReturnType<typeof fn>>;
    },
    async close() {
      await pg.close();
    },
  };
}

async function createPgTestDb(url: string): Promise<TestDb> {
  const pool = new Pool({ connectionString: url });
  for (const sql of migrationFiles()) {
    await pool.query(sql);
  }
  await pool.query('truncate account restart identity cascade');
  return {
    async query(text, params) {
      const r = await pool.query(text, params);
      return r as unknown as { rows: never[] };
    },
    async transaction(fn) {
      const client = await pool.connect();
      try {
        await client.query('begin');
        const result = await fn({
          async query(text, params) {
            const r = await client.query(text, params);
            return r as unknown as { rows: never[] };
          },
        });
        await client.query('commit');
        return result;
      } catch (err) {
        await client.query('rollback');
        throw err;
      } finally {
        client.release();
      }
    },
    async close() {
      await pool.end();
    },
  };
}
