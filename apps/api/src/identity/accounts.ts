import type { IdentifierType } from '@rally/shared';
import type { Db, Queryable } from '../db/queryable';
import { normalizeIdentifierValue } from './normalize';

export interface AccountRow {
  id: string;
  created_at: string;
  status: string;
}

/** Thrown inside the create transaction when the identifier already exists (a race). */
class IdentifierConflict extends Error {}

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: string }).code === '23505'
  );
}

/**
 * Find an account by a normalised identifier value, checking BOTH identifier
 * types (an email value and a phone value never collide, so matching by value
 * alone is the dedup key).
 */
export async function findAccountByIdentifierValue(
  db: Queryable,
  value: string,
): Promise<AccountRow | null> {
  const res = await db.query<AccountRow>(
    `select a.id, a.created_at, a.status
       from account a
       join identifier i on i.account_id = a.id
      where i.value = $1
      limit 1`,
    [value],
  );
  return res.rows[0] ?? null;
}

/**
 * Return the existing account for an identifier, or create a new
 * account + identifier + empty profile in one transaction.
 *
 * Concurrency-safe: instead of a bare check-then-insert, the create relies on
 * the UNIQUE(type, value) constraint. If a concurrent request wins the race,
 * `ON CONFLICT DO NOTHING` yields no row, we roll back the just-created account,
 * and re-read the winner — guaranteeing exactly one account per human.
 *
 * Reused as-is by the signed registration handoff flow later.
 */
export async function findOrCreateAccountByIdentifier(
  db: Db,
  type: IdentifierType,
  rawValue: string,
): Promise<{ account: AccountRow; isNewUser: boolean }> {
  const value = normalizeIdentifierValue(type, rawValue);

  // Fast path: already known.
  const existing = await findAccountByIdentifierValue(db, value);
  if (existing) {
    return { account: existing, isNewUser: false };
  }

  try {
    const account = await db.transaction(async (tx) => {
      const created = await tx.query<AccountRow>(
        `insert into account (status) values ('active')
         returning id, created_at, status`,
      );
      const acct = created.rows[0];
      if (!acct) {
        throw new Error('account insert returned no row');
      }

      const ident = await tx.query<{ id: string }>(
        `insert into identifier (account_id, type, value, verified_at)
         values ($1, $2, $3, now())
         on conflict (type, value) do nothing
         returning id`,
        [acct.id, type, value],
      );
      if (ident.rows.length === 0) {
        // Lost the race — someone inserted this identifier first.
        throw new IdentifierConflict();
      }

      await tx.query(
        `insert into profile (account_id) values ($1)
         on conflict (account_id) do nothing`,
        [acct.id],
      );

      return acct;
    });

    return { account, isNewUser: true };
  } catch (err) {
    if (err instanceof IdentifierConflict || isUniqueViolation(err)) {
      const raced = await findAccountByIdentifierValue(db, value);
      if (raced) {
        return { account: raced, isNewUser: false };
      }
    }
    throw err;
  }
}
