import { Pool } from 'pg';
import { env } from '../env';
import type { Db } from './queryable';

let pool: Pool | undefined;

/** Lazily-created shared connection pool (constructing it does not connect). */
export function getPool(): Pool {
  pool ??= new Pool({ connectionString: env.databaseUrl });
  return pool;
}

/** Wrap a pg Pool as our Db. Transactions run on a single checked-out client. */
export function createPgDatabase(p: Pool = getPool()): Db {
  return {
    async query(text, params) {
      const result = await p.query(text, params);
      return result as unknown as { rows: never[] };
    },
    async transaction(fn) {
      const client = await p.connect();
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
  };
}
