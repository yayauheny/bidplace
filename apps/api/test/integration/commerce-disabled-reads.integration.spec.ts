import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { PrismaClient } from '@bidplace/database';

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

beforeAll(async () => {
  database = await createIntegrationDatabaseContext();
  prisma = database.prisma;
  http = await createHttpTestApp(database.databaseUrl, 'http://localhost:8081', {
    commerceEnabled: false,
  });
});

afterEach(async () => resetPermissionFixture(prisma));

afterAll(async () => {
  await http?.close();
  await database?.cleanup();
});

describe('commerce-disabled public reads', () => {
  it('returns 404 for legacy commerce reads while portfolio works remain available', async () => {
    const fixture = await createPermissionFixture(prisma);
    const guest = new HttpTestClient(http.baseUrl, 'http://localhost:8081');
    const owner = new HttpTestClient(http.baseUrl, 'http://localhost:8081');
    const product = await prisma.product.findUniqueOrThrow({
      where: { id: fixture.approvedProductId },
      select: { publicId: true },
    });
    const author = await prisma.sellerProfile.findUniqueOrThrow({
      where: { id: fixture.sellers.approved.profileId },
      select: { slug: true },
    });

    expect((await guest.get('/products')).status).toBe(404);
    expect((await guest.get(`/products/${product.publicId}`)).status).toBe(404);
    expect((await guest.get('/discovery/home')).status).toBe(404);
    expect((await guest.get('/sellers')).status).toBe(404);
    expect((await guest.get(`/sellers/${author.slug}/detail`)).status).toBe(
      404,
    );

    const login = await owner.post('/auth/login', {
      email: fixture.buyer.email,
      password: fixture.buyer.password,
    });
    expect(login.status).toBe(201);
    expect((await owner.get('/me/activity')).status).toBe(404);

    expect((await guest.get('/works')).status).toBe(200);
    expect((await guest.get(`/works/${product.publicId}`)).status).toBe(200);
    expect((await guest.get('/authors')).status).toBe(200);
    expect((await guest.get(`/authors/${author.slug}`)).status).toBe(200);
  });
});
