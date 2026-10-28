import { randomUUID } from 'node:crypto';

import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { PrismaClient } from '@bidplace/database';

import {
  createIntegrationDatabaseContext,
  type IntegrationDatabaseContext,
} from './test-database';
import {
  createPermissionFixture,
  fixturePasswordHash,
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

beforeAll(async () => {
  database = await createIntegrationDatabaseContext();
  prisma = database.prisma;
  http = await createHttpTestApp(database.databaseUrl);
});

afterEach(async () => resetPermissionFixture(prisma));

afterAll(async () => {
  await http?.close();
  await database?.cleanup();
});

async function createAdmin(): Promise<{
  id: string;
  email: string;
  password: string;
}> {
  const user = await prisma.user.create({
    data: {
      email: `admin.emergency.${randomUUID()}@wave3.test`,
      passwordHash: fixturePasswordHash,
      displayName: 'Emergency admin',
      role: 'admin',
    },
    select: { id: true, email: true },
  });

  return { ...user, password: 'password123' };
}

async function login(
  client: HttpTestClient,
  user: { email: string; password: string },
): Promise<string> {
  const response = await client.post('/auth/login', {
    email: user.email,
    password: user.password,
  });
  expect(response.status).toBe(201);
  return response.headers.getSetCookie()[0]!;
}

describe('admin user emergency controls HTTP transport', () => {
  it('looks up users, bans and unbans with session invalidation', async () => {
    const fixture = await createPermissionFixture(prisma);
    const admin = await createAdmin();
    const client = new HttpTestClient(http.baseUrl, 'http://localhost:8081');

    await login(client, admin);

    const lookup = await client.get(
      `/admin/users?email=${encodeURIComponent(fixture.buyer.email)}`,
    );
    expect(lookup.status).toBe(200);
    expect((await lookup.json()).users).toEqual([
      expect.objectContaining({
        id: fixture.buyer.id,
        email: fixture.buyer.email,
        status: 'active',
      }),
    ]);

    const buyerClient = new HttpTestClient(http.baseUrl, 'http://localhost:8081');
    const buyerCookie = await login(buyerClient, fixture.buyer);

    const ban = await client.patch(`/admin/users/${fixture.buyer.id}/status`, {
      status: 'banned',
      reason: 'Abuse during pilot',
    });
    expect(ban.status).toBe(200);
    expect((await ban.json()).status).toBe('banned');

    const bannedLogin = await buyerClient.post('/auth/login', {
      email: fixture.buyer.email,
      password: fixture.buyer.password,
    });
    expect(bannedLogin.status).toBe(401);

    const staleMe = await buyerClient.get('/auth/me', {
      headers: { cookie: buyerCookie.split(';', 1)[0]! },
    });
    expect(staleMe.status).toBe(401);

    const auditBan = await prisma.auditEvent.findFirst({
      where: {
        targetType: 'USER',
        targetId: fixture.buyer.id,
        newStatus: 'banned',
      },
    });
    expect(auditBan?.reason).toBe('Abuse during pilot');

    const unban = await client.patch(`/admin/users/${fixture.buyer.id}/status`, {
      status: 'active',
      reason: 'False positive',
    });
    expect(unban.status).toBe(200);

    const loginAfterUnban = await buyerClient.post('/auth/login', {
      email: fixture.buyer.email,
      password: fixture.buyer.password,
    });
    expect(loginAfterUnban.status).toBe(201);
  });

  it('revokes sessions without changing user status', async () => {
    const fixture = await createPermissionFixture(prisma);
    const admin = await createAdmin();
    const client = new HttpTestClient(http.baseUrl, 'http://localhost:8081');

    await login(client, admin);

    const buyerClient = new HttpTestClient(http.baseUrl, 'http://localhost:8081');
    const buyerCookie = await login(buyerClient, fixture.buyer);

    const revoke = await client.post(
      `/admin/users/${fixture.buyer.id}/revoke-sessions`,
      { reason: 'Compromised account' },
    );
    expect(revoke.status).toBe(201);
    expect((await revoke.json()).status).toBe('active');

    const staleMe = await buyerClient.get('/auth/me', {
      headers: { cookie: buyerCookie.split(';', 1)[0]! },
    });
    expect(staleMe.status).toBe(401);

    const relogin = await buyerClient.post('/auth/login', {
      email: fixture.buyer.email,
      password: fixture.buyer.password,
    });
    expect(relogin.status).toBe(201);
  });

  it('rejects banning another admin account', async () => {
    const targetAdmin = await createAdmin();
    const admin = await createAdmin();
    const client = new HttpTestClient(http.baseUrl, 'http://localhost:8081');

    await login(client, admin);

    const ban = await client.patch(`/admin/users/${targetAdmin.id}/status`, {
      status: 'banned',
      reason: 'Attempt admin ban',
    });
    expect(ban.status).toBe(403);
  });

  it('rejects self ban and self session revoke', async () => {
    const admin = await createAdmin();
    const client = new HttpTestClient(http.baseUrl, 'http://localhost:8081');

    await login(client, admin);

    const selfBan = await client.patch(`/admin/users/${admin.id}/status`, {
      status: 'banned',
      reason: 'Self ban',
    });
    expect(selfBan.status).toBe(403);

    const selfRevoke = await client.post(
      `/admin/users/${admin.id}/revoke-sessions`,
      { reason: 'Self revoke' },
    );
    expect(selfRevoke.status).toBe(403);
  });
});
