import { type PrismaClient } from '@bidplace/database';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { productModerationRequest, sellerModerationRequest } from './admin-status-request';
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
  fixturePasswordHash,
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
  sellerUserId: string,
  status: 'SCHEDULED' | 'LIVE' | 'ENDED',
) {
  const startsAt = new Date('2026-09-01T10:00:00.000Z');
  const endsAt = new Date('2026-09-02T10:00:00.000Z');
  return {
    productId,
    sellerUserId,
    type: 'AUCTION' as const,
    status,
    currency: 'BYN',
    startsAt,
    originalEndsAt: endsAt,
    endsAt,
    currentPriceMinor: 1_000,
    endedAt: status === 'ENDED' ? endsAt : null,
    auctionRules: {
      create: { startPriceMinor: 1_000, stepTableCode: 'BYN_V1' },
    },
  };
}

describe('Work hide with live commerce', () => {
  it('returns PRODUCT_STATE_CONFLICT while a media writer holds the Product lock', async () => {
    const fixture = await createPermissionFixture(prisma);
    const owner = new HttpTestClient(http.baseUrl, 'http://localhost:8081');
    await login(owner, fixture.sellers.approved.email, fixture.sellers.approved.password);
    const product = await publishApprovedWork(fixture.sellers.approved.profileId, fixture.categoryId);
    const before = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
    const audits = await prisma.auditEvent.count({ where: { targetId: product.id } });
    let acquired!: () => void;
    let release!: () => void;
    const ready = new Promise<void>((resolve) => { acquired = resolve; });
    const released = new Promise<void>((resolve) => { release = resolve; });
    const writer = prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM products WHERE id = ${product.id}::uuid FOR UPDATE`;
      acquired();
      await released;
    }, { timeout: 15_000 });
    await ready;
    const delivery = setTimeout(release, 6_000);
    try {
      const response = await owner.post(`/products/${product.id}/hide`);
      expect(response.status).toBe(409);
      expect(await response.json()).toMatchObject({ code: 'PRODUCT_STATE_CONFLICT' });
      expect(await prisma.product.findUniqueOrThrow({ where: { id: product.id } })).toEqual(before);
      expect(await prisma.auditEvent.count({ where: { targetId: product.id } })).toBe(audits);
    } finally {
      clearTimeout(delivery);
      release();
      await writer;
    }
  });

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
        data: listingData(product.id, fixture.sellers.approved.id, status),
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
      data: listingData(product.id, fixture.sellers.approved.id, 'ENDED'),
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

  it.each(['hide', 'edit', 'upload', 'admin archive'] as const)(
    'returns PRODUCT_IN_SALE before %s changes a work with a LIVE listing',
    async (action) => {
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
      await prisma.listing.create({ data: listingData(product.id, fixture.sellers.approved.id, 'LIVE') });
      const admin = new HttpTestClient(http.baseUrl, 'http://localhost:8081');
      if (action === 'admin archive') {
        await prisma.user.create({
          data: {
            email: 'guard.admin@wave3.test',
            passwordHash: fixturePasswordHash,
            displayName: 'Guard admin',
            role: 'admin',
          },
        });
        await login(
          admin,
          'guard.admin@wave3.test',
          fixture.sellers.approved.password,
        );
      }
      const form = new FormData();
      form.append(
        'images',
        new Blob([permissionImage], { type: 'image/png' }),
        'photo.png',
      );
      const response =
        action === 'admin archive'
          ? await admin.patch(
              `/admin/products/${product.id}/status`,
              await productModerationRequest(
                prisma,
                product.id,
                'ARCHIVED',
                'Guard test',
              ),
            )
          : action === 'hide'
            ? await owner.post(`/products/${product.id}/hide`)
            : action === 'edit'
              ? await owner.patch(`/products/${product.id}`, {
                  title: 'Must not change',
                })
              : await owner.post(`/products/${product.id}/images`, form);
      expect(response.status).toBe(409);
      expect(await response.json()).toMatchObject({ code: 'PRODUCT_IN_SALE' });
      expect(
        await prisma.product.findUniqueOrThrow({ where: { id: product.id } }),
      ).toMatchObject({ status: 'APPROVED', title: 'Hide work' });
      expect(
        await prisma.productRevision.count({
          where: { productId: product.id },
        }),
      ).toBe(1);
    },
  );

  it('keeps seller suspension blocked while an owned work is in sale', async () => {
    const fixture = await createPermissionFixture(prisma);
    const product = await publishApprovedWork(
      fixture.sellers.approved.profileId,
      fixture.categoryId,
    );
    await prisma.listing.create({ data: listingData(product.id, fixture.sellers.approved.id, 'LIVE') });
    await prisma.user.create({
      data: {
        email: 'guard.admin@wave3.test',
        passwordHash: fixturePasswordHash,
        displayName: 'Guard admin',
        role: 'admin',
      },
    });
    const admin = new HttpTestClient(http.baseUrl, 'http://localhost:8081');
    await login(
      admin,
      'guard.admin@wave3.test',
      fixture.sellers.approved.password,
    );
    const response = await admin.patch(
      `/admin/seller-profiles/${fixture.sellers.approved.profileId}/status`,
      await sellerModerationRequest(
        prisma,
        fixture.sellers.approved.profileId,
        'SUSPENDED',
        'Guard test',
      ),
    );
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({
      message:
        'Seller cannot be suspended while a scheduled or live listing exists',
    });
    expect(
      await prisma.sellerProfile.findUniqueOrThrow({
        where: { id: fixture.sellers.approved.profileId },
      }),
    ).toMatchObject({ status: 'APPROVED' });
  });

  it.each([
    'hidden',
    'unapproved author',
    'banned user',
    'wrong revision',
    'missing publication date',
    'valid',
  ] as const)('matches catalog image membership for %s', async (state) => {
    const fixture = await createPermissionFixture(prisma);
    const product = await publishApprovedWork(
      fixture.sellers.approved.profileId,
      fixture.categoryId,
    );
    let image = await prisma.productImage.findFirstOrThrow({
      where: { productId: product.id },
    });
    if (state === 'hidden')
      await prisma.product.update({
        where: { id: product.id },
        data: { status: 'ARCHIVED' },
      });
    if (state === 'unapproved author')
      await prisma.sellerProfile.update({
        where: { id: fixture.sellers.approved.profileId },
        data: { status: 'PENDING_REVIEW' },
      });
    if (state === 'banned user')
      await prisma.user.update({
        where: { id: fixture.sellers.approved.id },
        data: { status: 'banned' },
      });
    if (state === 'missing publication date')
      await prisma.product.update({
        where: { id: product.id },
        data: { publishedAt: null },
      });
    if (state === 'wrong revision')
      image = await prisma.productImage.create({
        data: {
          productId: product.id,
          position: 1,
          mimeType: 'image/png',
          byteLength: permissionImage.byteLength,
          data: permissionImage,
          checksum: '4'.repeat(64),
        },
      });
    const guest = new HttpTestClient(http.baseUrl, 'http://localhost:8081');
    const parent = await prisma.product.findUniqueOrThrow({
      where: { id: product.id },
    });
    const catalog = await guest.get('/works?limit=100');
    expect(catalog.status).toBe(200);
    const body = (await catalog.json()) as {
      works: Array<{
        work: { publicId: string; images: Array<{ id: string }> };
      }>;
    };
    const item = body.works.find(
      ({ work }) => work.publicId === parent.publicId,
    );
    const catalogIncludesImage = Boolean(
      item?.work.images.some(({ id }) => id === image.id),
    );
    expect(catalogIncludesImage).toBe(state === 'valid');
    expect((await guest.get(`/images/${image.id}`)).status).toBe(
      catalogIncludesImage ? 200 : 404,
    );
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
