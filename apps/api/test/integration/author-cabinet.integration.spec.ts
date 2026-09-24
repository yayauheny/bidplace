import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { PrismaClient } from '@bidplace/database';
import { portfolioCabinetWorksResponseSchema } from '@bidplace/contracts';

import {
  createHttpTestApp,
  HttpTestClient,
  type HttpTestApp,
} from './http-test-app';
import {
  createPermissionFixture,
  resetPermissionFixture,
} from './permission-fixtures';
import {
  createIntegrationDatabaseContext,
  type IntegrationDatabaseContext,
} from './test-database';

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

async function login(
  client: HttpTestClient,
  credentials: {
    email: string;
    password: string;
  },
) {
  expect(
    await client.post('/auth/login', {
      email: credentials.email,
      password: credentials.password,
    }),
  ).toMatchObject({
    status: 201,
  });
}

describe('author cabinet HTTP contract', () => {
  it('returns paginated owner works only to approved and suspended authors', async () => {
    const fixture = await createPermissionFixture(prisma);
    const approved = new HttpTestClient(http.baseUrl, 'http://localhost:8081');
    const pending = new HttpTestClient(http.baseUrl, 'http://localhost:8081');
    const guest = new HttpTestClient(http.baseUrl, 'http://localhost:8081');

    expect((await guest.get('/author/cabinet/works')).status).toBe(401);
    await login(approved, fixture.sellers.approved);
    await login(pending, fixture.sellers.pending);

    const response = await approved.get('/author/cabinet/works?page=1&limit=1');
    expect(response.status).toBe(200);
    const body = portfolioCabinetWorksResponseSchema.parse(
      await response.json(),
    );
    expect(body.pagination).toEqual({ page: 1, limit: 1, total: 3 });
    expect(body.works).toHaveLength(1);
    expect(body.works[0]).toMatchObject({
      editingRevisionStatus: expect.any(String),
      coverImage: expect.objectContaining({
        url: expect.stringMatching(/^\/api\/images\//),
      }),
    });

    expect((await pending.get('/author/cabinet/works')).status).toBe(403);
  });
});
