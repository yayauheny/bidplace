import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { ApiErrorCode } from '@bidplace/contracts';
import type { PrismaClient } from '@bidplace/database';

import {
  createIntegrationDatabaseContext,
  type IntegrationDatabaseContext,
} from './test-database';
import { fixturePasswordHash } from './permission-fixtures';
import {
  createHttpTestApp,
  HttpTestClient,
  responseJson,
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

afterEach(async () => {
  await prisma.user.deleteMany({
    where: { email: { endsWith: '@inbox-http.test' } },
  });
});

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
      email: `admin.${Date.now()}@inbox-http.test`,
      passwordHash: fixturePasswordHash,
      displayName: 'Inbox HTTP admin',
      role: 'admin',
    },
    select: { id: true, email: true },
  });

  return { ...user, password: 'password123' };
}

async function login(
  client: HttpTestClient,
  user: { email: string; password: string },
): Promise<void> {
  const response = await client.post('/auth/login', {
    email: user.email,
    password: user.password,
  });
  expect(response.status).toBe(201);
}

describe('seller Order inbox HTTP auth', () => {
  it('rejects a guest GET /api/orders with 401', async () => {
    const client = new HttpTestClient(http.baseUrl, 'http://localhost:8081');

    const response = await client.get('/orders');

    expect(response.status).toBe(401);
    expect(await responseJson(response)).toEqual(
      expect.objectContaining({
        status: 401,
        code: ApiErrorCode.UNAUTHORIZED,
      }),
    );
  });

  it('rejects an admin GET /api/orders with 403', async () => {
    const admin = await createAdmin();
    const client = new HttpTestClient(
      http.baseUrl,
      'http://localhost:8081',
      '10.0.80.2',
    );

    await login(client, admin);
    const response = await client.get('/orders');

    expect(response.status).toBe(403);
    expect(await responseJson(response)).toEqual(
      expect.objectContaining({
        status: 403,
        code: ApiErrorCode.FORBIDDEN,
        message: 'Seller access required',
      }),
    );
  });
});
