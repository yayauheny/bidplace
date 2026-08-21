import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { PrismaClient } from '@bidplace/database';

import {
  createIntegrationDatabaseContext,
  type IntegrationDatabaseContext,
} from './test-database';
import {
  createPermissionFixture,
  permissionImage,
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

function imageForm(): FormData {
  const form = new FormData();
  form.append(
    'images',
    new Blob([permissionImage], { type: 'image/png' }),
    'photo.png',
  );
  return form;
}

const gifBuffer = Buffer.from(
  'GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\x00\x00\x00\x00\x00!\xf9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;',
);

function gifForm(): FormData {
  const form = new FormData();
  form.append(
    'images',
    new Blob([gifBuffer], { type: 'image/gif' }),
    'animation.gif',
  );
  return form;
}

describe('image upload safety HTTP transport', () => {
  it('rejects gif uploads before persistence', async () => {
    const fixture = await createPermissionFixture(prisma);
    const client = new HttpTestClient(http.baseUrl, 'http://localhost:8081');

    const login = await client.post('/auth/login', {
      email: fixture.sellers.approved.email,
      password: fixture.sellers.approved.password,
    });
    expect(login.status).toBe(201);

    const beforeCount = await prisma.productImage.count({
      where: { productId: fixture.approvedDraftProductId },
    });

    const response = await client.post(
      `/products/${fixture.approvedDraftProductId}/images`,
      gifForm(),
    );
    expect(response.status).toBe(400);

    expect(
      await prisma.productImage.count({
        where: { productId: fixture.approvedDraftProductId },
      }),
    ).toBe(beforeCount);
  });

  it('rejects non-owner uploads with forbidden before adding images', async () => {
    const fixture = await createPermissionFixture(prisma);
    const buyer = new HttpTestClient(http.baseUrl, 'http://localhost:8081');

    const login = await buyer.post('/auth/login', {
      email: fixture.buyer.email,
      password: fixture.buyer.password,
    });
    expect(login.status).toBe(201);

    const beforeCount = await prisma.productImage.count({
      where: { productId: fixture.approvedDraftProductId },
    });

    const response = await buyer.post(
      `/products/${fixture.approvedDraftProductId}/images`,
      imageForm(),
    );
    expect(response.status).toBe(403);

    expect(
      await prisma.productImage.count({
        where: { productId: fixture.approvedDraftProductId },
      }),
    ).toBe(beforeCount);
  });

  it('accepts static png uploads from the approved owner', async () => {
    const fixture = await createPermissionFixture(prisma);
    const client = new HttpTestClient(http.baseUrl, 'http://localhost:8081');

    const login = await client.post('/auth/login', {
      email: fixture.sellers.approved.email,
      password: fixture.sellers.approved.password,
    });
    expect(login.status).toBe(201);

    const beforeCount = await prisma.productImage.count({
      where: { productId: fixture.approvedDraftProductId },
    });

    const response = await client.post(
      `/products/${fixture.approvedDraftProductId}/images`,
      imageForm(),
    );
    expect(response.status).toBe(201);

    expect(
      await prisma.productImage.count({
        where: { productId: fixture.approvedDraftProductId },
      }),
    ).toBe(beforeCount + 1);
  });
});
