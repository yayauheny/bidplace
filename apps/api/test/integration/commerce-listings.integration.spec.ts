import { randomUUID } from 'node:crypto';

import { type PrismaClient } from '@bidplace/database';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import {
  createHttpTestApp,
  HttpTestClient,
  type HttpTestApp,
} from './http-test-app';
import {
  createPermissionFixture,
  fixturePasswordHash,
  resetPermissionFixture,
  type PermissionFixture,
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

afterEach(async () => {
  await prisma.notificationOutbox.deleteMany();
  await prisma.purchaseHold.deleteMany();
  await resetPermissionFixture(prisma);
});

afterAll(async () => {
  await http?.close();
  await database?.cleanup();
});

const DAY_MS = 24 * 60 * 60 * 1000;

async function databaseNow(): Promise<Date> {
  const [row] = await prisma.$queryRaw<Array<{ now: Date }>>`
    SELECT clock_timestamp() AS now
  `;
  return row!.now;
}

async function login(client: HttpTestClient, email: string, password: string) {
  const response = await client.post('/auth/login', { email, password });
  expect(response.status).toBe(201);
}

let clientSerial = 0;

function ownerClient() {
  clientSerial += 1;
  return new HttpTestClient(
    http.baseUrl,
    'http://localhost:8081',
    `198.51.100.${clientSerial}`,
  );
}

async function waitForProductLock(): Promise<void> {
  const started = Date.now();
  while (Date.now() - started < 5_000) {
    const [row] = await prisma.$queryRaw<Array<{ waiting: boolean }>>`
      SELECT EXISTS (
        SELECT 1
        FROM pg_locks l
        JOIN pg_class c ON c.oid = l.relation
        JOIN pg_stat_activity a ON a.pid = l.pid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'products'
          AND n.nspname = current_schema()
          AND a.wait_event_type = 'Lock'
      ) AS waiting
    `;
    if (row?.waiting) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error('request did not wait on the product lock');
}

async function signedInOwner(fixture: PermissionFixture) {
  const client = ownerClient();
  await login(
    client,
    fixture.sellers.approved.email,
    fixture.sellers.approved.password,
  );
  return client;
}

async function publishedWork(fixture: PermissionFixture) {
  return prisma.product.findUniqueOrThrow({
    where: { id: fixture.approvedProductId },
    select: { id: true, publicId: true, title: true },
  });
}

function fixedBody(now: Date, contactWindowHours?: number) {
  return {
    type: 'FIXED' as const,
    currency: 'BYN' as const,
    priceMinor: 1_500,
    startsAt: new Date(now.getTime() - 1_000).toISOString(),
    ...(contactWindowHours === undefined ? {} : { contactWindowHours }),
  };
}

function auctionBody(startsAt: Date, contactWindowHours?: number) {
  return {
    type: 'AUCTION' as const,
    currency: 'BYN' as const,
    startPriceMinor: 1_000,
    startsAt: startsAt.toISOString(),
    endsAt: new Date(startsAt.getTime() + 2 * DAY_MS).toISOString(),
    ...(contactWindowHours === undefined ? {} : { contactWindowHours }),
  };
}

async function errorBody(response: Response) {
  return response.json() as Promise<{ code?: string; message?: string }>;
}

async function insertEndedListing(
  productId: string,
  sellerUserId: string,
) {
  const startsAt = new Date('2026-09-01T10:00:00.000Z');
  const endsAt = new Date('2026-09-03T10:00:00.000Z');
  return prisma.listing.create({
    data: {
      productId,
      sellerUserId,
      type: 'AUCTION',
      status: 'ENDED',
      currency: 'BYN',
      startsAt,
      endsAt,
      originalEndsAt: endsAt,
      currentPriceMinor: 1_000,
      endedAt: endsAt,
      auctionRules: {
        create: { startPriceMinor: 1_000, stepTableCode: 'BYN_V1' },
      },
    },
  });
}

async function insertOrder(
  fixture: PermissionFixture,
  listingId: string,
  product: { id: string; publicId: string },
  status: 'ACTIVE' | 'COMPLETED' | 'FAILED',
) {
  await prisma.order.create({
    data: {
      publicId: `o${randomUUID().replace(/-/g, '').slice(0, 15)}`,
      dealCode: 'ORD001',
      productId: product.id,
      listingId,
      sellerUserId: fixture.sellers.approved.id,
      buyerUserId: fixture.buyer.id,
      source: 'FIXED_PURCHASE',
      amountMinor: 1_500,
      currency: 'BYN',
      status,
      workTitleSnapshot: 'Approved owner listing product',
      workPublicIdSnapshot: product.publicId,
      sellerNameSnapshot: 'Wave 3 APPROVED',
    },
  });
}

describe('listing creation', () => {
  it.each([
    {
      reason: 'another author',
      status: 403,
      code: 'forbidden',
      message: 'Product is not owned by user',
    },
    {
      reason: 'a hidden work',
      status: 409,
      code: 'PRODUCT_STATE_CONFLICT',
      message: 'Product is not published',
    },
    {
      reason: 'an unapproved author',
      status: 403,
      code: 'forbidden',
      message: 'Approved SellerProfile is required',
    },
    {
      reason: 'an unverified email',
      status: 403,
      code: 'forbidden',
      message: 'Email verification is required',
    },
    {
      reason: 'an existing listing',
      status: 409,
      code: 'PRODUCT_IN_SALE',
      message: 'Product is in sale',
    },
    {
      reason: 'an open order',
      status: 409,
      code: 'PRODUCT_IN_SALE',
      message: 'Product is in sale',
    },
    {
      reason: 'a sold work',
      status: 409,
      code: 'PRODUCT_ALREADY_SOLD',
      message: 'Product is already sold',
    },
  ])(
    'rejects $reason',
    async ({ reason, status, code, message }) => {
      const fixture = await createPermissionFixture(prisma);
      const product = await publishedWork(fixture);
      const client = await signedInOwner(fixture);
      const now = await databaseNow();

      if (reason === 'another author') {
        const other = ownerClient();
        await login(
          other,
          fixture.sellers.otherApproved.email,
          fixture.sellers.otherApproved.password,
        );
        const response = await other.post(
          `/works/${product.id}/listings`,
          fixedBody(now),
        );
        expect(response.status).toBe(status);
        expect(await errorBody(response)).toMatchObject({ code, message });
        return;
      }

      if (reason === 'a hidden work') {
        await prisma.product.update({
          where: { id: product.id },
          data: { status: 'ARCHIVED' },
        });
      }
      if (reason === 'an unapproved author') {
        await prisma.sellerProfile.update({
          where: { id: fixture.sellers.approved.profileId },
          data: { status: 'PENDING_REVIEW' },
        });
      }
      if (reason === 'an unverified email') {
        await prisma.user.update({
          where: { id: fixture.sellers.approved.id },
          data: { emailVerifiedAt: null },
        });
      }
      if (reason === 'an existing listing') {
        const created = await client.post(
          `/works/${product.id}/listings`,
          fixedBody(now),
        );
        expect(created.status).toBe(201);
      }
      if (reason === 'an open order' || reason === 'a sold work') {
        const listing = await insertEndedListing(
          product.id,
          fixture.sellers.approved.id,
        );
        await insertOrder(
          fixture,
          listing.id,
          product,
          reason === 'a sold work' ? 'COMPLETED' : 'ACTIVE',
        );
      }

      const response = await client.post(
        `/works/${product.id}/listings`,
        fixedBody(await databaseNow()),
      );
      expect(response.status).toBe(status);
      expect(await errorBody(response)).toMatchObject({ code, message });
    },
  );

  it('re-reads author approval under the product lock', async () => {
    const fixture = await createPermissionFixture(prisma);
    const product = await publishedWork(fixture);
    const client = await signedInOwner(fixture);
    let release!: () => void;
    const released = new Promise<void>((resolve) => {
      release = resolve;
    });
    let acquired!: () => void;
    const ready = new Promise<void>((resolve) => {
      acquired = resolve;
    });
    const holder = prisma.$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT id FROM products WHERE id = ${product.id}::uuid FOR UPDATE`;
        acquired();
        await released;
        await tx.sellerProfile.update({
          where: { id: fixture.sellers.approved.profileId },
          data: { status: 'PENDING_REVIEW' },
        });
      },
      { timeout: 15_000 },
    );
    await ready;
    const pending = client.post(
      `/works/${product.id}/listings`,
      fixedBody(await databaseNow()),
    );
    await waitForProductLock();
    release();
    const response = await pending;
    await holder;
    expect(response.status).toBe(403);
    expect(await errorBody(response)).toMatchObject({
      code: 'forbidden',
      message: 'Approved SellerProfile is required',
    });
    expect(
      await prisma.listing.count({
        where: {
          productId: product.id,
          status: { in: ['SCHEDULED', 'LIVE'] },
        },
      }),
    ).toBe(0);
  });

  it('creates a fixed listing and an auction now or on a schedule', async () => {
    const fixture = await createPermissionFixture(prisma);
    const product = await publishedWork(fixture);
    const client = await signedInOwner(fixture);
    const now = await databaseNow();
    const before = await (
      await ownerClient().get(`/works/${product.publicId}`)
    ).json();

    const fixed = await client.post(
      `/works/${product.id}/listings`,
      fixedBody(now),
    );
    expect(fixed.status).toBe(201);
    const fixedBodyJson = (await fixed.json()) as { id: string; status: string };
    expect(fixedBodyJson.status).toBe('LIVE');
    const fixedRow = await prisma.listing.findUniqueOrThrow({
      where: { id: fixedBodyJson.id },
    });
    expect(fixedRow).toMatchObject({
      type: 'FIXED',
      status: 'LIVE',
      priceMinor: 1_500,
      contactWindowHours: 24,
      endsAt: null,
    });
    expect(fixedRow.startsAt.getTime()).toBeGreaterThanOrEqual(now.getTime() - 5_000);

    await client.post(`/listings/${fixedRow.id}/cancel`);
    const chosen = await client.post(
      `/works/${product.id}/listings`,
      fixedBody(await databaseNow(), 48),
    );
    expect(chosen.status).toBe(201);
    const chosenId = ((await chosen.json()) as { id: string }).id;
    expect(
      await prisma.listing.findUniqueOrThrow({ where: { id: chosenId } }),
    ).toMatchObject({ contactWindowHours: 48 });
    await client.post(`/listings/${chosenId}/cancel`);

    const immediateAuction = await client.post(
      `/works/${product.id}/listings`,
      auctionBody(new Date((await databaseNow()).getTime() - 1_000)),
    );
    expect(immediateAuction.status).toBe(201);
    const immediate = (await immediateAuction.json()) as { id: string; status: string };
    expect(immediate.status).toBe('LIVE');
    await client.post(`/listings/${immediate.id}/cancel`);

    const dbNow = await databaseNow();
    const scheduledStart = new Date(dbNow.getTime() + 60 * 60 * 1000);
    const scheduled = await client.post(
      `/works/${product.id}/listings`,
      auctionBody(scheduledStart),
    );
    expect(scheduled.status).toBe(201);
    const scheduledBody = (await scheduled.json()) as { id: string; status: string };
    expect(scheduledBody.status).toBe('SCHEDULED');
    const scheduledRow = await prisma.listing.findUniqueOrThrow({
      where: { id: scheduledBody.id },
    });
    expect(scheduledRow.startsAt.toISOString()).toBe(scheduledStart.toISOString());

    const tooFar = new Date(dbNow.getTime() + 31 * DAY_MS);
    const rejected = await client.post(`/works/${product.id}/listings`, {
      ...auctionBody(tooFar),
      endsAt: new Date(tooFar.getTime() + 2 * DAY_MS).toISOString(),
    });
    expect(rejected.status).toBe(400);
    expect(await errorBody(rejected)).toMatchObject({
      code: 'validation_error',
    });

    const after = await (
      await ownerClient().get(`/works/${product.publicId}`)
    ).json();
    expect(after).toEqual(before);
    expect(JSON.stringify(after)).not.toContain(scheduledBody.id);
  });

  it('lets exactly one of two parallel creates succeed', async () => {
    const fixture = await createPermissionFixture(prisma);
    const product = await publishedWork(fixture);
    const client = await signedInOwner(fixture);
    const body = fixedBody(await databaseNow());
    const [first, second] = await Promise.all([
      client.post(`/works/${product.id}/listings`, body),
      client.post(`/works/${product.id}/listings`, body),
    ]);
    const responses = [first, second].sort((left, right) => left.status - right.status);
    expect(responses.map((response) => response.status)).toEqual([201, 409]);
    expect(await errorBody(responses[1]!)).toMatchObject({
      code: 'PRODUCT_IN_SALE',
    });
    expect(
      await prisma.listing.count({
        where: {
          productId: product.id,
          status: { in: ['SCHEDULED', 'LIVE'] },
        },
      }),
    ).toBe(1);
  });
});

describe('listing withdrawal', () => {
  it('lets the author withdraw a fixed listing and an auction with no bids', async () => {
    const fixture = await createPermissionFixture(prisma);
    const product = await publishedWork(fixture);
    const client = await signedInOwner(fixture);
    const now = await databaseNow();
    const fixed = (await (
      await client.post(`/works/${product.id}/listings`, fixedBody(now))
    ).json()) as { id: string };
    const withdrawn = await client.post(`/listings/${fixed.id}/cancel`);
    expect(withdrawn.status).toBe(201);
    expect(
      await prisma.listing.findUniqueOrThrow({ where: { id: fixed.id } }),
    ).toMatchObject({
      status: 'CANCELLED',
      cancelReason: 'AUTHOR_WITHDREW',
    });
    expect(
      (
        await prisma.listing.findUniqueOrThrow({ where: { id: fixed.id } })
      ).cancelledAt,
    ).toBeInstanceOf(Date);

    const auction = (await (
      await client.post(
        `/works/${product.id}/listings`,
        auctionBody(new Date((await databaseNow()).getTime() - 1_000)),
      )
    ).json()) as { id: string };
    expect((await client.post(`/listings/${auction.id}/cancel`)).status).toBe(201);
    expect(
      await prisma.listing.findUniqueOrThrow({ where: { id: auction.id } }),
    ).toMatchObject({ status: 'CANCELLED', cancelReason: 'AUTHOR_WITHDREW' });
  });

  it('refuses an auction that already has a bid and lets an admin remove it', async () => {
    const fixture = await createPermissionFixture(prisma);
    const product = await publishedWork(fixture);
    const client = await signedInOwner(fixture);
    const created = (await (
      await client.post(
        `/works/${product.id}/listings`,
        auctionBody(new Date((await databaseNow()).getTime() - 1_000)),
      )
    ).json()) as { id: string };
    await prisma.bid.create({
      data: {
        listingId: created.id,
        bidderUserId: fixture.buyer.id,
        amountMinor: 1_000,
        idempotencyKey: 'bid-key-01',
      },
    });
    await prisma.listing.update({
      where: { id: created.id },
      data: { bidCount: 1, currentPriceMinor: 1_000 },
    });

    const refused = await client.post(`/listings/${created.id}/cancel`);
    expect(refused.status).toBe(409);
    expect(await errorBody(refused)).toMatchObject({ code: 'conflict' });
    expect(
      await prisma.listing.findUniqueOrThrow({ where: { id: created.id } }),
    ).toMatchObject({ status: 'LIVE' });

    const admin = ownerClient();
    const adminUser = await prisma.user.create({
      data: {
        email: `admin.${randomUUID().slice(0, 8)}@wave3.test`,
        passwordHash: fixturePasswordHash,
        displayName: 'Listing admin',
        role: 'admin',
        emailVerifiedAt: new Date('2026-09-01T00:00:00.000Z'),
      },
    });
    await login(admin, adminUser.email, fixture.sellers.approved.password);
    const removed = await admin.post(`/admin/listings/${created.id}/remove`, {
      reason: 'Stop this auction',
    });
    expect(removed.status).toBe(201);
    expect(
      await prisma.listing.findUniqueOrThrow({ where: { id: created.id } }),
    ).toMatchObject({
      status: 'CANCELLED',
      cancelReason: 'ADMIN_REMOVED',
    });
    expect(await prisma.order.count({ where: { listingId: created.id } })).toBe(0);
    const audit = await prisma.auditEvent.findFirstOrThrow({
      where: { targetType: 'LISTING', targetId: created.id },
    });
    expect(audit).toMatchObject({
      actorUserId: adminUser.id,
      oldStatus: 'LIVE',
      newStatus: 'CANCELLED',
      reason: 'Stop this auction',
      action: 'ADMIN_REMOVED',
    });
    const letters = await prisma.notificationOutbox.findMany({
      where: { kind: 'LISTING_REMOVED' },
    });
    expect(letters.map((letter) => letter.userId).sort()).toEqual(
      [fixture.buyer.id, fixture.sellers.approved.id].sort(),
    );
    expect(JSON.stringify(letters)).not.toContain('@');
  });

  it('keeps a listing that the tick ends while the author is waiting for the lock', async () => {
    const fixture = await createPermissionFixture(prisma);
    const product = await publishedWork(fixture);
    const client = await signedInOwner(fixture);
    const created = (await (
      await client.post(
        `/works/${product.id}/listings`,
        fixedBody(await databaseNow()),
      )
    ).json()) as { id: string };
    let release!: () => void;
    const released = new Promise<void>((resolve) => {
      release = resolve;
    });
    let acquired!: () => void;
    const ready = new Promise<void>((resolve) => {
      acquired = resolve;
    });
    const holder = prisma.$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT id FROM products WHERE id = ${product.id}::uuid FOR UPDATE`;
        acquired();
        await released;
        await tx.listing.updateMany({
          where: { id: created.id, status: { in: ['SCHEDULED', 'LIVE'] } },
          data: { status: 'ENDED', endedAt: new Date('2026-10-30T12:00:00.000Z') },
        });
      },
      { timeout: 15_000 },
    );
    await ready;
    const pending = client.post(`/listings/${created.id}/cancel`);
    await waitForProductLock();
    release();
    const response = await pending;
    await holder;
    expect(response.status).toBe(409);
    expect(
      await prisma.listing.findUniqueOrThrow({ where: { id: created.id } }),
    ).toMatchObject({ status: 'ENDED' });
  });

  it('lets the author withdraw a live zero-bid auction after endsAt', async () => {
    const fixture = await createPermissionFixture(prisma);
    const product = await publishedWork(fixture);
    const client = await signedInOwner(fixture);
    const created = (await (
      await client.post(
        `/works/${product.id}/listings`,
        auctionBody(new Date((await databaseNow()).getTime() - 1_000)),
      )
    ).json()) as { id: string };
    const pastEnd = new Date((await databaseNow()).getTime() - 60_000);
    await prisma.listing.update({
      where: { id: created.id },
      data: { endsAt: pastEnd, status: 'LIVE', bidCount: 0 },
    });

    const withdrawn = await client.post(`/listings/${created.id}/cancel`);
    expect(withdrawn.status).toBe(201);
    expect(
      await prisma.listing.findUniqueOrThrow({ where: { id: created.id } }),
    ).toMatchObject({
      status: 'CANCELLED',
      cancelReason: 'AUTHOR_WITHDREW',
      bidCount: 0,
    });
    expect(await prisma.order.count({ where: { listingId: created.id } })).toBe(0);
  });
});

