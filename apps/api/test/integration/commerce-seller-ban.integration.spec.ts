import { randomUUID } from 'node:crypto';

import { type PrismaClient } from '@bidplace/database';
import { ForbiddenException } from '@nestjs/common';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { CommerceTickService } from '../../src/commerce/commerce-tick';
import { OrdersService } from '../../src/commerce/orders.service';
import {
  createHttpTestApp,
  HttpTestClient,
  type HttpTestApp,
} from './http-test-app';
import {
  createPermissionFixture,
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
  process.env.ANALYTICS_WEB_ENABLED = 'true';
  database = await createIntegrationDatabaseContext();
  prisma = database.prisma;
  http = await createHttpTestApp(database.databaseUrl, 'http://localhost:8081');
});

afterEach(async () => {
  await prisma.notificationOutbox.deleteMany();
  await prisma.userNotificationSettings.deleteMany();
  await prisma.purchaseHold.deleteMany();
  await prisma.fraudSignal.deleteMany();
  await prisma.report.deleteMany();
  await prisma.analyticsEvent.deleteMany();
  await prisma.acquisitionAttribution.deleteMany();
  await prisma.rateLimitCounter.deleteMany();
  await resetPermissionFixture(prisma);
});

afterAll(async () => {
  await http?.close();
  await database?.cleanup();
});

const PASS = 'XXXX.DUMMY.TOKEN.XXXX';
const HOUR_MS = 60 * 60 * 1000;
let clientSerial = 0;

async function databaseNow(): Promise<Date> {
  const [row] = await prisma.$queryRaw<Array<{ now: Date }>>`
    SELECT clock_timestamp() AS now
  `;
  return row!.now;
}

function client() {
  clientSerial += 1;
  return new HttpTestClient(
    http.baseUrl,
    'http://localhost:8081',
    `198.51.100.${clientSerial}`,
  );
}

async function signedIn(email: string, password = 'password123') {
  const next = client();
  const response = await next.post('/auth/login', { email, password });
  expect(response.status).toBe(201);
  return next;
}

async function errorBody(response: Response) {
  return response.json() as Promise<{ code?: string; message?: string }>;
}

async function giveContact(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { contactPhone: '+375291112233' },
  });
}

async function banAccount(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { status: 'banned' },
  });
  expect(
    await prisma.sellerProfile.findUniqueOrThrow({ where: { userId } }),
  ).toMatchObject({ status: 'APPROVED' });
}

async function extraBuyer(label: string) {
  const email = `${label}.${randomUUID().slice(0, 8)}@wave3.test`;
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: fixturePasswordHash,
      displayName: label,
      emailVerifiedAt: new Date('2026-09-01T00:00:00.000Z'),
      contactPhone: '+375291112233',
      termsAcceptances: {
        create: {
          rulesVersion: 'MVP_RULES_V1',
          acceptedAt: new Date('2026-09-01T00:00:00.000Z'),
        },
      },
    },
    select: { id: true, email: true },
  });
  return { ...user, client: await signedIn(email) };
}

async function workFor(
  seller: { id: string; profileId: string },
  title: string,
) {
  return prisma.product.create({
    data: {
      publicId: `p${randomUUID().replace(/-/g, '').slice(0, 10)}`,
      sellerProfileId: seller.profileId,
      title,
      status: 'APPROVED',
    },
    select: { id: true, publicId: true, title: true },
  });
}

async function liveAuction(
  seller: { id: string; profileId: string },
  title: string,
  endsAt: Date,
  bids: Array<{ bidderUserId: string; amountMinor: number }> = [],
) {
  const product = await workFor(seller, title);
  const listing = await prisma.listing.create({
    data: {
      productId: product.id,
      sellerUserId: seller.id,
      type: 'AUCTION',
      status: 'LIVE',
      currency: 'BYN',
      startsAt: new Date(endsAt.getTime() - 2 * HOUR_MS),
      endsAt,
      originalEndsAt: endsAt,
      contactWindowHours: 24,
      currentPriceMinor: bids[0]?.amountMinor ?? 1_000,
      bidCount: bids.length,
      auctionRules: {
        create: { startPriceMinor: 1_000, stepTableCode: 'BYN_V1' },
      },
    },
    select: { id: true },
  });
  const stored = [];
  for (const [index, bid] of bids.entries()) {
    stored.push(
      await prisma.bid.create({
        data: {
          listingId: listing.id,
          bidderUserId: bid.bidderUserId,
          amountMinor: bid.amountMinor,
          idempotencyKey: `seed-${listing.id}-${index}`,
          createdAt: new Date(endsAt.getTime() - (bids.length - index) * 1_000),
        },
        select: { id: true, voidedAt: true },
      }),
    );
  }
  return { product, listingId: listing.id, bids: stored };
}

