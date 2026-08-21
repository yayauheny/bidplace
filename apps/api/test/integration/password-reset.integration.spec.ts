import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { PrismaClient } from '@bidplace/database';
import { readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import {
  createIntegrationDatabaseContext,
  type IntegrationDatabaseContext,
} from './test-database';
import {
  createPermissionFixture,
  resetPermissionFixture,
} from './permission-fixtures';
import {
  createHttpTestApp,
  HttpTestClient,
  type HttpTestApp,
} from './http-test-app';

let database: IntegrationDatabaseContext;
let http: HttpTestApp;
let prisma: PrismaClient;
let emailFilePath: string;

beforeAll(async () => {
  emailFilePath = join(tmpdir(), `bidplace-password-reset-${Date.now()}.jsonl`);
  process.env.TEST_EMAIL_FILE = emailFilePath;
  process.env.PASSWORD_RESET_URL_BASE = 'http://localhost:8081';

  database = await createIntegrationDatabaseContext();
  prisma = database.prisma;
  http = await createHttpTestApp(database.databaseUrl);
});

afterEach(async () => {
  await resetPermissionFixture(prisma);
  await rm(emailFilePath, { force: true });
});

afterAll(async () => {
  await http?.close();
  await database?.cleanup();
});

async function readResetToken(): Promise<string> {
  const contents = await readFile(emailFilePath, 'utf8');
  const line = contents.trim().split('\n').at(-1);
  expect(line).toBeTruthy();
  const parsed = JSON.parse(line!) as { token?: string };
  expect(parsed.token).toBeTruthy();
  return parsed.token!;
}

describe('password reset HTTP transport', () => {
  it('returns neutral ok for unknown and known emails and resets password with session invalidation', async () => {
    const fixture = await createPermissionFixture(prisma);
    const client = new HttpTestClient(
      http.baseUrl,
      'http://localhost:8081',
      '10.0.2.5',
    );

    const unknown = await client.post('/auth/password/forgot', {
      email: 'missing@example.com',
    });
    expect(unknown.status).toBe(201);
    expect(await unknown.json()).toEqual({ ok: true });
    expect(await prisma.passwordResetToken.count()).toBe(0);

    const loginBeforeReset = await client.post('/auth/login', {
      email: fixture.buyer.email,
      password: fixture.buyer.password,
    });
    expect(loginBeforeReset.status).toBe(201);
    const oldCookie = loginBeforeReset.headers.getSetCookie()[0]!;

    const forgot = await client.post('/auth/password/forgot', {
      email: fixture.buyer.email,
    });
    expect(forgot.status).toBe(201);
    expect(await forgot.json()).toEqual({ ok: true });

    const token = await readResetToken();
    const newPassword = 'new-password-123';

    const reset = await client.post('/auth/password/reset', {
      token,
      password: newPassword,
    });
    expect(reset.status).toBe(201);
    expect(await reset.json()).toEqual({ ok: true });

    const replay = await client.post('/auth/password/reset', {
      token,
      password: 'another-password-123',
    });
    expect(replay.status).toBe(400);
    expect((await replay.json()).code).toBe('PASSWORD_RESET_INVALID');

    const staleMe = await client.get('/auth/me', {
      headers: { cookie: oldCookie.split(';', 1)[0]! },
    });
    expect(staleMe.status).toBe(401);

    const loginWithOld = await client.post('/auth/login', {
      email: fixture.buyer.email,
      password: fixture.buyer.password,
    });
    expect(loginWithOld.status).toBe(401);

    const loginWithNew = await client.post('/auth/login', {
      email: fixture.buyer.email,
      password: newPassword,
    });
    expect(loginWithNew.status).toBe(201);
  });

  it('invalidates the previous token when a second forgot request is issued', async () => {
    const fixture = await createPermissionFixture(prisma);
    const client = new HttpTestClient(
      http.baseUrl,
      'http://localhost:8081',
      '10.0.2.6',
    );

    expect(
      (
        await client.post('/auth/password/forgot', {
          email: fixture.buyer.email,
        })
      ).status,
    ).toBe(201);
    const firstToken = await readResetToken();

    await prisma.passwordResetToken.updateMany({
      where: { userId: fixture.buyer.id },
      data: { createdAt: new Date(Date.now() - 120_000) },
    });

    expect(
      (
        await client.post('/auth/password/forgot', {
          email: fixture.buyer.email,
        })
      ).status,
    ).toBe(201);
    const secondToken = await readResetToken();
    expect(secondToken).not.toBe(firstToken);

    const firstReset = await client.post('/auth/password/reset', {
      token: firstToken,
      password: 'first-password-123',
    });
    expect(firstReset.status).toBe(400);
    expect((await firstReset.json()).code).toBe('PASSWORD_RESET_INVALID');

    const secondReset = await client.post('/auth/password/reset', {
      token: secondToken,
      password: 'second-password-123',
    });
    expect(secondReset.status).toBe(201);
  });

  it('rejects expired reset tokens with PASSWORD_RESET_INVALID', async () => {
    const fixture = await createPermissionFixture(prisma);
    const client = new HttpTestClient(
      http.baseUrl,
      'http://localhost:8081',
      '10.0.2.7',
    );

    expect(
      (
        await client.post('/auth/password/forgot', {
          email: fixture.buyer.email,
        })
      ).status,
    ).toBe(201);
    const token = await readResetToken();

    await prisma.passwordResetToken.updateMany({
      where: { userId: fixture.buyer.id },
      data: { expiresAt: new Date(Date.now() - 1) },
    });

    const reset = await client.post('/auth/password/reset', {
      token,
      password: 'expired-password-123',
    });
    expect(reset.status).toBe(400);
    expect((await reset.json()).code).toBe('PASSWORD_RESET_INVALID');
  });
});