describe('public lot', () => {
  it('returns no-store lot state, marks, and viewer blocks without touching the work', async () => {
    const fixture = await createPermissionFixture(prisma);
    const product = await publishedWork(fixture);
    const guest = ownerClient();
    const missing = await guest.get(`/works/${product.publicId}/lot`);
    expect(missing.status).toBe(200);
    expect(await missing.json()).toBeNull();
    expect(missing.headers.get('cache-control')).toBe('no-store');

    const client = await signedInOwner(fixture);
    const now = await databaseNow();
    const fixed = (await (
      await client.post(`/works/${product.id}/listings`, fixedBody(now, 6))
    ).json()) as { id: string };
    const workBefore = await (
      await guest.get(`/works/${product.publicId}`)
    ).json();

    const live = await guest.get(`/works/${product.publicId}/lot`);
    expect(live.headers.get('cache-control')).toBe('no-store');
    const liveBody = (await live.json()) as {
      id: string;
      effectiveStatus: string;
      mark: string;
      priceMinor: number;
      minimumBidMinor: number | null;
      contactWindowHours: number;
      viewer: unknown;
      serverNow: string;
    };
    expect(liveBody).toMatchObject({
      id: fixed.id,
      type: 'FIXED',
      effectiveStatus: 'LIVE',
      mark: 'BUY',
      priceMinor: 1_500,
      minimumBidMinor: null,
      bidCount: 0,
      contactWindowHours: 6,
      viewer: null,
      endsAt: null,
    });
    expect(liveBody.serverNow).toEqual(expect.any(String));
    expect(JSON.stringify(workBefore)).not.toContain(fixed.id);
    expect(JSON.stringify(workBefore)).not.toContain('contactWindowHours');

    const buyer = ownerClient();
    await login(buyer, fixture.buyer.email, fixture.buyer.password);
    const buyerLot = (await (
      await buyer.get(`/works/${product.publicId}/lot`)
    ).json()) as {
      viewer: { role: string; isLeading: boolean; blockedReason: string | null };
    };
    expect(buyerLot.viewer).toMatchObject({
      role: 'buyer',
      isLeading: false,
      blockedReason: null,
    });

    const sellerLot = (await (
      await client.get(`/works/${product.publicId}/lot`)
    ).json()) as { viewer: { role: string; blockedReason: string | null } };
    expect(sellerLot.viewer).toMatchObject({
      role: 'seller',
      blockedReason: 'SELF_BID_FORBIDDEN',
    });

    await client.post(`/listings/${fixed.id}/cancel`);
    const scheduledStart = new Date((await databaseNow()).getTime() + 60 * 60 * 1000);
    const scheduled = (await (
      await client.post(`/works/${product.id}/listings`, auctionBody(scheduledStart))
    ).json()) as { id: string };
    const scheduledLot = (await (
      await buyer.get(`/works/${product.publicId}/lot`)
    ).json()) as {
      effectiveStatus: string;
      mark: string;
      viewer: { blockedReason: string | null };
    };
    expect(scheduledLot).toMatchObject({
      effectiveStatus: 'SCHEDULED',
      mark: 'SCHEDULED',
    });
    expect(scheduledLot.viewer.blockedReason).toBe('LISTING_NOT_OPEN');

    const { CommerceGuards } = await import('../../src/commerce/commerce-guards');
    const listing = await prisma.listing.findUniqueOrThrow({
      where: { id: scheduled.id },
    });
    await prisma.$transaction(async (tx) => {
      await expect(
        http.app.get(CommerceGuards).assertBuyerEligible(tx, {
          userId: fixture.buyer.id,
          listing,
        }),
      ).rejects.toMatchObject({ apiCode: 'LISTING_NOT_OPEN', status: 409 });
    });
    await client.post(`/listings/${scheduled.id}/cancel`);
  });

  it.each([
    ['SELF_BID_FORBIDDEN', 'seller'],
    ['ADMIN_BID_FORBIDDEN', 'admin'],
    ['BUYER_BLOCKED', 'held'],
    ['EMAIL_VERIFICATION_REQUIRED', 'unverified'],
    ['BID_ALREADY_LEADING', 'leader'],
  ] as const)(
    'reports viewer.blockedReason %s',
    async (code, kind) => {
      const fixture = await createPermissionFixture(prisma);
      const product = await publishedWork(fixture);
      const client = await signedInOwner(fixture);
      const created = (await (
        await client.post(
          `/works/${product.id}/listings`,
          auctionBody(new Date((await databaseNow()).getTime() - 1_000)),
        )
      ).json()) as { id: string };
      const viewer = ownerClient();
      if (kind === 'seller') {
        await login(
          viewer,
          fixture.sellers.approved.email,
          fixture.sellers.approved.password,
        );
      } else if (kind === 'admin') {
        const adminUser = await prisma.user.create({
          data: {
            email: `viewer-admin.${randomUUID().slice(0, 8)}@wave3.test`,
            passwordHash: fixturePasswordHash,
            displayName: 'Viewer admin',
            role: 'admin',
            emailVerifiedAt: new Date('2026-09-01T00:00:00.000Z'),
          },
        });
        await login(viewer, adminUser.email, fixture.sellers.approved.password);
      } else {
        await login(viewer, fixture.buyer.email, fixture.buyer.password);
        if (kind === 'held') {
          await prisma.purchaseHold.create({
            data: { userId: fixture.buyer.id, reason: 'FRAUD_REVIEW' },
          });
        }
        if (kind === 'unverified') {
          await prisma.user.update({
            where: { id: fixture.buyer.id },
            data: { emailVerifiedAt: null },
          });
        }
        if (kind === 'leader') {
          await prisma.bid.create({
            data: {
              listingId: created.id,
              bidderUserId: fixture.buyer.id,
              amountMinor: 1_000,
              idempotencyKey: 'lead-key-01',
            },
          });
          await prisma.listing.update({
            where: { id: created.id },
            data: { bidCount: 1, currentPriceMinor: 1_000 },
          });
        }
      }
      const body = (await (
        await viewer.get(`/works/${product.publicId}/lot`)
      ).json()) as {
        viewer: { blockedReason: string | null; isLeading: boolean };
      };
      expect(body.viewer.blockedReason).toBe(code);
      expect(body.viewer.isLeading).toBe(kind === 'leader');
    },
  );

  it('marks an open order reserved and a completed order sold', async () => {
    const fixture = await createPermissionFixture(prisma);
    const product = await publishedWork(fixture);
    const guest = ownerClient();
    const reservedListing = await insertEndedListing(
      product.id,
      fixture.sellers.approved.id,
    );
    await insertOrder(fixture, reservedListing.id, product, 'ACTIVE');
    expect(await (await guest.get(`/works/${product.publicId}/lot`)).json()).toMatchObject({
      mark: 'RESERVED',
      effectiveStatus: 'ENDED',
    });
    await prisma.order.deleteMany();
    await insertOrder(fixture, reservedListing.id, product, 'COMPLETED');
    expect(await (await guest.get(`/works/${product.publicId}/lot`)).json()).toMatchObject({
      mark: 'SOLD',
    });
    await prisma.order.deleteMany();
    await insertOrder(fixture, reservedListing.id, product, 'FAILED');
    expect(await (await guest.get(`/works/${product.publicId}/lot`)).json()).toBeNull();
  });

  it('refuses to hide a work that has a listing or an open order', async () => {
    const fixture = await createPermissionFixture(prisma);
    const product = await publishedWork(fixture);
    const client = await signedInOwner(fixture);
    const created = (await (
      await client.post(
        `/works/${product.id}/listings`,
        fixedBody(await databaseNow()),
      )
    ).json()) as { id: string };
    const hidden = await client.post(`/products/${product.id}/hide`);
    expect(hidden.status).toBe(409);
    expect(await errorBody(hidden)).toMatchObject({ code: 'PRODUCT_IN_SALE' });
    expect(
      await prisma.product.findUniqueOrThrow({ where: { id: product.id } }),
    ).toMatchObject({ status: 'APPROVED' });
    await prisma.listing.update({
      where: { id: created.id },
      data: { status: 'ENDED', endedAt: new Date('2026-10-30T12:00:00.000Z') },
    });
    await insertOrder(fixture, created.id, product, 'ACTIVE');
    const reserved = await client.post(`/products/${product.id}/hide`);
    expect(reserved.status).toBe(409);
    expect(await errorBody(reserved)).toMatchObject({ code: 'PRODUCT_IN_SALE' });
  });

  it('returns the lot while another transaction holds the viewer row', async () => {
    const fixture = await createPermissionFixture(prisma);
    const product = await publishedWork(fixture);
    const client = await signedInOwner(fixture);
    await client.post(
      `/works/${product.id}/listings`,
      fixedBody(await databaseNow()),
    );
    const buyer = ownerClient();
    await login(buyer, fixture.buyer.email, fixture.buyer.password);
    let release!: () => void;
    const released = new Promise<void>((resolve) => {
      release = resolve;
    });
    let acquired!: () => void;
    const ready = new Promise<void>((resolve) => {
      acquired = resolve;
    });
    const holder = prisma.$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT id FROM users WHERE id = ${fixture.buyer.id}::uuid FOR UPDATE`;
        acquired();
        await released;
      },
      { timeout: 15_000 },
    );
    await ready;
    try {
      const response = await Promise.race([
        buyer.get(`/works/${product.publicId}/lot`),
        new Promise<never>((_, reject) => {
          setTimeout(
            () => reject(new Error('lot waited on the viewer row')),
            1_500,
          );
        }),
      ]);
      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({
        viewer: { role: 'buyer', blockedReason: null },
      });
    } finally {
      release();
      await holder;
    }
  });
});
