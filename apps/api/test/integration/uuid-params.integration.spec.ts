import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { PrismaClient } from '@bidplace/database';

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

describe('UUID-backed HTTP parameters', () => {
  it('rejects malformed identifiers before Work, image and achievement persistence', async () => {
    const fixture = await createPermissionFixture(prisma);
    const owner = new HttpTestClient(http.baseUrl, 'http://localhost:8081');
    expect(
      (
        await owner.post('/auth/login', {
          email: fixture.sellers.approved.email,
          password: fixture.sellers.approved.password,
        })
      ).status,
    ).toBe(201);

    const responses = await Promise.all([
      owner.patch('/products/not-a-uuid', { title: 'Malformed id' }),
      owner.get('/images/not-a-uuid'),
      owner.get('/creation-steps/not-a-uuid/image'),
      owner.get('/seller/products/not-a-uuid'),
      owner.delete('/author/application/achievements/not-a-uuid'),
    ]);
    expect(responses.map((response) => response.status)).toEqual([
      400,
      400,
      400,
      400,
      400,
    ]);
  });

  it('preserves not-found responses for valid but unknown identifiers', async () => {
    const fixture = await createPermissionFixture(prisma);
    const owner = new HttpTestClient(http.baseUrl, 'http://localhost:8081');
    expect(
      (
        await owner.post('/auth/login', {
          email: fixture.sellers.approved.email,
          password: fixture.sellers.approved.password,
        })
      ).status,
    ).toBe(201);
    const unknownId = '00000000-0000-4000-8000-000000000000';

    const responses = await Promise.all([
      owner.patch(`/products/${unknownId}`, { title: 'Unknown id' }),
      owner.get(`/images/${unknownId}`),
      owner.get(`/creation-steps/${unknownId}/image`),
      owner.get(`/seller/products/${unknownId}`),
      owner.delete(`/author/application/achievements/${unknownId}`),
    ]);

    expect(responses.map((response) => response.status)).toEqual([
      404,
      404,
      404,
      404,
      404,
    ]);
  });
});
