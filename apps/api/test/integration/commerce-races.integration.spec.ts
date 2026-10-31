import { randomUUID } from 'node:crypto';

import { type PrismaClient } from '@bidplace/database';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { CommerceTickService } from '../../src/commerce/commerce-tick';
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

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const PASS = 'XXXX.DUMMY.TOKEN.XXXX';
let clientSerial = 0;

async function databaseNow(): Promise<Date> {
  const [row] = await prisma.$queryRaw<Array<{ now: Date }>>`
    SELECT clock_timestamp() AS now
  `;
  return row!.now;
}

async function sleepUntil(target: Date): Promise<void> {
  const now = await databaseNow();
  const seconds = (target.getTime() - now.getTime()) / 1000;
  if (seconds <= 0) return;
  await prisma.$queryRaw`SELECT pg_sleep(${seconds})::text`;
}

async function waitUntilDueOrExtended(
  listingId: string,
  originalEndsAt: Date,
): Promise<void> {
  await sleepUntil(new Date(originalEndsAt.getTime() - 40));
  for (;;) {
    const [row] = await prisma.$queryRaw<Array<{ due: boolean; endsAt: Date }>>`
      SELECT ends_at <= clock_timestamp() AS due, ends_at AS "endsAt"
      FROM listings
      WHERE id = ${listingId}::uuid
    `;
    if (!row || row.due || row.endsAt.getTime() > originalEndsAt.getTime()) return;
  }
}

async function login(actor: HttpTestClient, email: string) {
  const response = await actor.post('/auth/login', {
    email,
    password: 'password123',
  });
  expect(response.status).toBe(201);
}

function client() {
  clientSerial += 1;
  return new HttpTestClient(
    http.baseUrl,
    'http://localhost:8081',
    `198.51.100.${clientSerial}`,
  );
}

async function errorBody(response: Response) {
  return response.json() as Promise<{ code?: string }>;
}

async function signedIn(email: string) {
  const actor = client();
  await login(actor, email);
  return actor;
}

