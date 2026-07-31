import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { createTestDb, type TestDb } from '../test/db';
import { FakeOtpVerifier, testTokens } from '../test/fakes';

describe('POST /auth/verify-otp', () => {
  let db: TestDb;

  beforeEach(async () => {
    db = await createTestDb();
  });
  afterEach(async () => {
    await db.close();
  });

  async function accountCount() {
    const r = await db.query<{ n: number }>('select count(*)::int as n from account');
    return r.rows[0]!.n;
  }

  // Test 6
  it('rejects a wrong/expired code and creates NO account', async () => {
    const app = createApp({
      db,
      otp: new FakeOtpVerifier({ failVerify: true }),
      tokens: testTokens(),
    });

    const res = await request(app)
      .post('/auth/verify-otp')
      .send({ identifier: 'newuser@example.com', code: '000000' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('invalid_or_expired_code');
    expect(await accountCount()).toBe(0);
  });

  it('on valid code: creates the account, returns a token + isNewUser, sets refresh cookie', async () => {
    const app = createApp({ db, otp: new FakeOtpVerifier(), tokens: testTokens() });

    const first = await request(app)
      .post('/auth/verify-otp')
      .send({ identifier: '  New@Example.com ', code: '123456' });

    expect(first.status).toBe(200);
    expect(first.body.isNewUser).toBe(true);
    expect(typeof first.body.token).toBe('string');
    const setCookie = first.headers['set-cookie'] as unknown as string[] | undefined;
    expect(setCookie?.[0]).toMatch(/rally_refresh=/);

    // Same email, different casing → returning user, still one account.
    const second = await request(app)
      .post('/auth/verify-otp')
      .send({ identifier: 'new@example.com', code: '123456' });

    expect(second.status).toBe(200);
    expect(second.body.isNewUser).toBe(false);
    expect(await accountCount()).toBe(1);
  });

  it('accepts the phone channel field but reports it is not enabled', async () => {
    const app = createApp({ db, otp: new FakeOtpVerifier(), tokens: testTokens() });

    const res = await request(app)
      .post('/auth/request-otp')
      .send({ identifier: '+233201234567', channel: 'phone' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('phone_not_enabled');
  });
});