async function liveFixed(seller: { id: string; profileId: string }, title: string) {
  const product = await workFor(seller, title);
  const now = await databaseNow();
  const listing = await prisma.listing.create({
    data: {
      productId: product.id,
      sellerUserId: seller.id,
      type: 'FIXED',
      status: 'LIVE',
      currency: 'BYN',
      priceMinor: 1_500,
      startsAt: new Date(now.getTime() - 1_000),
      contactWindowHours: 6,
    },
    select: { id: true },
  });
  return { product, listingId: listing.id };
}

function postBid(actor: HttpTestClient, listingId: string, amountMinor: number) {
  return actor.post(`/listings/${listingId}/bids`, {
    amountMinor,
    idempotencyKey: `bid-${randomUUID()}`,
    turnstileToken: PASS,
  });
}

function postPurchase(actor: HttpTestClient, listingId: string) {
  return actor.post(`/listings/${listingId}/purchase`, {
    idempotencyKey: `buy-${randomUUID()}`,
    turnstileToken: PASS,
  });
}

async function deadlocks(): Promise<number> {
  const [row] = await prisma.$queryRaw<Array<{ deadlocks: number | bigint }>>`
    SELECT deadlocks FROM pg_stat_database WHERE datname = current_database()
  `;
  const value = row?.deadlocks;
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'number') return value;
  throw new Error('deadlock count is missing');
}

async function waitForUserLock(): Promise<void> {
  const started = Date.now();
  while (Date.now() - started < 5_000) {
    const [row] = await prisma.$queryRaw<Array<{ waiting: boolean }>>`
      SELECT EXISTS (
        SELECT 1
        FROM pg_stat_activity AS activity
        WHERE activity.datname = current_database()
          AND activity.state = 'active'
          AND activity.wait_event_type = 'Lock'
          AND activity.wait_event = 'transactionid'
          AND EXISTS (
            SELECT 1
            FROM pg_locks AS lock
            JOIN pg_class AS class ON class.oid = lock.relation
            JOIN pg_namespace AS namespace ON namespace.oid = class.relnamespace
            WHERE lock.pid = activity.pid
              AND class.relname = 'users'
              AND namespace.nspname = current_schema()
              AND lock.locktype = 'relation'
              AND lock.granted
          )
      ) AS waiting
    `;
    if (row?.waiting) return;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  throw new Error('request did not wait on the user lock');
}

async function banWhileWaiting(
  sellerUserId: string,
  start: () => Promise<Response>,
): Promise<Response> {
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
      await tx.$queryRaw`SELECT id FROM users WHERE id = ${sellerUserId}::uuid FOR UPDATE`;
      acquired();
      await released;
      await tx.user.update({
        where: { id: sellerUserId },
        data: { status: 'banned' },
      });
    },
    { isolationLevel: 'ReadCommitted', timeout: 15_000 },
  );
  await ready;
  const pending = start();
  try {
    await waitForUserLock();
    release();
    return await pending;
  } finally {
    release();
    await holder;
  }
}