async function extraUser(label: string) {
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

async function users(count: number, label: string) {
  const created = [];
  for (let index = 0; index < count; index += 1) {
    created.push(await extraUser(`${label}-${index}`));
  }
  return created;
}

async function liveAuction(fixture: PermissionFixture) {
  const seller = await signedIn(fixture.sellers.approved.email);
  const now = await databaseNow();
  const response = await seller.post(
    `/works/${fixture.approvedProductId}/listings`,
    {
      type: 'AUCTION',
      currency: 'BYN',
      startPriceMinor: 1_000,
      startsAt: new Date(now.getTime() - 1_000).toISOString(),
      endsAt: new Date(now.getTime() + 2 * DAY_MS).toISOString(),
    },
  );
  expect(response.status).toBe(201);
  const body = (await response.json()) as { id: string };
  return { seller, listingId: body.id };
}

async function fixedListing(fixture: PermissionFixture) {
  const seller = await signedIn(fixture.sellers.approved.email);
  const product = await prisma.product.findUniqueOrThrow({
    where: { id: fixture.approvedProductId },
    select: { id: true, publicId: true },
  });
  const now = await databaseNow();
  const created = await seller.post(`/works/${product.id}/listings`, {
    type: 'FIXED',
    currency: 'BYN',
    priceMinor: 1_500,
    startsAt: new Date(now.getTime() - 1_000).toISOString(),
    contactWindowHours: 6,
  });
  expect(created.status).toBe(201);
  const body = (await created.json()) as { id: string };
  return { seller, product, listingId: body.id };
}

function postBid(
  actor: HttpTestClient,
  listingId: string,
  amountMinor: number,
  idempotencyKey: string,
) {
  return actor.post(`/listings/${listingId}/bids`, {
    amountMinor,
    idempotencyKey,
    turnstileToken: PASS,
  });
}

function postPurchase(
  actor: HttpTestClient,
  listingId: string,
  idempotencyKey: string,
) {
  return actor.post(`/listings/${listingId}/purchase`, {
    idempotencyKey,
    turnstileToken: PASS,
  });
}

async function work(fixture: PermissionFixture, title: string) {
  return prisma.product.create({
    data: {
      publicId: `p${randomUUID().replace(/-/g, '').slice(0, 10)}`,
      sellerProfileId: fixture.sellers.approved.profileId,
      title,
      status: 'APPROVED',
    },
    select: { id: true },
  });
}

async function dueAuction(
  fixture: PermissionFixture,
  title: string,
  endsAt: Date,
  bidderUserId: string,
  amountMinor: number,
) {
  const product = await work(fixture, title);
  const listing = await prisma.listing.create({
    data: {
      productId: product.id,
      sellerUserId: fixture.sellers.approved.id,
      type: 'AUCTION',
      status: 'LIVE',
      currency: 'BYN',
      startsAt: new Date(endsAt.getTime() - 2 * HOUR_MS),
      endsAt,
      originalEndsAt: endsAt,
      contactWindowHours: 24,
      currentPriceMinor: amountMinor,
      bidCount: 1,
      auctionRules: {
        create: { startPriceMinor: 1_000, stepTableCode: 'BYN_V1' },
      },
    },
    select: { id: true },
  });
  const bid = await prisma.bid.create({
    data: {
      listingId: listing.id,
      bidderUserId,
      amountMinor,
      idempotencyKey: `bid-${listing.id}`,
      createdAt: new Date(endsAt.getTime() - 1_000),
    },
    select: { id: true },
  });
  return { listing, bid };
}

describe('commerce races', () => {
  it('accepts 50 increasing bids so the price is the highest stored bid', async () => {
    const fixture = await createPermissionFixture(prisma);
    const { listingId } = await liveAuction(fixture);
    const bidders = await users(50, 'bid');
    const amounts = bidders.map((_, index) => 1_000 + index * 500);

    const responses = await Promise.all(
      bidders.map((bidder, index) =>
        postBid(bidder.client, listingId, amounts[index]!, `race-bid-${index}`),
      ),
    );

    const accepted = responses.filter((response) => response.status === 200);
    for (const response of responses) {
      if (response.status === 200) continue;
      expect(response.status).toBe(409);
      expect(await errorBody(response)).toMatchObject({ code: 'BID_TOO_LOW' });
    }
    const rows = await prisma.bid.findMany({ where: { listingId } });
    const listing = await prisma.listing.findUniqueOrThrow({
      where: { id: listingId },
    });
    expect(rows).toHaveLength(accepted.length);
    expect(listing.bidCount).toBe(rows.length);
    expect(listing.status).toBe('LIVE');
    expect(new Set(rows.map((row) => row.amountMinor)).size).toBe(rows.length);
    expect(rows.every((row) => amounts.includes(row.amountMinor))).toBe(true);
    expect(rows.map((row) => row.amountMinor)).toContain(25_500);
    expect(listing.currentPriceMinor).toBe(
      Math.max(...rows.map((row) => row.amountMinor)),
    );
    expect(listing.currentPriceMinor).toBe(25_500);
  });

  it('opens exactly one order for 10 simultaneous purchases', async () => {
    const fixture = await createPermissionFixture(prisma);
    const buyers = await users(10, 'buy');
    const { listingId, product } = await fixedListing(fixture);

    const responses = await Promise.all(
      buyers.map((buyer, index) =>
        postPurchase(buyer.client, listingId, `race-buy-${index}`),
      ),
    );

    expect(responses.filter((response) => response.status === 200)).toHaveLength(1);
    for (const response of responses) {
      if (response.status === 200) continue;
      expect(response.status).toBe(409);
      expect(await errorBody(response)).toMatchObject({ code: 'LISTING_NOT_OPEN' });
    }
    const orders = await prisma.order.findMany({ where: { productId: product.id } });
    expect(orders).toHaveLength(1);
    expect(orders[0]).toMatchObject({
      status: 'ACTIVE',
      source: 'FIXED_PURCHASE',
      amountMinor: 1_500,
    });
    expect(
      await prisma.listing.findUniqueOrThrow({ where: { id: listingId } }),
    ).toMatchObject({ status: 'ENDED' });
  });

  it('lets exactly one of author cancel and purchase commit', async () => {
    const fixture = await createPermissionFixture(prisma);
    const buyer = await extraUser('cancel-buyer');
    const { seller, listingId } = await fixedListing(fixture);

    const [purchase, cancel] = await Promise.all([
      postPurchase(buyer.client, listingId, 'cancel-purchase-race'),
      seller.post(`/listings/${listingId}/cancel`),
    ]);

    const listing = await prisma.listing.findUniqueOrThrow({
      where: { id: listingId },
    });
    const orders = await prisma.order.findMany({ where: { listingId } });
    if (purchase.status === 200) {
      expect(cancel.status).toBe(409);
      expect(await errorBody(cancel)).toMatchObject({ code: 'conflict' });
      expect(listing.status).toBe('ENDED');
      expect(orders).toHaveLength(1);
      expect(orders[0]?.status).toBe('ACTIVE');
      return;
    }
    expect(purchase.status).toBe(409);
    expect(await errorBody(purchase)).toMatchObject({ code: 'LISTING_NOT_OPEN' });
    expect(cancel.status).toBe(201);
    expect(listing).toMatchObject({
      status: 'CANCELLED',
      cancelReason: 'AUTHOR_WITHDREW',
    });
    expect(orders).toHaveLength(0);
  });

  it('lets exactly one of the first bid and author cancel commit', async () => {
    const fixture = await createPermissionFixture(prisma);
    const bidder = await extraUser('first-bid');
    const { seller, listingId } = await liveAuction(fixture);

    const [bid, cancel] = await Promise.all([
      postBid(bidder.client, listingId, 1_000, 'first-bid-race'),
      seller.post(`/listings/${listingId}/cancel`),
    ]);

    const listing = await prisma.listing.findUniqueOrThrow({
      where: { id: listingId },
    });
    const rows = await prisma.bid.findMany({ where: { listingId } });
    if (bid.status === 200) {
      expect(cancel.status).toBe(409);
      expect(await errorBody(cancel)).toMatchObject({ code: 'conflict' });
      expect(listing.status).toBe('LIVE');
      expect(listing.bidCount).toBe(1);
      expect(rows).toHaveLength(1);
      expect(rows[0]?.amountMinor).toBe(1_000);
      return;
    }
    expect(bid.status).toBe(409);
    expect(await errorBody(bid)).toMatchObject({ code: 'LISTING_NOT_OPEN' });
    expect(cancel.status).toBe(201);
    expect(listing).toMatchObject({
      status: 'CANCELLED',
      cancelReason: 'AUTHOR_WITHDREW',
    });
    expect(listing.bidCount).toBe(0);
    expect(rows).toHaveLength(0);
  });

  it('races a soft-close bid with the auction-close tick', async () => {
    const fixture = await createPermissionFixture(prisma);
    const winner = await extraUser('close-winner');
    const rival = await extraUser('close-rival');
    const now = await databaseNow();
    const endsAt = new Date(now.getTime() + 3_000);
    const auction = await dueAuction(
      fixture,
      'Bid against close',
      endsAt,
      winner.id,
      1_500,
    );
    // The auction is still open. closeDue selects it only after endsAt. The bid
    // is released just before that instant so the two calls overlap.
    const [bid, closed] = await Promise.all([
      (async () => {
        await sleepUntil(new Date(endsAt.getTime() - 55));
        return postBid(rival.client, auction.listing.id, 2_500, 'bid-against-close');
      })(),
      (async () => {
        await waitUntilDueOrExtended(auction.listing.id, endsAt);
        return http.app.get(CommerceTickService).closeDue(Date.now() + 20_000);
      })(),
    ]);

    const listing = await prisma.listing.findUniqueOrThrow({
      where: { id: auction.listing.id },
    });
    const rows = await prisma.bid.findMany({
      where: { listingId: auction.listing.id },
    });
    const rivalBids = rows.filter((row) => row.bidderUserId === rival.id);
    const orders = await prisma.order.findMany({
      where: { listingId: auction.listing.id },
    });
    if (bid.status === 200) {
      expect(listing.status).toBe('LIVE');
      expect(listing.endsAt!.getTime()).toBeGreaterThan(endsAt.getTime());
      expect(orders).toHaveLength(0);
      expect(rivalBids).toHaveLength(1);
      expect(closed).toBe(0);
      return;
    }
    expect(bid.status).toBe(409);
    expect(await errorBody(bid)).toMatchObject({ code: 'LISTING_NOT_OPEN' });
    expect(listing.status).toBe('ENDED');
    expect(rivalBids).toHaveLength(0);
    expect(orders).toHaveLength(1);
    expect(orders[0]).toMatchObject({
      source: 'AUCTION_WIN',
      status: 'ACTIVE',
      buyerUserId: winner.id,
      amountMinor: 1_500,
      sourceBidId: auction.bid.id,
    });
    expect(closed).toBe(1);
  });

  it('lets two ticks create one order and no duplicate notifications', async () => {
    const fixture = await createPermissionFixture(prisma);
    const now = await databaseNow();
    const winner = await prisma.user.create({
      data: {
        email: `tick.${randomUUID().slice(0, 8)}@wave3.test`,
        displayName: 'tick-winner',
        emailVerifiedAt: new Date('2026-09-01T00:00:00.000Z'),
      },
      select: { id: true },
    });
    const auction = await dueAuction(
      fixture,
      'Two ticks',
      new Date(now.getTime() - 60_000),
      winner.id,
      1_800,
    );
    const jobs = http.app.get(CommerceTickService);
    const deadline = Date.now() + 20_000;

    await Promise.all([jobs.closeDue(deadline), jobs.closeDue(deadline)]);

    expect(
      await prisma.order.count({ where: { listingId: auction.listing.id } }),
    ).toBe(1);
    const letters = await prisma.notificationOutbox.findMany({
      where: { userId: { in: [winner.id, fixture.sellers.approved.id] } },
    });
    expect(letters).toHaveLength(2);
    expect(letters.map((letter) => letter.kind).sort()).toEqual([
      'AUCTION_ENDED',
      'BID_WON',
    ]);
  });

  it('keeps the price at the highest non-voided bid when a ban races that user bid', async () => {
    const fixture = await createPermissionFixture(prisma);
    const steady = await extraUser('ban-steady');
    const racer = await extraUser('ban-racer');
    const admin = await extraUser('ban-admin');
    await prisma.user.update({
      where: { id: admin.id },
      data: { role: 'admin' },
    });
    const { listingId } = await liveAuction(fixture);
    expect((await postBid(steady.client, listingId, 2_000, 'ban-steady-bid')).status).toBe(
      200,
    );

    const [bid, ban] = await Promise.all([
      postBid(racer.client, listingId, 3_000, 'ban-race-bid'),
      admin.client.patch(`/admin/users/${racer.id}/status`, {
        status: 'banned',
        reason: 'Race with a bid',
      }),
    ]);

    expect([200, 403]).toContain(bid.status);
    if (bid.status === 403) {
      expect(await errorBody(bid)).toMatchObject({ code: 'BUYER_BLOCKED' });
    }
    expect(ban.status).toBe(200);
    const rows = await prisma.bid.findMany({ where: { listingId } });
    const live = rows.filter((row) => row.voidedAt === null);
    expect(live.every((row) => row.bidderUserId !== racer.id)).toBe(true);
    const listing = await prisma.listing.findUniqueOrThrow({
      where: { id: listingId },
    });
    expect(listing.bidCount).toBe(live.length);
    expect(listing.currentPriceMinor).toBe(
      Math.max(...live.map((row) => row.amountMinor)),
    );
    expect(listing.currentPriceMinor).toBe(2_000);
    expect(
      await prisma.user.findUniqueOrThrow({ where: { id: racer.id } }),
    ).toMatchObject({ status: 'banned' });
    expect(
      await prisma.user.findUniqueOrThrow({
        where: { id: fixture.sellers.approved.id },
      }),
    ).toMatchObject({ status: 'active' });
  });

  it('races a fixed-price failure with a new purchase and does not open two orders', async () => {
    const fixture = await createPermissionFixture(prisma);
    const first = await extraUser('fail-first');
    const next = await extraUser('fail-next');
    const { seller, listingId, product } = await fixedListing(fixture);
    expect(
      (await postPurchase(first.client, listingId, 'fail-race-before')).status,
    ).toBe(200);
    const order = await prisma.order.findFirstOrThrow({ where: { listingId } });

    const [purchase, failed] = await Promise.all([
      postPurchase(next.client, listingId, 'fail-race-next'),
      seller.post(`/orders/${order.publicId}/fail`, { reason: 'SELLER_REFUSED' }),
    ]);

    expect(failed.status).toBe(200);
    const orders = await prisma.order.findMany({ where: { productId: product.id } });
    const open = orders.filter(
      (row) => row.status === 'ACTIVE' || row.status === 'OFFERED',
    );
    // A purchase that locks the product while the listing is still ENDED is
    // LISTING_NOT_OPEN. The failure then restores LIVE and no order stays open.
    // A purchase that runs after the restore is the only open order.
    if (purchase.status === 200) {
      expect(open).toHaveLength(1);
      expect(open[0]?.buyerUserId).toBe(next.id);
    } else {
      expect(purchase.status).toBe(409);
      expect(await errorBody(purchase)).toMatchObject({ code: 'LISTING_NOT_OPEN' });
      expect(open).toHaveLength(0);
    }
    expect(
      await prisma.listing.findUniqueOrThrow({ where: { id: listingId } }),
    ).toMatchObject({ status: open.length === 1 ? 'ENDED' : 'LIVE' });
    expect(orders.find((row) => row.id === order.id)).toMatchObject({
      status: 'FAILED',
      failReason: 'SELLER_REFUSED',
    });
  });
});
