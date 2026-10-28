import { Prisma, type PrismaClient } from '@bidplace/database';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { ProductsService } from '../../src/products/products.service';
import { PublicIdService } from '../../src/core/public-id';
import {
  createHttpTestApp,
  HttpTestClient,
  type HttpTestApp,
} from './http-test-app';
import {
  createPermissionFixture,
  permissionImage,
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
  http = await createHttpTestApp(database.databaseUrl, 'http://localhost:8081');
});

afterEach(async () => resetPermissionFixture(prisma));

afterAll(async () => {
  await http?.close();
  await database?.cleanup();
});

async function login(client: HttpTestClient, email: string, password: string) {
  const response = await client.post('/auth/login', { email, password });
  expect(response.status).toBe(201);
}

async function publishApprovedWork(sellerProfileId: string, categoryId: string) {
  const product = await prisma.product.create({
    data: {
      publicId: `hide${crypto.randomUUID().replace(/-/g, '').slice(0, 7)}`,
      sellerProfileId,
      categoryId,
      title: 'Hide work',
      story: 'Hide work',
      uniqueness: 'One',
      provenance: 'Studio',
      city: 'Minsk',
      deliveryInfo: 'Pickup',
      status: 'APPROVED',
      publishedAt: new Date('2026-09-01T00:00:00.000Z'),
      images: {
        create: {
          position: 0,
          mimeType: 'image/png',
          byteLength: permissionImage.byteLength,
          data: permissionImage,
          checksum: '3'.repeat(64),
        },
      },
    },
    select: { id: true, images: { select: { id: true } } },
  });
  const revision = await prisma.productRevision.create({
    data: {
      productId: product.id,
      version: 1,
      status: 'APPROVED',
      categoryId,
      title: 'Hide work',
      story: 'Hide work',
      uniqueness: 'One',
      provenance: 'Studio',
      city: 'Minsk',
      deliveryInfo: 'Pickup',
      images: { create: { imageId: product.images[0]!.id, position: 0 } },
    },
  });
  return prisma.product.update({
    where: { id: product.id },
    data: {
      editingRevisionId: revision.id,
      publishedRevisionId: revision.id,
    },
    select: { id: true, status: true },
  });
}

function listingData(
  productId: string,
  status: 'SCHEDULED' | 'LIVE' | 'ENDED',
) {
  const startsAt = new Date('2026-09-01T10:00:00.000Z');
  const endsAt = new Date('2026-09-02T10:00:00.000Z');
  return {
    productId,
    status,
    startsAt,
    originalEndsAt: endsAt,
    endsAt,
    currentPrice: new Prisma.Decimal(10),
    auctionRules: { create: { startPrice: new Prisma.Decimal(10) } },
  };
}

describe('Work hide with live commerce', () => {
  it('fails closed for SCHEDULED and LIVE listings and leaves Product, Listing and audit unchanged', async () => {
    const fixture = await createPermissionFixture(prisma);
    const owner = new HttpTestClient(http.baseUrl, 'http://localhost:8081');
    await login(
      owner,
      fixture.sellers.approved.email,
      fixture.sellers.approved.password,
    );
    const product = await publishApprovedWork(
      fixture.sellers.approved.profileId,
      fixture.categoryId,
    );

    for (const status of ['SCHEDULED', 'LIVE'] as const) {
      const listing = await prisma.listing.create({
        data: listingData(product.id, status),
      });
      const beforeAudits = await prisma.auditEvent.count({
        where: { targetType: 'PRODUCT', targetId: product.id },
      });
      const response = await owner.post(`/products/${product.id}/hide`);
      expect(response.status).toBe(409);
      const unchanged = await prisma.product.findUniqueOrThrow({
        where: { id: product.id },
        select: { status: true },
      });
      const listingRow = await prisma.listing.findUniqueOrThrow({
        where: { id: listing.id },
        select: { status: true },
      });
      expect(unchanged.status).toBe('APPROVED');
      expect(listingRow.status).toBe(status);
      expect(
        await prisma.auditEvent.count({
          where: { targetType: 'PRODUCT', targetId: product.id },
        }),
      ).toBe(beforeAudits);
      await prisma.auctionRules.deleteMany({ where: { listingId: listing.id } });
      await prisma.listing.delete({ where: { id: listing.id } });
    }

    await prisma.listing.create({
      data: listingData(product.id, 'ENDED'),
    });
    expect((await owner.post(`/products/${product.id}/hide`)).status).toBe(201);
    expect(
      (
        await prisma.product.findUniqueOrThrow({
          where: { id: product.id },
          select: { status: true },
        })
      ).status,
    ).toBe('ARCHIVED');
  });

  it('serializes concurrent hide so only one ARCHIVED transition is written', async () => {
    const fixture = await createPermissionFixture(prisma);
    const product = await publishApprovedWork(
      fixture.sellers.approved.profileId,
      fixture.categoryId,
    );
    const products = new ProductsService(prisma as never, new PublicIdService());

    const results = await Promise.allSettled([
      products.hide(fixture.sellers.approved.id, product.id),
      products.hide(fixture.sellers.approved.id, product.id),
    ]);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(
      1,
    );
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(
      1,
    );
    expect(
      (
        await prisma.product.findUniqueOrThrow({
          where: { id: product.id },
          select: { status: true },
        })
      ).status,
    ).toBe('ARCHIVED');
    expect(
      await prisma.auditEvent.count({
        where: {
          targetType: 'PRODUCT',
          targetId: product.id,
          newStatus: 'ARCHIVED',
        },
      }),
    ).toBe(1);
  });
});
