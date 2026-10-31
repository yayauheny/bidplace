import { type PrismaClient } from '@bidplace/database';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import {
  createHttpTestApp,
  HttpTestClient,
  type HttpTestApp,
} from './http-test-app';
import {
  createPermissionFixture,
  resetPermissionFixture,
  fixturePasswordHash,
  permissionImage,
} from './permission-fixtures';
import { productModerationRequest } from './admin-status-request';
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
afterEach(async () => {
  await prisma.notificationOutbox.deleteMany();
  await prisma.rateLimitCounter.deleteMany();
  await resetPermissionFixture(prisma);
});
afterAll(async () => {
  await http?.close();
  await database?.cleanup();
});

describe('work deletion', () => {
  it.each([
    'DRAFT',
    'PENDING_REVIEW',
    'CHANGES_REQUESTED',
    'APPROVED',
    'ARCHIVED',
    'REJECTED',
  ] as const)(
    'removes an owned %s work and accepts repeated deletion',
    async (status) => {
      const fixture = await createPermissionFixture(prisma);
      const owner = new HttpTestClient(http.baseUrl);
      expect(
        (
          await owner.post('/auth/login', {
            email: fixture.sellers.approved.email,
            password: fixture.sellers.approved.password,
          })
        ).status,
      ).toBe(201);
      const id = fixture.approvedDraftProductId;
      await prisma.product.update({ where: { id }, data: { status } });
      expect((await owner.delete(`/products/${id}`)).status).toBe(204);
      expect((await owner.delete(`/products/${id}`)).status).toBe(204);
      const cabinet = await owner.get('/author/cabinet/works?limit=100');
      expect(cabinet.status).toBe(200);
      expect(JSON.stringify(await cabinet.json())).not.toContain(id);
    },
  );
  it('denies image access and new listings after deleting a published work', async () => {
    const fixture = await createPermissionFixture(prisma);
    const owner = new HttpTestClient(http.baseUrl);
    await owner.post('/auth/login', {
      email: fixture.sellers.approved.email,
      password: fixture.sellers.approved.password,
    });
    const id = fixture.approvedProductId;
    const image = await prisma.productImage.findFirstOrThrow({
      where: { productId: id },
    });
    expect((await owner.get(`/images/${image.id}`)).status).toBe(200);
    expect((await owner.delete(`/products/${id}`)).status).toBe(204);
    expect((await owner.get(`/images/${image.id}`)).status).toBe(404);
    const response = await owner.post(`/works/${id}/listings`, {
      type: 'FIXED',
      currency: 'BYN',
      priceMinor: 1500,
      startsAt: new Date(Date.now() - 1000).toISOString(),
    });
    expect(response.status).toBe(404);
    expect(
      await prisma.listing.count({
        where: { productId: id, status: { in: ['LIVE', 'SCHEDULED'] } },
      }),
    ).toBe(0);
  });

  it('rejects a moderator decision after deletion', async () => {
    const fixture = await createPermissionFixture(prisma);
    const owner = new HttpTestClient(http.baseUrl);
    await owner.post('/auth/login', {
      email: fixture.sellers.approved.email,
      password: fixture.sellers.approved.password,
    });
    const id = fixture.approvedDraftProductId;
    const product = await prisma.product.findUniqueOrThrow({ where: { id } });
    await prisma.product.update({
      where: { id },
      data: { status: 'PENDING_REVIEW' },
    });
    await prisma.productRevision.update({
      where: { id: product.editingRevisionId! },
      data: { status: 'PENDING_REVIEW' },
    });
    const decision = await productModerationRequest(prisma, id, 'APPROVED');
    await prisma.user.create({
      data: {
        email: 'deletion.admin@wave3.test',
        passwordHash: fixturePasswordHash,
        displayName: 'Admin',
        role: 'admin',
      },
    });
    const admin = new HttpTestClient(http.baseUrl);
    await admin.post('/auth/login', {
      email: 'deletion.admin@wave3.test',
      password: fixture.sellers.approved.password,
    });
    expect((await owner.delete(`/products/${id}`)).status).toBe(204);
    expect(
      (await admin.patch(`/admin/products/${id}/status`, decision)).status,
    ).toBe(409);
    expect(
      (await prisma.product.findUniqueOrThrow({ where: { id } })).status,
    ).toBe('PENDING_REVIEW');
  });

  it('retains a private order cover only for the order participants', async () => {
    const fixture = await createPermissionFixture(prisma);
    const product = await prisma.product.findUniqueOrThrow({
      where: { id: fixture.approvedProductId },
    });
    const image = await prisma.productImage.findFirstOrThrow({
      where: { productId: product.id },
    });
    const otherImage = await prisma.productImage.create({
      data: {
        productId: product.id,
        position: 1,
        mimeType: image.mimeType,
        byteLength: image.byteLength,
        data: image.data,
        checksum: image.checksum,
      },
    });
    await prisma.order.create({
      data: {
        publicId: 'orderdelet1',
        dealCode: '123456',
        productId: product.id,
        listingId: fixture.approvedListingId,
        sellerUserId: fixture.sellers.approved.id,
        buyerUserId: fixture.buyer.id,
        source: 'FIXED_PURCHASE',
        amountMinor: 1500,
        currency: 'BYN',
        status: 'COMPLETED',
        workTitleSnapshot: 'Snapshot title',
        workPublicIdSnapshot: product.publicId,
        coverImageIdSnapshot: image.id,
        sellerNameSnapshot: 'Seller',
      },
    });
    const owner = new HttpTestClient(http.baseUrl);
    const buyer = new HttpTestClient(http.baseUrl);
    const stranger = new HttpTestClient(http.baseUrl);
    const guest = new HttpTestClient(http.baseUrl);
    const admin = new HttpTestClient(http.baseUrl);
    await prisma.user.create({ data: { email: 'cover.admin@wave3.test', passwordHash: fixturePasswordHash, displayName: 'Admin', role: 'admin' } });
    await admin.post('/auth/login', { email: 'cover.admin@wave3.test', password: fixture.sellers.approved.password });
    await owner.post('/auth/login', {
      email: fixture.sellers.approved.email,
      password: fixture.sellers.approved.password,
    });
    await buyer.post('/auth/login', {
      email: fixture.buyer.email,
      password: fixture.buyer.password,
    });
    await stranger.post('/auth/login', {
      email: fixture.sellers.otherApproved.email,
      password: fixture.sellers.otherApproved.password,
    });
    expect((await owner.delete(`/products/${product.id}`)).status).toBe(204);
    const order = await buyer.get('/orders/orderdelet1');
    expect(order.status).toBe(200);
    expect(await order.json()).toMatchObject({
      workTitle: 'Snapshot title',
      coverImageUrl: `/api/images/${image.id}`,
    });
    for (const participant of [owner, buyer]) {
      const response = await participant.get(`/images/${image.id}`);
      expect(response.status).toBe(200);
      expect(response.headers.get('cache-control')).toContain('private');
      expect(Buffer.from(await response.arrayBuffer())).toEqual(
        Buffer.from(image.data),
      );
      expect(
        (await participant.get(`/images/${image.id}?source=true`)).status,
      ).toBe(404);
    }
    expect((await guest.get(`/images/${image.id}`)).status).toBe(404);
    expect((await stranger.get(`/images/${image.id}`)).status).toBe(404);
    expect((await admin.get(`/images/${image.id}`)).status).toBe(404);
    expect((await buyer.get(`/images/${otherImage.id}`)).status).toBe(404);
  });

  it.each(['save', 'submit', 'upload', 'moderate', 'listing'] as const)(
    'serializes deletion before a concurrent %s writer',
    async (action) => {
      const fixture = await createPermissionFixture(prisma);
      const owner = new HttpTestClient(http.baseUrl);
      await owner.post('/auth/login', {
        email: fixture.sellers.approved.email,
        password: fixture.sellers.approved.password,
      });
      const id =
        action === 'listing'
          ? fixture.approvedProductId
          : fixture.approvedDraftProductId;
      let decision:
        | Awaited<ReturnType<typeof productModerationRequest>>
        | undefined;
      const admin = new HttpTestClient(http.baseUrl);
      if (action === 'moderate') {
        const product = await prisma.product.findUniqueOrThrow({
          where: { id },
        });
        await prisma.product.update({
          where: { id },
          data: { status: 'PENDING_REVIEW' },
        });
        await prisma.productRevision.update({
          where: { id: product.editingRevisionId! },
          data: { status: 'PENDING_REVIEW' },
        });
        decision = await productModerationRequest(prisma, id, 'APPROVED');
        await prisma.user.create({
          data: {
            email: 'race.admin@wave3.test',
            passwordHash: fixturePasswordHash,
            displayName: 'Admin',
            role: 'admin',
          },
        });
        await admin.post('/auth/login', {
          email: 'race.admin@wave3.test',
          password: fixture.sellers.approved.password,
        });
      }
      let acquired!: () => void;
      let release!: () => void;
      const ready = new Promise<void>((resolve) => {
        acquired = resolve;
      });
      const released = new Promise<void>((resolve) => {
        release = resolve;
      });
      const blocker = prisma.$transaction(
        async (tx) => {
          await tx.$queryRaw`SELECT id FROM products WHERE id = ${id}::uuid FOR UPDATE`;
          acquired();
          await released;
        },
        { timeout: 15_000 },
      );
      await ready;
      const waitForLocks = async (minimum: number) => {
        for (let attempt = 0; attempt < 100; attempt++) {
          const rows = await prisma.$queryRaw<Array<{ count: bigint }>>`
            SELECT count(*) AS count FROM pg_stat_activity
            WHERE datname = current_database() AND wait_event_type = 'Lock'
          `;
          if (Number(rows[0]?.count) >= minimum) return;
          await new Promise((resolve) => setTimeout(resolve, 20));
        }
        throw new Error('Expected product lock waiters were not observed');
      };
      try {
        const deletion = owner.delete(`/products/${id}`);
        await waitForLocks(1);
        const form = new FormData();
        form.append(
          'images',
          new Blob([permissionImage], { type: 'image/png' }),
          'photo.png',
        );
        const writer =
          action === 'save'
            ? owner.patch(`/products/${id}`, { title: 'late save' })
            : action === 'submit'
              ? owner.post(`/products/${id}/submit`)
              : action === 'upload'
                ? owner.post(`/products/${id}/images`, form)
                : action === 'listing'
                  ? owner.post(`/works/${id}/listings`, {
                      type: 'FIXED',
                      currency: 'BYN',
                      priceMinor: 1500,
                      startsAt: new Date(Date.now() - 1000).toISOString(),
                    })
                  : admin.patch(`/admin/products/${id}/status`, decision!);
        await waitForLocks(2);
        release();
        expect((await deletion).status).toBe(204);
        expect([404, 409]).toContain((await writer).status);
        const product = await prisma.product.findUniqueOrThrow({
          where: { id },
        });
        expect(product.deletedAt).not.toBeNull();
        expect(product.title).not.toBe('late save');
        if (action !== 'listing') expect(product.status).not.toBe('APPROVED');
        expect(
          await prisma.listing.count({
            where: { productId: id, status: { in: ['LIVE', 'SCHEDULED'] } },
          }),
        ).toBe(0);
      } finally {
        release();
        await blocker;
      }
    },
  );

  it('requires a session and hides ownership while allowing suspended and unverified owners', async () => {
    const fixture = await createPermissionFixture(prisma);
    const guest = new HttpTestClient(http.baseUrl);
    const stranger = new HttpTestClient(http.baseUrl);
    const suspended = new HttpTestClient(http.baseUrl);
    const owner = new HttpTestClient(http.baseUrl);
    await stranger.post('/auth/login', {
      email: fixture.sellers.otherApproved.email,
      password: fixture.sellers.otherApproved.password,
    });
    await suspended.post('/auth/login', {
      email: fixture.sellers.suspended.email,
      password: fixture.sellers.suspended.password,
    });
    await owner.post('/auth/login', {
      email: fixture.sellers.approved.email,
      password: fixture.sellers.approved.password,
    });
    await prisma.user.update({
      where: { id: fixture.sellers.approved.id },
      data: { emailVerifiedAt: null },
    });
    expect(
      (await guest.delete(`/products/${fixture.approvedDraftProductId}`))
        .status,
    ).toBe(401);
    expect(
      (await stranger.delete(`/products/${fixture.approvedDraftProductId}`))
        .status,
    ).toBe(404);
    expect(
      (await stranger.delete('/products/00000000-0000-4000-8000-000000000000'))
        .status,
    ).toBe(404);
    expect(
      (
        await suspended.delete(
          `/products/${fixture.sellers.suspended.productId}`,
        )
      ).status,
    ).toBe(204);
    expect(
      (await owner.delete(`/products/${fixture.approvedDraftProductId}`))
        .status,
    ).toBe(204);
  });

  it.each(['SCHEDULED', 'LIVE'] as const)(
    'refuses deletion while a listing is %s',
    async (status) => {
      const fixture = await createPermissionFixture(prisma);
      const owner = new HttpTestClient(http.baseUrl);
      await owner.post('/auth/login', {
        email: fixture.sellers.approved.email,
        password: fixture.sellers.approved.password,
      });
      await prisma.listing.update({
        where: { id: fixture.approvedListingId },
        data: { status },
      });
      const response = await owner.delete(
        `/products/${fixture.approvedProductId}`,
      );
      expect(response.status).toBe(409);
      expect(await response.json()).toMatchObject({ code: 'PRODUCT_IN_SALE' });
      expect(
        (
          await prisma.product.findUniqueOrThrow({
            where: { id: fixture.approvedProductId },
          })
        ).deletedAt,
      ).toBeNull();
    },
  );

  it.each(['OFFERED', 'ACTIVE'] as const)(
    'refuses deletion while an order is %s',
    async (status) => {
      const fixture = await createPermissionFixture(prisma);
      const owner = new HttpTestClient(http.baseUrl);
      await owner.post('/auth/login', {
        email: fixture.sellers.approved.email,
        password: fixture.sellers.approved.password,
      });
      const product = await prisma.product.findUniqueOrThrow({
        where: { id: fixture.approvedProductId },
      });
      await prisma.order.create({
        data: {
          publicId: 'orderdelet1',
          dealCode: '123456',
          productId: product.id,
          listingId: fixture.approvedListingId,
          sellerUserId: fixture.sellers.approved.id,
          buyerUserId: fixture.buyer.id,
          source: 'FIXED_PURCHASE',
          amountMinor: 1500,
          currency: 'BYN',
          status,
          workTitleSnapshot: 'Snapshot title',
          workPublicIdSnapshot: product.publicId,
          sellerNameSnapshot: 'Seller',
        },
      });
      const response = await owner.delete(`/products/${product.id}`);
      expect(response.status).toBe(409);
      expect(await response.json()).toMatchObject({ code: 'PRODUCT_IN_SALE' });
      expect(
        (await prisma.product.findUniqueOrThrow({ where: { id: product.id } }))
          .deletedAt,
      ).toBeNull();
    },
  );

  it('removes the work from public and active moderation reads while preserving audit history', async () => {
    const fixture = await createPermissionFixture(prisma);
    const product = await prisma.product.findUniqueOrThrow({
      where: { id: fixture.approvedProductId },
    });
    const owner = new HttpTestClient(http.baseUrl);
    const guest = new HttpTestClient(http.baseUrl);
    const admin = new HttpTestClient(http.baseUrl);
    await owner.post('/auth/login', {
      email: fixture.sellers.approved.email,
      password: fixture.sellers.approved.password,
    });
    await prisma.user.create({
      data: {
        email: 'reads.admin@wave3.test',
        passwordHash: fixturePasswordHash,
        displayName: 'Admin',
        role: 'admin',
      },
    });
    await admin.post('/auth/login', {
      email: 'reads.admin@wave3.test',
      password: fixture.sellers.approved.password,
    });
    await prisma.curatorSelection.create({
      data: {
        slot: 'home',
        productId: product.id,
        curatorSellerProfileId: fixture.sellers.otherApproved.profileId,
        selectedAt: new Date(),
      },
    });
    expect((await guest.get(`/works/${product.publicId}`)).status).toBe(200);
    expect(
      JSON.stringify(
        await (
          await admin.get('/admin/products/summary?filter=ALL&limit=100')
        ).json(),
      ),
    ).toContain(product.id);
    await prisma.auditEvent.create({ data: {
      targetType: 'PRODUCT', targetId: product.id, action: 'DECISION', newStatus: 'APPROVED',
    } });
    const before = (await (
      await admin.get('/admin/analytics/overview?period=7d')
    ).json()) as { overview: { publishedWorks: { value: number } }; sellerFunnel: { productsApproved: { value: number } } };
    expect((await owner.delete(`/products/${product.id}`)).status).toBe(204);
    expect((await guest.get(`/works/${product.publicId}`)).status).toBe(404);
    for (const path of [
      '/works?limit=100',
      '/portfolio/home',
      '/portfolio/facets',
      '/admin/products?limit=100',
      '/admin/products/summary?filter=ALL&limit=100',
    ]) {
      const response = await (path.startsWith('/admin') ? admin : guest).get(
        path,
      );
      expect(response.status).toBe(200);
      expect(JSON.stringify(await response.json())).not.toContain(product.id);
      expect(
        JSON.stringify(
          await (
            await (path.startsWith('/admin') ? admin : guest).get(path)
          ).json(),
        ),
      ).not.toContain(product.publicId);
    }
    expect(
      await prisma.curatorSelection.findUnique({ where: { slot: 'home' } }),
    ).toBeNull();
    expect((await admin.get(`/admin/products/${product.id}`)).status).toBe(404);
    const after = (await (
      await admin.get('/admin/analytics/overview?period=7d')
    ).json()) as { overview: { publishedWorks: { value: number } }; sellerFunnel: { productsApproved: { value: number } } };
    expect(after.sellerFunnel.productsApproved.value).toBe(before.sellerFunnel.productsApproved.value - 1);
    expect(await prisma.auditEvent.count({ where: { targetId: product.id, newStatus: 'APPROVED' } })).toBe(1);
    expect(after.overview.publishedWorks.value).toBe(
      before.overview.publishedWorks.value - 1,
    );
    const history = await admin.get(`/admin/products/${product.id}/history`);
    expect(history.status).toBe(200);
    expect(JSON.stringify(await history.json())).toContain('DELETE');
  });
  it('does not create a second-chance offer for a deleted work', async () => {
    const fixture = await createPermissionFixture(prisma);
    const owner = new HttpTestClient(http.baseUrl);
    await owner.post('/auth/login', { email: fixture.sellers.approved.email, password: fixture.sellers.approved.password });
    const product = await prisma.product.findUniqueOrThrow({ where: { id: fixture.approvedProductId } });
    await prisma.order.create({ data: {
      publicId: 'orderdelet1', dealCode: '123456', productId: product.id, listingId: fixture.approvedListingId,
      sellerUserId: fixture.sellers.approved.id, buyerUserId: fixture.buyer.id, source: 'AUCTION_WIN',
      amountMinor: 1500, currency: 'BYN', status: 'FAILED', failReason: 'BUYER_REFUSED', faultSide: 'BUYER',
      workTitleSnapshot: 'Snapshot title', workPublicIdSnapshot: product.publicId, sellerNameSnapshot: 'Seller',
    } });
    expect((await owner.delete(`/products/${product.id}`)).status).toBe(204);
    expect((await owner.post('/orders/orderdelet1/offer-next')).status).toBe(404);
    expect(await prisma.order.count({ where: { productId: product.id } })).toBe(1);
  });

  it('retains an admin order outcome without restoring the deleted work to sale', async () => {
    const fixture = await createPermissionFixture(prisma);
    const owner = new HttpTestClient(http.baseUrl);
    const admin = new HttpTestClient(http.baseUrl);
    await owner.post('/auth/login', { email: fixture.sellers.approved.email, password: fixture.sellers.approved.password });
    await prisma.user.create({ data: { email: 'outcome.admin@wave3.test', passwordHash: fixturePasswordHash, displayName: 'Admin', role: 'admin', emailVerifiedAt: new Date() } });
    await admin.post('/auth/login', { email: 'outcome.admin@wave3.test', password: fixture.sellers.approved.password });
    const product = await prisma.product.findUniqueOrThrow({ where: { id: fixture.approvedProductId } });
    await prisma.listing.update({ where: { id: fixture.approvedListingId }, data: { type: 'FIXED', status: 'ENDED' } });
    await prisma.order.create({ data: {
      publicId: 'orderdelet1', dealCode: '123456', productId: product.id, listingId: fixture.approvedListingId,
      sellerUserId: fixture.sellers.approved.id, buyerUserId: fixture.buyer.id, source: 'FIXED_PURCHASE',
      amountMinor: 1500, currency: 'BYN', status: 'COMPLETED', workTitleSnapshot: 'Snapshot title',
      workPublicIdSnapshot: product.publicId, sellerNameSnapshot: 'Seller',
    } });
    expect((await owner.delete(`/products/${product.id}`)).status).toBe(204);
    const response = await admin.post('/admin/orders/orderdelet1/outcome', { to: 'FAILED', failReason: 'ADMIN_CANCELLED', reason: 'Correct outcome' });
    expect(response.status).toBe(200);
    expect((await prisma.order.findUniqueOrThrow({ where: { publicId: 'orderdelet1' } })).status).toBe('FAILED');
    expect((await prisma.listing.findUniqueOrThrow({ where: { id: fixture.approvedListingId } })).status).toBe('ENDED');
    expect((await prisma.product.findUniqueOrThrow({ where: { id: product.id } })).deletedAt).not.toBeNull();
  });

});
