import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestDb, type TestDb } from '../test/db';
import { findOrCreateAccountByIdentifier } from './accounts';

describe('findOrCreateAccountByIdentifier (dedup)', () => {
  let db: TestDb;

  beforeEach(async () => {
    db = await createTestDb();
  });
  afterEach(async () => {
    await db.close();
  });

  async function counts() {
    const a = await db.query<{ n: number }>('select count(*)::int as n from account');
    const i = await db.query<{ n: number }>('select count(*)::int as n from identifier');
    const p = await db.query<{ n: number }>('select count(*)::int as n from profile');
    return { accounts: a.rows[0]!.n, identifiers: i.rows[0]!.n, profiles: p.rows[0]!.n };
  }

  // Test 1
  it('creates exactly one account + identifier for a new email (isNewUser=true)', async () => {
    const { account, isNewUser } = await findOrCreateAccountByIdentifier(
      db,
      'email',
      'alice@example.com',
    );
    expect(isNewUser).toBe(true);
    expect(account.id).toBeTruthy();
    expect(await counts()).toEqual({ accounts: 1, identifiers: 1, profiles: 1 });
  });

  // Test 2
  it('returns the SAME account on repeat (isNewUser=false), no duplicate rows', async () => {
    const first = await findOrCreateAccountByIdentifier(db, 'email', 'bob@example.com');
    const second = await findOrCreateAccountByIdentifier(db, 'email', 'bob@example.com');
    expect(second.isNewUser).toBe(false);
    expect(second.account.id).toBe(first.account.id);
    expect(await counts()).toEqual({ accounts: 1, identifiers: 1, profiles: 1 });
  });

  // Test 4
  it('normalises casing/whitespace so variants resolve to one account', async () => {
    const a = await findOrCreateAccountByIdentifier(db, 'email', '  Foo@Bar.COM ');
    const b = await findOrCreateAccountByIdentifier(db, 'email', 'foo@bar.com');
    expect(b.account.id).toBe(a.account.id);
    expect(b.isNewUser).toBe(false);
    expect((await counts()).accounts).toBe(1);
  });

  // Test 3
  it('rejects a duplicate (type, value) at the DB constraint', async () => {
    await findOrCreateAccountByIdentifier(db, 'email', 'carol@example.com');

    // A different account trying to claim the same identifier value must fail.
    const other = await db.query<{ id: string }>(
      `insert into account (status) values ('active') returning id`,
    );
    await expect(
      db.query(
        `insert into identifier (account_id, type, value)
         values ($1, 'email', 'carol@example.com')`,
        [other.rows[0]!.id],
      ),
    ).rejects.toMatchObject({ code: '23505' });

    expect((await counts()).identifiers).toBe(1);
  });

  // Test 5
  it('handles concurrent creates of the same new email → exactly one account', async () => {
    const results = await Promise.all(
      Array.from({ length: 8 }, () =>
        findOrCreateAccountByIdentifier(db, 'email', 'dave@example.com'),
      ),
    );

    const uniqueIds = new Set(results.map((r) => r.account.id));
    expect(uniqueIds.size).toBe(1);
    expect(results.filter((r) => r.isNewUser)).toHaveLength(1);
    expect(await counts()).toEqual({ accounts: 1, identifiers: 1, profiles: 1 });
  });
});