describe('banned seller gate', () => {
  it('refuses a new bid and still accepts a bid for an active seller', async () => {
    const fixture = await createPermissionFixture(prisma);
    await giveContact(fixture.buyer.id);
    const buyer = await signedIn(fixture.buyer.email, fixture.buyer.password);
    const now = await databaseNow();
    const banned = await liveAuction(
      fixture.sellers.approved,
      'Banned auction',
      new Date(now.getTime() + 2 * HOUR_MS),
      [{ bidderUserId: (await extraBuyer('kept-bid')).id, amountMinor: 1_000 }],
    );
    const active = await liveAuction(
      fixture.sellers.otherApproved,
      'Active auction',
      new Date(now.getTime() + 2 * HOUR_MS),
    );
    await banAccount(fixture.sellers.approved.id);

    const refused = await postBid(buyer, banned.listingId, 1_500);
    expect(refused.status).toBe(409);
    expect(await errorBody(refused)).toMatchObject({ code: 'LISTING_NOT_OPEN' });
    const kept = await prisma.bid.findMany({ where: { listingId: banned.listingId } });
    expect(kept).toHaveLength(1);
    expect(kept[0]?.voidedAt).toBeNull();
    expect(
      await prisma.listing.findUniqueOrThrow({ where: { id: banned.listingId } }),
    ).toMatchObject({ status: 'LIVE' });

    const accepted = await postBid(buyer, active.listingId, 1_000);
    expect(accepted.status).toBe(200);
    expect(
      await prisma.bid.count({ where: { listingId: active.listingId } }),
    ).toBe(1);
    expect(
      await prisma.sellerProfile.findUniqueOrThrow({
        where: { userId: fixture.sellers.approved.id },
      }),
    ).toMatchObject({ status: 'APPROVED' });
  });

  it('refuses a fixed-price purchase and still sells an active seller', async () => {
    const fixture = await createPermissionFixture(prisma);
    await giveContact(fixture.buyer.id);
    const buyer = await signedIn(fixture.buyer.email, fixture.buyer.password);
    const banned = await liveFixed(fixture.sellers.approved, 'Banned fixed');
    const active = await liveFixed(fixture.sellers.otherApproved, 'Active fixed');
    await banAccount(fixture.sellers.approved.id);

    const refused = await postPurchase(buyer, banned.listingId);
    expect(refused.status).toBe(409);
    expect(await errorBody(refused)).toMatchObject({ code: 'LISTING_NOT_OPEN' });
    expect(await prisma.order.count({ where: { listingId: banned.listingId } })).toBe(0);
    expect(
      await prisma.listing.findUniqueOrThrow({ where: { id: banned.listingId } }),
    ).toMatchObject({ status: 'LIVE' });

    const bought = await postPurchase(buyer, active.listingId);
    expect(bought.status).toBe(200);
    expect(
      await prisma.order.findMany({ where: { listingId: active.listingId } }),
    ).toMatchObject([{ source: 'FIXED_PURCHASE', status: 'ACTIVE' }]);
  });

  it('ends a banned seller auction without an order and still awards an active seller', async () => {
    const fixture = await createPermissionFixture(prisma);
    const now = await databaseNow();
    const high = await extraBuyer('tick-high');
    const other = await extraBuyer('tick-active');
    const due = new Date(now.getTime() - 60_000);
    const banned = await liveAuction(fixture.sellers.approved, 'Due banned', due, [
      { bidderUserId: high.id, amountMinor: 2_500 },
    ]);
    const active = await liveAuction(
      fixture.sellers.otherApproved,
      'Due active',
      due,
      [{ bidderUserId: other.id, amountMinor: 1_800 }],
    );
    await banAccount(fixture.sellers.approved.id);

    const closed = await http.app
      .get(CommerceTickService)
      .closeDue(Date.now() + 20_000);

    expect(closed).toBe(2);
    expect(await prisma.order.count({ where: { listingId: banned.listingId } })).toBe(0);
    expect(
      await prisma.listing.findUniqueOrThrow({ where: { id: banned.listingId } }),
    ).toMatchObject({ status: 'ENDED' });
    expect(
      await prisma.bid.findFirstOrThrow({ where: { listingId: banned.listingId } }),
    ).toMatchObject({ amountMinor: 2_500, voidedAt: null });
    const letters = await prisma.notificationOutbox.findMany({
      where: { userId: fixture.sellers.approved.id },
    });
    expect(letters.map((letter) => letter.kind)).not.toContain('AUCTION_ENDED_NO_BIDS');
    expect(
      letters.filter((letter) => JSON.stringify(letter.payload).includes(banned.listingId)),
    ).toHaveLength(0);
    expect(
      await prisma.order.findMany({ where: { listingId: active.listingId } }),
    ).toMatchObject([
      { source: 'AUCTION_WIN', status: 'ACTIVE', buyerUserId: other.id, amountMinor: 1_800 },
    ]);
  });

  it('does not create an offered order for a banned seller', async () => {
    const fixture = await createPermissionFixture(prisma);
    const now = await databaseNow();
    const winner = await extraBuyer('offer-win');
    const next = await extraBuyer('offer-next');
    const auction = await liveAuction(
      fixture.sellers.approved,
      'Next offer',
      new Date(now.getTime() - HOUR_MS),
      [
        { bidderUserId: winner.id, amountMinor: 2_000 },
        { bidderUserId: next.id, amountMinor: 1_500 },
      ],
    );
    await prisma.listing.update({
      where: { id: auction.listingId },
      data: { status: 'ENDED', endedAt: now },
    });
    const failed = await prisma.order.create({
      data: {
        publicId: `o${randomUUID().replace(/-/g, '').slice(0, 10)}`,
        dealCode: '000421',
        productId: auction.product.id,
        listingId: auction.listingId,
        sellerUserId: fixture.sellers.approved.id,
        buyerUserId: winner.id,
        source: 'AUCTION_WIN',
        amountMinor: 2_000,
        currency: 'BYN',
        status: 'FAILED',
        failReason: 'BUYER_REFUSED',
        faultSide: 'BUYER',
        failedBy: 'buyer',
        failedAt: now,
        workTitleSnapshot: auction.product.title ?? 'Next offer',
        workPublicIdSnapshot: auction.product.publicId,
        sellerNameSnapshot: 'Wave 3 APPROVED',
      },
      select: { publicId: true },
    });
    await banAccount(fixture.sellers.approved.id);

    await expect(
      http.app.get(OrdersService).offerNext(fixture.sellers.approved.id, failed.publicId),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(
      await prisma.order.count({
        where: { listingId: auction.listingId, status: 'OFFERED' },
      }),
    ).toBe(0);
    expect(
      await prisma.sellerProfile.findUniqueOrThrow({
        where: { userId: fixture.sellers.approved.id },
      }),
    ).toMatchObject({ status: 'APPROVED' });
  });

  it.each(['create', 'bid', 'purchase'] as const)(
    'sees a ban that commits while %s waits on the seller lock',
    async (kind) => {
      const fixture = await createPermissionFixture(prisma);
      await giveContact(fixture.buyer.id);
      const buyer = await signedIn(fixture.buyer.email, fixture.buyer.password);
      const seller = await signedIn(
        fixture.sellers.approved.email,
        fixture.sellers.approved.password,
      );
      const now = await databaseNow();
      const beforeListings = new Set(
        (
          await prisma.listing.findMany({
            where: { sellerUserId: fixture.sellers.approved.id },
            select: { id: true },
          })
        ).map((row) => row.id),
      );
      const auction =
        kind === 'bid'
          ? await liveAuction(
              fixture.sellers.approved,
              'Lock bid',
              new Date(now.getTime() + 2 * HOUR_MS),
            )
          : null;
      const fixed =
        kind === 'purchase'
          ? await liveFixed(fixture.sellers.approved, 'Lock purchase')
          : null;
      const beforeDeadlocks = await deadlocks();

      const response = await banWhileWaiting(fixture.sellers.approved.id, () => {
        if (kind === 'create') {
          return seller.post(`/works/${fixture.approvedProductId}/listings`, {
            type: 'FIXED',
            currency: 'BYN',
            priceMinor: 1_500,
            startsAt: new Date(now.getTime() - 1_000).toISOString(),
          });
        }
        if (kind === 'bid') return postBid(buyer, auction!.listingId, 1_000);
        return postPurchase(buyer, fixed!.listingId);
      });

      expect(await deadlocks()).toBe(beforeDeadlocks);
      expect(
        await prisma.sellerProfile.findUniqueOrThrow({
          where: { userId: fixture.sellers.approved.id },
        }),
      ).toMatchObject({ status: 'APPROVED' });
      expect(
        await prisma.user.findUniqueOrThrow({
          where: { id: fixture.sellers.approved.id },
        }),
      ).toMatchObject({ status: 'banned' });
      if (kind === 'create') {
        expect(response.status).toBe(403);
        expect(await errorBody(response)).toMatchObject({
          code: 'forbidden',
          message: 'Active user is required',
        });
        const listings = await prisma.listing.findMany({
          where: { sellerUserId: fixture.sellers.approved.id },
          select: { id: true },
        });
        expect(listings.every((row) => beforeListings.has(row.id))).toBe(true);
        return;
      }
      expect(response.status).toBe(409);
      expect(await errorBody(response)).toMatchObject({ code: 'LISTING_NOT_OPEN' });
      if (kind === 'bid') {
        expect(await prisma.bid.count({ where: { listingId: auction!.listingId } })).toBe(0);
        return;
      }
      expect(await prisma.order.count({ where: { listingId: fixed!.listingId } })).toBe(0);
    },
  );

  it('keeps an existing active order after the seller ban', async () => {
    const fixture = await createPermissionFixture(prisma);
    await giveContact(fixture.buyer.id);
    const buyer = await signedIn(fixture.buyer.email, fixture.buyer.password);
    const fixed = await liveFixed(fixture.sellers.approved, 'Already bought');
    const bought = await postPurchase(buyer, fixed.listingId);
    expect(bought.status).toBe(200);
    const order = await prisma.order.findFirstOrThrow({
      where: { listingId: fixed.listingId },
    });

    await banAccount(fixture.sellers.approved.id);

    expect(await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).toMatchObject({
      status: 'ACTIVE',
      buyerUserId: fixture.buyer.id,
      sellerUserId: fixture.sellers.approved.id,
    });
    expect(
      await prisma.listing.findUniqueOrThrow({ where: { id: fixed.listingId } }),
    ).toMatchObject({ status: 'ENDED' });
  });
});
