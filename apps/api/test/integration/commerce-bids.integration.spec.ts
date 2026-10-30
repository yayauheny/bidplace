import { randomUUID } from 'node:crypto';

import { type PrismaClient } from '@bidplace/database';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { ANALYTICS_BROWSER_COOKIE, signAnalyticsBrowser } from '../../src/analytics/browser-attribution';
import type { ServerEnv } from '../../src/core/config';
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

const DAY_MS = 24 * 60 * 60 * 1000;
const PASS = 'XXXX.DUMMY.TOKEN.XXXX';
let dealSerial = 0;

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

function client() {
  clientSerial += 1;
  return new HttpTestClient(
    http.baseUrl,
    'http://localhost:8081',
    `198.51.100.${clientSerial}`,
  );
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

async function signedIn(
  email: string,
  password: string,
): Promise<HttpTestClient> {
  const next = client();
  await login(next, email, password);
  return next;
}

async function liveAuction(fixture: PermissionFixture) {
  const seller = await signedIn(
    fixture.sellers.approved.email,
    fixture.sellers.approved.password,
  );
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
  return { seller, listingId: body.id, now };
}

async function extraUser(label: string, contact = true) {
  const email = `${label}.${randomUUID().slice(0, 8)}@wave3.test`;
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: fixturePasswordHash,
      displayName: label,
      emailVerifiedAt: new Date('2026-09-01T00:00:00.000Z'),
      ...(contact ? { contactPhone: '+375291112233' } : {}),
      termsAcceptances: {
        create: {
          rulesVersion: 'MVP_RULES_V1',
          acceptedAt: new Date('2026-09-01T00:00:00.000Z'),
        },
      },
    },
    select: { id: true, email: true },
  });
  return { ...user, password: 'password123', client: await signedIn(email, 'password123') };
}

function bidPayload(
  amountMinor: number,
  idempotencyKey: string,
  turnstileToken: string | null = PASS,
) {
  return {
    amountMinor,
    idempotencyKey,
    ...(turnstileToken === null ? {} : { turnstileToken }),
  };
}

async function postBid(
  actor: HttpTestClient,
  listingId: string,
  amountMinor: number,
  idempotencyKey = `bid-${randomUUID()}`,
  turnstileToken: string | null = PASS,
) {
  return actor.post(
    `/listings/${listingId}/bids`,
    bidPayload(amountMinor, idempotencyKey, turnstileToken),
  );
}

async function spareProduct(fixture: PermissionFixture, title: string) {
  return prisma.product.create({
    data: {
      publicId: `b${randomUUID().replace(/-/g, '').slice(0, 10)}`,
      sellerProfileId: fixture.sellers.approved.profileId,
      title,
      status: 'APPROVED',
    },
    select: { id: true, publicId: true },
  });
}

async function closedListing(
  fixture: PermissionFixture,
  product: { id: string },
) {
  return prisma.listing.create({
    data: {
      productId: product.id,
      sellerUserId: fixture.sellers.approved.id,
      type: 'FIXED',
      status: 'ENDED',
      currency: 'BYN',
      priceMinor: 1_500,
      startsAt: new Date('2026-09-01T00:00:00.000Z'),
      endedAt: new Date('2026-09-02T00:00:00.000Z'),
    },
    select: { id: true },
  });
}

async function orderOn(
  fixture: PermissionFixture,
  buyerId: string,
  status: 'ACTIVE' | 'FAILED',
  fail?: { reason: 'BUYER_REFUSED' | 'BUYER_NO_CONTACT'; failedAt: Date },
) {
  const product = await spareProduct(fixture, `Order ${randomUUID().slice(0, 8)}`);
  const listing = await closedListing(fixture, product);
  return prisma.order.create({
    data: {
      publicId: `o${randomUUID().replace(/-/g, '').slice(0, 10)}`,
      dealCode: String(++dealSerial).padStart(6, '0'),
      productId: product.id,
      listingId: listing.id,
      sellerUserId: fixture.sellers.approved.id,
      buyerUserId: buyerId,
      source: 'FIXED_PURCHASE',
      amountMinor: 1_500,
      currency: 'BYN',
      status,
      failReason: fail?.reason,
      faultSide: fail ? 'BUYER' : undefined,
      failedAt: fail?.failedAt,
      workTitleSnapshot: product.id,
      workPublicIdSnapshot: product.publicId,
      sellerNameSnapshot: 'Wave 3 APPROVED',
    },
    select: { id: true },
  });
}

describe('place bid refusals', () => {
  it.each([
    ['before the auction starts', 'LISTING_NOT_OPEN', 409],
    ['after endsAt before the tick', 'LISTING_NOT_OPEN', 409],
    ['the seller bidding on their own work', 'SELF_BID_FORBIDDEN', 403],
    ['an administrator', 'ADMIN_BID_FORBIDDEN', 403],
    ['a bid below the minimum', 'BID_TOO_LOW', 409],
    ['a bid that is not a step multiple', 'BID_AMOUNT_INVALID', 400],
    ['a bid above the amount limit', 'BID_AMOUNT_INVALID', 400],
    ['the displayed minimum above 25.50 BYN', 'ACCEPTED', 200],
    ['the current leader', 'BID_ALREADY_LEADING', 409],
    ['three active orders', 'BUYER_ORDER_LIMIT', 403],
    ['two buyer strikes', 'BUYER_BLOCKED', 403],
    ['a buyer without contacts', 'BUYER_CONTACTS_REQUIRED', 403],
  ] as const)('%s → %s', async (name, code, status) => {
    const fixture = await createPermissionFixture(prisma);
    const buyer = await signedIn(fixture.buyer.email, fixture.buyer.password);
    if (name !== 'a buyer without contacts') await giveContact(fixture.buyer.id);

    if (name === 'before the auction starts') {
      const seller = await signedIn(
        fixture.sellers.approved.email,
        fixture.sellers.approved.password,
      );
      const now = await databaseNow();
      const startsAt = new Date(now.getTime() + 60 * 60 * 1000);
      const created = (await (
        await seller.post(`/works/${fixture.approvedProductId}/listings`, {
          type: 'AUCTION',
          currency: 'BYN',
          startPriceMinor: 1_000,
          startsAt: startsAt.toISOString(),
          endsAt: new Date(startsAt.getTime() + 2 * DAY_MS).toISOString(),
        })
      ).json()) as { id: string };
      const response = await postBid(buyer, created.id, 1_000);
      expect(response.status).toBe(status);
      expect(await errorBody(response)).toMatchObject({ code });
      return;
    }

    const { seller, listingId } = await liveAuction(fixture);
    if (name === 'after endsAt before the tick') {
      const now = await databaseNow();
      await prisma.listing.update({
        where: { id: listingId },
        data: { endsAt: new Date(now.getTime() - 1_000), status: 'LIVE' },
      });
    }
    if (name === 'the current leader') {
      expect((await postBid(buyer, listingId, 1_000)).status).toBe(200);
    }
    if (name === 'three active orders') {
      await orderOn(fixture, fixture.buyer.id, 'ACTIVE');
      await orderOn(fixture, fixture.buyer.id, 'ACTIVE');
      await orderOn(fixture, fixture.buyer.id, 'ACTIVE');
    }
    if (name === 'two buyer strikes') {
      const failedAt = await databaseNow();
      await orderOn(fixture, fixture.buyer.id, 'FAILED', {
        reason: 'BUYER_REFUSED',
        failedAt,
      });
      await orderOn(fixture, fixture.buyer.id, 'FAILED', {
        reason: 'BUYER_REFUSED',
        failedAt,
      });
    }

    const actor =
      name === 'the seller bidding on their own work'
        ? seller
        : name === 'an administrator'
          ? await extraUser('admin').then(async (user) => {
              await prisma.user.update({
                where: { id: user.id },
                data: { role: 'admin' },
              });
              return user.client;
            })
          : buyer;
    if (name === 'the displayed minimum above 25.50 BYN') {
      const leader = await extraUser('price-leader');
      await prisma.listing.update({
        where: { id: listingId },
        data: { currentPriceMinor: 2_550, bidCount: 1 },
      });
      await prisma.bid.create({
        data: {
          listingId,
          bidderUserId: leader.id,
          amountMinor: 2_550,
          idempotencyKey: 'price-2550-key',
        },
      });
    }
    const amount =
      name === 'a bid below the minimum'
        ? 950
        : name === 'a bid that is not a step multiple'
          ? 1_025
          : name === 'a bid above the amount limit'
            ? 100_000_001
            : name === 'the current leader'
              ? 1_050
              : name === 'the displayed minimum above 25.50 BYN'
                ? 2_650
                : 1_000;
    const response = await postBid(actor, listingId, amount);
    expect(response.status).toBe(status);
    if (status === 200) return;
    expect(await errorBody(response)).toMatchObject({ code });
  });
});

describe('accepted bids', () => {
  it('returns the same stored bid for the same key and amount', async () => {
    const fixture = await createPermissionFixture(prisma);
    await giveContact(fixture.buyer.id);
    const buyer = await signedIn(fixture.buyer.email, fixture.buyer.password);
    const { listingId } = await liveAuction(fixture);
    const first = await postBid(buyer, listingId, 1_000, 'same-bid-key');
    const second = await postBid(buyer, listingId, 1_000, 'same-bid-key');
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    const firstBody = (await first.json()) as {
      bid: { id: string; amountMinor: number };
      lot: { bidCount: number; priceMinor: number };
    };
    const secondBody = (await second.json()) as {
      bid: { id: string; amountMinor: number };
      lot: { bidCount: number; priceMinor: number };
    };
    expect(secondBody.bid).toEqual(firstBody.bid);
    expect(secondBody.lot.bidCount).toBe(1);
    expect(secondBody.lot.priceMinor).toBe(firstBody.lot.priceMinor);
    expect(await prisma.bid.count({ where: { listingId } })).toBe(1);
  });

  it('rejects the same key with a different amount', async () => {
    const fixture = await createPermissionFixture(prisma);
    await giveContact(fixture.buyer.id);
    const buyer = await signedIn(fixture.buyer.email, fixture.buyer.password);
    const { listingId } = await liveAuction(fixture);
    expect((await postBid(buyer, listingId, 1_000, 'reused-bid-key')).status).toBe(200);
    const response = await postBid(buyer, listingId, 1_500, 'reused-bid-key');
    expect(response.status).toBe(409);
    expect(await errorBody(response)).toMatchObject({ code: 'IDEMPOTENCY_KEY_REUSED' });
    expect(await prisma.bid.count({ where: { listingId } })).toBe(1);
  });

  it('extends endsAt when the bid arrives inside the soft-close window', async () => {
    const fixture = await createPermissionFixture(prisma);
    await giveContact(fixture.buyer.id);
    const buyer = await signedIn(fixture.buyer.email, fixture.buyer.password);
    const { listingId } = await liveAuction(fixture);
    const before = await databaseNow();
    const previousEnd = new Date(before.getTime() + 30_000);
    await prisma.listing.update({
      where: { id: listingId },
      data: { endsAt: previousEnd },
    });
    const response = await postBid(buyer, listingId, 1_000);
    expect(response.status).toBe(200);
    const listing = await prisma.listing.findUniqueOrThrow({
      where: { id: listingId },
    });
    const after = await databaseNow();
    expect(listing.endsAt!.getTime()).toBeGreaterThan(previousEnd.getTime());
    expect(listing.endsAt!.getTime()).toBeGreaterThan(after.getTime() + 45_000);
    expect(listing.endsAt!.getTime()).toBeLessThanOrEqual(after.getTime() + 60_000);
    expect(listing.bidCount).toBe(1);
    expect(listing.currentPriceMinor).toBe(1_000);
  });

  it('queues an outbid letter for the previous leader unless they turned it off', async () => {
    const fixture = await createPermissionFixture(prisma);
    await giveContact(fixture.buyer.id);
    const first = await extraUser('leader');
    const second = await extraUser('rival');
    const { listingId } = await liveAuction(fixture);
    const opening = await postBid(first.client, listingId, 1_000);
    expect(opening.status).toBe(200);
    const raised = await postBid(second.client, listingId, 1_500);
    expect(raised.status).toBe(200);
    const raisedBody = (await raised.json()) as { bid: { id: string } };
    const queued = await prisma.notificationOutbox.findMany({
      where: { userId: first.id, kind: 'OUTBID' },
    });
    expect(queued).toHaveLength(1);
    expect(queued[0]?.payload).toMatchObject({ bidId: raisedBody.bid.id });

    const quiet = await extraUser('quiet');
    await prisma.userNotificationSettings.create({
      data: { userId: second.id, outbidEmail: false },
    });
    const again = await postBid(quiet.client, listingId, 2_000);
    expect(again.status).toBe(200);
    expect(
      await prisma.notificationOutbox.count({
        where: { userId: second.id, kind: 'OUTBID' },
      }),
    ).toBe(0);
  });

  it('counts a leading lot toward the three-reservation cap', async () => {
    const fixture = await createPermissionFixture(prisma);
    await giveContact(fixture.buyer.id);
    const buyer = await signedIn(fixture.buyer.email, fixture.buyer.password);
    const leadingProduct = await spareProduct(fixture, 'Leading lot');
    const now = await databaseNow();
    const leading = await prisma.listing.create({
      data: {
        productId: leadingProduct.id,
        sellerUserId: fixture.sellers.approved.id,
        type: 'AUCTION',
        status: 'LIVE',
        currency: 'BYN',
        startsAt: new Date(now.getTime() - 60_000),
        endsAt: new Date(now.getTime() + DAY_MS),
        originalEndsAt: new Date(now.getTime() + DAY_MS),
        currentPriceMinor: 1_000,
        bidCount: 1,
        auctionRules: {
          create: { startPriceMinor: 1_000, stepTableCode: 'BYN_V1' },
        },
        bids: {
          create: {
            bidderUserId: fixture.buyer.id,
            amountMinor: 1_000,
            idempotencyKey: 'leading-lot-key',
          },
        },
      },
    });
    await orderOn(fixture, fixture.buyer.id, 'ACTIVE');
    await orderOn(fixture, fixture.buyer.id, 'ACTIVE');
    const { listingId } = await liveAuction(fixture);
    const blocked = await postBid(buyer, listingId, 1_000);
    expect(blocked.status).toBe(403);
    expect(await errorBody(blocked)).toMatchObject({ code: 'BUYER_ORDER_LIMIT' });
    await prisma.bid.deleteMany({ where: { listingId: leading.id } });
    await prisma.listing.delete({ where: { id: leading.id } });
    await prisma.order.deleteMany({ where: { buyerUserId: fixture.buyer.id } });
    await orderOn(fixture, fixture.buyer.id, 'ACTIVE');
    await orderOn(fixture, fixture.buyer.id, 'ACTIVE');
    const allowed = await postBid(buyer, listingId, 1_000);
    expect(allowed.status).toBe(200);
  });

  it('ignores seller-marked strikes until the delay, and while the buyer report is open', async () => {
    const fixture = await createPermissionFixture(prisma);
    await giveContact(fixture.buyer.id);
    const buyer = await signedIn(fixture.buyer.email, fixture.buyer.password);
    const now = await databaseNow();
    await orderOn(fixture, fixture.buyer.id, 'FAILED', {
      reason: 'BUYER_NO_CONTACT',
      failedAt: now,
    });
    await orderOn(fixture, fixture.buyer.id, 'FAILED', {
      reason: 'BUYER_NO_CONTACT',
      failedAt: now,
    });
    const { listingId } = await liveAuction(fixture);
    expect((await postBid(buyer, listingId, 1_000)).status).toBe(200);

    const aged = new Date(now.getTime() - 73 * 60 * 60 * 1000);
    const first = await orderOn(fixture, fixture.buyer.id, 'FAILED', {
      reason: 'BUYER_NO_CONTACT',
      failedAt: aged,
    });
    await orderOn(fixture, fixture.buyer.id, 'FAILED', {
      reason: 'BUYER_NO_CONTACT',
      failedAt: aged,
    });
    await prisma.report.create({
      data: {
        targetType: 'ORDER',
        targetId: first.id,
        reporterUserId: fixture.buyer.id,
        reason: 'NO_CONTACT',
        status: 'OPEN',
      },
    });
    const other = await spareProduct(fixture, 'Second auction');
    const otherListing = await prisma.listing.create({
      data: {
        productId: other.id,
        sellerUserId: fixture.sellers.approved.id,
        type: 'AUCTION',
        status: 'LIVE',
        currency: 'BYN',
        startsAt: new Date(now.getTime() - 60_000),
        endsAt: new Date(now.getTime() + DAY_MS),
        originalEndsAt: new Date(now.getTime() + DAY_MS),
        currentPriceMinor: 1_000,
        bidCount: 0,
        auctionRules: {
          create: { startPriceMinor: 1_000, stepTableCode: 'BYN_V1' },
        },
      },
    });
    expect((await postBid(buyer, otherListing.id, 1_000, 'aged-one-open')).status).toBe(200);
    await prisma.report.delete({
      where: {
        id: (
          await prisma.report.findFirstOrThrow({ where: { targetId: first.id } })
        ).id,
      },
    });
    const thirdProduct = await spareProduct(fixture, 'Third auction');
    const third = await prisma.listing.create({
      data: {
        productId: thirdProduct.id,
        sellerUserId: fixture.sellers.approved.id,
        type: 'AUCTION',
        status: 'LIVE',
        currency: 'BYN',
        startsAt: new Date(now.getTime() - 60_000),
        endsAt: new Date(now.getTime() + DAY_MS),
        originalEndsAt: new Date(now.getTime() + DAY_MS),
        currentPriceMinor: 1_000,
        bidCount: 0,
        auctionRules: {
          create: { startPriceMinor: 1_000, stepTableCode: 'BYN_V1' },
        },
      },
    });
    const blocked = await postBid(buyer, third.id, 1_000, 'aged-both');
    expect(blocked.status).toBe(403);
    expect(await errorBody(blocked)).toMatchObject({ code: 'BUYER_BLOCKED' });
  });
});

describe('bid history', () => {
  it('shows the latest 20 bids as Участник N without names or contacts', async () => {
    const fixture = await createPermissionFixture(prisma);
    const { listingId } = await liveAuction(fixture);
    const start = new Date('2026-10-01T00:00:00.000Z');
    const secretEmail = `secret.${randomUUID().slice(0, 8)}@wave3.test`;
    for (let index = 0; index < 21; index += 1) {
      const bidder = await prisma.user.create({
        data: {
          email: index === 0 ? secretEmail : `hist.${index}.${randomUUID().slice(0, 8)}@wave3.test`,
          displayName: `SecretName${index}`,
          contactPhone: `+37529000${String(index).padStart(2, '0')}`,
          contactTelegram: `telegram-secret-${index}`,
          passwordHash: fixturePasswordHash,
          emailVerifiedAt: start,
        },
        select: { id: true },
      });
      await prisma.bid.create({
        data: {
          listingId,
          bidderUserId: bidder.id,
          amountMinor: 1_000 + index * 50,
          idempotencyKey: `history-${index}-key`,
          createdAt: new Date(start.getTime() + index * 1_000),
        },
      });
    }
    const response = await client().get(`/listings/${listingId}/bids`);
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      bids: Array<{ amountMinor: number; createdAt: string; participantLabel: string }>;
    };
    expect(body.bids).toHaveLength(20);
    expect(body.bids[0]).toMatchObject({
      amountMinor: 2_000,
      participantLabel: 'Участник 21',
    });
    expect(body.bids[19]).toMatchObject({
      amountMinor: 1_050,
      participantLabel: 'Участник 2',
    });
    expect(body.bids.every((bid) => /^Участник \d+$/.test(bid.participantLabel))).toBe(true);
    const text = JSON.stringify(body);
    expect(text).not.toContain(secretEmail);
    expect(text).not.toContain('SecretName');
    expect(text).not.toContain('+37529');
    expect(text).not.toContain('telegram-secret');
  });

  it('omits voided bids and keeps the original participant numbers', async () => {
    const fixture = await createPermissionFixture(prisma);
    const { listingId } = await liveAuction(fixture);
    const start = new Date('2026-10-01T00:00:00.000Z');
    const ids: string[] = [];
    for (let index = 0; index < 3; index += 1) {
      const bidder = await prisma.user.create({
        data: {
          email: `voidhist.${index}.${randomUUID().slice(0, 8)}@wave3.test`,
          displayName: `Hidden${index}`,
          passwordHash: fixturePasswordHash,
          emailVerifiedAt: start,
        },
        select: { id: true },
      });
      ids.push(bidder.id);
      await prisma.bid.create({
        data: {
          listingId,
          bidderUserId: bidder.id,
          amountMinor: 1_000 + index * 50,
          idempotencyKey: `void-hist-${index}`,
          createdAt: new Date(start.getTime() + index * 1_000),
          ...(index === 1 ? { voidedAt: start, voidReason: 'BANNED' } : {}),
        },
      });
    }
    const response = await client().get(`/listings/${listingId}/bids`);
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      bids: Array<{ amountMinor: number; participantLabel: string }>;
    };
    expect(body.bids.map((bid) => bid.participantLabel)).toEqual([
      'Участник 3',
      'Участник 1',
    ]);
    expect(body.bids.map((bid) => bid.amountMinor)).toEqual([1_100, 1_000]);
    expect(JSON.stringify(body)).not.toContain(ids[1]);
  });
});

describe('bid rate limit', () => {
  it('stops the 11th bid on a listing within a minute and still allows another listing after a new process', async () => {
    const fixture = await createPermissionFixture(prisma);
    await giveContact(fixture.buyer.id);
    const buyer = await signedIn(fixture.buyer.email, fixture.buyer.password);
    const { listingId } = await liveAuction(fixture);
    for (let index = 0; index < 10; index += 1) {
      const response = await postBid(buyer, listingId, 1_000, `rate-${index}-key`);
      expect(response.status).toBe(index === 0 ? 200 : 409);
    }
    const restarted = await createHttpTestApp(database.databaseUrl, 'http://localhost:8081');
    try {
      const again = new HttpTestClient(
        restarted.baseUrl,
        'http://localhost:8081',
        '198.51.100.80',
      );
      const session = buyer.cookie('bidplace_session');
      expect(session).toEqual(expect.any(String));
      again.setCookie('bidplace_session', session!);
      const limited = await postBid(again, listingId, 1_050, 'rate-11-key');
      expect(limited.status).toBe(429);
      expect(await errorBody(limited)).toMatchObject({ code: 'rate_limited' });
      const other = await spareProduct(fixture, 'Other lot');
      const now = await databaseNow();
      const otherListing = await prisma.listing.create({
        data: {
          productId: other.id,
          sellerUserId: fixture.sellers.approved.id,
          type: 'AUCTION',
          status: 'LIVE',
          currency: 'BYN',
          startsAt: new Date(now.getTime() - 60_000),
          endsAt: new Date(now.getTime() + DAY_MS),
          originalEndsAt: new Date(now.getTime() + DAY_MS),
          currentPriceMinor: 1_000,
          bidCount: 0,
          auctionRules: {
            create: { startPriceMinor: 1_000, stepTableCode: 'BYN_V1' },
          },
        },
      });
      const allowed = await postBid(again, otherListing.id, 1_000, 'rate-other-key');
      expect(allowed.status).toBe(200);
    } finally {
      await restarted.close();
    }
  });
});

describe('bid signals and bans', () => {
  it('records a turnstile failure without refusing the first bid in the session', async () => {
    const fixture = await createPermissionFixture(prisma);
    await giveContact(fixture.buyer.id);
    const buyer = await signedIn(fixture.buyer.email, fixture.buyer.password);
    const { listingId } = await liveAuction(fixture);
    const empty = await postBid(buyer, listingId, 1_000, 'turnstile-empty', '');
    expect(empty.status).toBe(200);
    expect(
      await prisma.fraudSignal.count({
        where: { userId: fixture.buyer.id, kind: 'TURNSTILE_FAILED' },
      }),
    ).toBe(1);
    const rival = await extraUser('rival');
    expect((await postBid(rival.client, listingId, 1_500)).status).toBe(200);
    const later = await postBid(buyer, listingId, 2_000, 'turnstile-later', '');
    expect(later.status).toBe(200);
    expect(
      await prisma.fraudSignal.count({
        where: { userId: fixture.buyer.id, kind: 'TURNSTILE_FAILED' },
      }),
    ).toBe(1);
  });

  it('records a bid burst from detectBidBurst and still accepts the bid', async () => {
    const fixture = await createPermissionFixture(prisma);
    await giveContact(fixture.buyer.id);
    const buyer = await signedIn(fixture.buyer.email, fixture.buyer.password);
    const now = await databaseNow();
    const listings = await Promise.all(
      [0, 1, 2].map(async (index) => {
        const product = await spareProduct(fixture, `Burst ${index}`);
        return prisma.listing.create({
          data: {
            productId: product.id,
            sellerUserId: fixture.sellers.approved.id,
            type: 'AUCTION',
            status: 'ENDED',
            currency: 'BYN',
            startsAt: new Date(now.getTime() - DAY_MS),
            endsAt: new Date(now.getTime() - 60_000),
            originalEndsAt: new Date(now.getTime() - 60_000),
            endedAt: new Date(now.getTime() - 60_000),
            currentPriceMinor: 1_000,
            bidCount: 1,
            auctionRules: {
              create: { startPriceMinor: 1_000, stepTableCode: 'BYN_V1' },
            },
          },
          select: { id: true },
        });
      }),
    );
    const recent = new Date(now.getTime() - 1_000);
    for (const [index, listing] of listings.entries()) {
      await prisma.bid.create({
        data: {
          listingId: listing.id,
          bidderUserId: fixture.buyer.id,
          amountMinor: 1_000,
          idempotencyKey: `burst-a-${index}`,
          createdAt: recent,
        },
      });
    }
    await prisma.bid.create({
      data: {
        listingId: listings[0]!.id,
        bidderUserId: fixture.buyer.id,
        amountMinor: 1_500,
        idempotencyKey: 'burst-b-0',
        createdAt: recent,
      },
    });
    const { listingId } = await liveAuction(fixture);
    const response = await postBid(buyer, listingId, 1_000, 'burst-live');
    expect(response.status).toBe(200);
    expect(
      await prisma.fraudSignal.count({
        where: { userId: fixture.buyer.id, kind: 'BID_BURST' },
      }),
    ).toBe(1);
    expect(
      await prisma.purchaseHold.count({
        where: { userId: fixture.buyer.id, releasedAt: null },
      }),
    ).toBe(0);
  });

  it('signals a shared browser with the seller and blocks the next bid after a second kind', async () => {
    const fixture = await createPermissionFixture(prisma);
    await giveContact(fixture.buyer.id);
    const browserId = randomUUID();
    await prisma.analyticsEvent.create({
      data: {
        anonymousId: browserId,
        userId: fixture.sellers.approved.id,
        eventName: 'page_view',
        environment: 'local',
      },
    });
    const signed = signAnalyticsBrowser(browserId, {
      SESSION_SECRET: 'wave-3-http-test-secret',
      APP_ENV: 'local',
    } as ServerEnv);
    const buyer = await signedIn(fixture.buyer.email, fixture.buyer.password);
    buyer.setCookie(ANALYTICS_BROWSER_COOKIE, signed);
    const { listingId } = await liveAuction(fixture);
    const accepted = await postBid(buyer, listingId, 1_000, 'shared-browser', '');
    expect(accepted.status).toBe(200);
    const kinds = await prisma.fraudSignal.findMany({
      where: { userId: fixture.buyer.id },
      select: { kind: true },
    });
    expect(kinds.map((row) => row.kind).sort()).toEqual([
      'SHARED_BROWSER_WITH_SELLER',
      'TURNSTILE_FAILED',
    ]);
    const other = await spareProduct(fixture, 'Next lot');
    const now = await databaseNow();
    const next = await prisma.listing.create({
      data: {
        productId: other.id,
        sellerUserId: fixture.sellers.approved.id,
        type: 'AUCTION',
        status: 'LIVE',
        currency: 'BYN',
        startsAt: new Date(now.getTime() - 60_000),
        endsAt: new Date(now.getTime() + DAY_MS),
        originalEndsAt: new Date(now.getTime() + DAY_MS),
        currentPriceMinor: 1_000,
        bidCount: 0,
        auctionRules: {
          create: { startPriceMinor: 1_000, stepTableCode: 'BYN_V1' },
        },
      },
    });
    const blocked = await postBid(buyer, next.id, 1_000, 'shared-next');
    expect(blocked.status).toBe(403);
    expect(await errorBody(blocked)).toMatchObject({ code: 'BUYER_BLOCKED' });
  });

  it('still accepts a second account of the seller that does not share the browser', async () => {
    const fixture = await createPermissionFixture(prisma);
    const other = await extraUser('second-account');
    const { listingId } = await liveAuction(fixture);
    const response = await postBid(other.client, listingId, 1_000, 'second-account');
    expect(response.status).toBe(200);
    expect(
      await prisma.fraudSignal.count({
        where: { userId: other.id, kind: 'SHARED_BROWSER_WITH_SELLER' },
      }),
    ).toBe(0);
  });

  it('voids the banned user bids on running auctions and recomputes the leader', async () => {
    const fixture = await createPermissionFixture(prisma);
    const leader = await extraUser('leader');
    const other = await extraUser('other');
    const admin = await extraUser('banner');
    await prisma.user.update({
      where: { id: admin.id },
      data: { role: 'admin' },
    });
    const { listingId } = await liveAuction(fixture);
    expect((await postBid(other.client, listingId, 1_000)).status).toBe(200);
    expect((await postBid(leader.client, listingId, 2_000)).status).toBe(200);
    const endedProduct = await spareProduct(fixture, 'Ended auction');
    const ended = await prisma.listing.create({
      data: {
        productId: endedProduct.id,
        sellerUserId: fixture.sellers.approved.id,
        type: 'AUCTION',
        status: 'ENDED',
        currency: 'BYN',
        startsAt: new Date('2026-09-01T00:00:00.000Z'),
        endsAt: new Date('2026-09-03T00:00:00.000Z'),
        originalEndsAt: new Date('2026-09-03T00:00:00.000Z'),
        endedAt: new Date('2026-09-03T00:00:00.000Z'),
        currentPriceMinor: 5_000,
        bidCount: 1,
        auctionRules: {
          create: { startPriceMinor: 1_000, stepTableCode: 'BYN_V1' },
        },
      },
    });
    await prisma.bid.create({
      data: {
        listingId: ended.id,
        bidderUserId: leader.id,
        amountMinor: 5_000,
        idempotencyKey: 'ended-bid-key',
      },
    });
    const ban = await admin.client.patch(`/admin/users/${leader.id}/status`, {
      status: 'banned',
      reason: 'Abuse of the auction',
    });
    expect(ban.status).toBe(200);
    const running = await prisma.bid.findMany({
      where: { listingId },
      orderBy: { amountMinor: 'asc' },
    });
    expect(running.find((bid) => bid.bidderUserId === leader.id)?.voidedAt).toEqual(expect.any(Date));
    expect(running.find((bid) => bid.bidderUserId === other.id)?.voidedAt).toBeNull();
    const listing = await prisma.listing.findUniqueOrThrow({ where: { id: listingId } });
    expect(listing.currentPriceMinor).toBe(1_000);
    expect(listing.bidCount).toBe(1);
    const kept = await prisma.bid.findFirstOrThrow({
      where: { listingId: ended.id, bidderUserId: leader.id },
    });
    expect(kept.voidedAt).toBeNull();
  });

  it('keeps price and leader equal to the highest non-voided bid when a ban races a bid', async () => {
    const fixture = await createPermissionFixture(prisma);
    const bidder = await extraUser('racer');
    const other = await extraUser('steady');
    const admin = await extraUser('ref');
    await prisma.user.update({
      where: { id: admin.id },
      data: { role: 'admin' },
    });
    const { listingId } = await liveAuction(fixture);
    expect((await postBid(other.client, listingId, 2_000)).status).toBe(200);
    const [bidResponse, banResponse] = await Promise.all([
      postBid(bidder.client, listingId, 3_000, 'race-bid'),
      admin.client.patch(`/admin/users/${bidder.id}/status`, {
        status: 'banned',
        reason: 'Race with a bid',
      }),
    ]);
    expect([200, 403]).toContain(bidResponse.status);
    expect(banResponse.status).toBe(200);
    const rows = await prisma.bid.findMany({ where: { listingId } });
    expect(rows.filter((bid) => bid.bidderUserId === bidder.id && bid.voidedAt === null)).toHaveLength(0);
    const listing = await prisma.listing.findUniqueOrThrow({ where: { id: listingId } });
    const live = rows.filter((bid) => bid.voidedAt === null);
    expect(listing.bidCount).toBe(live.length);
    expect(listing.currentPriceMinor).toBe(Math.max(...live.map((bid) => bid.amountMinor)));
    expect(listing.currentPriceMinor).toBe(2_000);
  });

  it('accepts concurrent bids so the price is the highest accepted amount', async () => {
    const fixture = await createPermissionFixture(prisma);
    const { listingId } = await liveAuction(fixture);
    const amounts = [1_000, 1_500, 2_000, 2_500, 3_000, 4_000, 5_000, 8_000];
    const buyers = [];
    for (let index = 0; index < amounts.length; index += 1) {
      buyers.push(await extraUser(`race-${index}`));
    }
    const responses = await Promise.all(
      buyers.map((buyer, index) =>
        postBid(buyer.client, listingId, amounts[index]!, `conc-${index}-key`),
      ),
    );
    expect(responses.every((response) => response.status === 200 || response.status === 409)).toBe(true);
    for (const response of responses) {
      if (response.status === 409) {
        expect(await errorBody(response)).toMatchObject({ code: 'BID_TOO_LOW' });
      }
    }
    const rows = await prisma.bid.findMany({ where: { listingId } });
    const listing = await prisma.listing.findUniqueOrThrow({ where: { id: listingId } });
    const accepted = responses.filter((response) => response.status === 200);
    expect(listing.bidCount).toBe(accepted.length);
    expect(listing.currentPriceMinor).toBe(8_000);
    expect(rows.map((bid) => bid.amountMinor)).toContain(8_000);
    expect(new Set(rows.map((bid) => bid.id)).size).toBe(rows.length);
  });

  it('rejects the bid when the bidder row stays locked until after endsAt', async () => {
    const fixture = await createPermissionFixture(prisma);
    await giveContact(fixture.buyer.id);
    const buyer = await signedIn(fixture.buyer.email, fixture.buyer.password);
    const { listingId } = await liveAuction(fixture);
    let releaseLock: () => void = () => undefined;
    const locked = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });
    const holder = prisma.$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT id FROM users WHERE id = ${fixture.buyer.id}::uuid FOR UPDATE`;
        releaseLock();
        await tx.$queryRaw`SELECT pg_sleep(2)::text`;
      },
      { timeout: 20_000 },
    );
    await locked;
    const endsAt = new Date((await databaseNow()).getTime() + 600);
    await prisma.listing.update({
      where: { id: listingId },
      data: { endsAt },
    });
    const response = await postBid(buyer, listingId, 1_000, 'locked-past-end');
    await holder;
    expect(response.status).toBe(409);
    expect(await errorBody(response)).toMatchObject({ code: 'LISTING_NOT_OPEN' });
  });

  it('rolls the ban back when voiding throws', async () => {
    const { AntifraudService } = await import('../../src/antifraud');
    const fixture = await createPermissionFixture(prisma);
    const leader = await extraUser('void-fail');
    const admin = await extraUser('void-admin');
    await prisma.user.update({
      where: { id: admin.id },
      data: { role: 'admin' },
    });
    const { listingId } = await liveAuction(fixture);
    expect((await postBid(leader.client, listingId, 1_000, 'void-fail-key')).status).toBe(200);
    const unregister = http.app.get(AntifraudService).onBan({
      lockProducts: async () => [],
      voidBids: async (_tx, userId) => {
        if (userId === leader.id) throw new Error('void failed');
      },
    });
    try {
      const ban = await admin.client.patch(`/admin/users/${leader.id}/status`, {
        status: 'banned',
        reason: 'Voiding must roll back',
      });
      expect(ban.status).toBeGreaterThanOrEqual(500);
      const user = await prisma.user.findUniqueOrThrow({ where: { id: leader.id } });
      expect(user.status).toBe('active');
      const bid = await prisma.bid.findFirstOrThrow({
        where: { listingId, bidderUserId: leader.id },
      });
      expect(bid.voidedAt).toBeNull();
    } finally {
      unregister();
    }
  });

  it('finishes a ban beside session revoke and hold release', async () => {
    const fixture = await createPermissionFixture(prisma);
    const leader = await extraUser('beside');
    const admin = await extraUser('beside-admin');
    await prisma.user.update({
      where: { id: admin.id },
      data: { role: 'admin' },
    });
    const { listingId } = await liveAuction(fixture);
    expect((await postBid(leader.client, listingId, 1_000, 'beside-key')).status).toBe(200);
    await prisma.purchaseHold.create({
      data: { userId: leader.id, reason: 'FRAUD_REVIEW' },
    });
    const [ban, revoke, release] = await Promise.all([
      admin.client.patch(`/admin/users/${leader.id}/status`, {
        status: 'banned',
        reason: 'Beside revoke',
      }),
      admin.client.post(`/admin/users/${leader.id}/revoke-sessions`, {
        reason: 'Beside ban',
      }),
      admin.client.post(`/admin/users/${leader.id}/release-hold`, {
        note: 'Beside ban',
      }),
    ]);
    expect(ban.status).toBe(200);
    expect([200, 201]).toContain(revoke.status);
    expect([200, 201]).toContain(release.status);
    const user = await prisma.user.findUniqueOrThrow({ where: { id: leader.id } });
    expect(user.status).toBe('banned');
    const bid = await prisma.bid.findFirstOrThrow({
      where: { listingId, bidderUserId: leader.id },
    });
    expect(bid.voidedAt).toEqual(expect.any(Date));
  });

  it('returns the stored voided bid when the same key is replayed', async () => {
    const { BidsService } = await import('../../src/commerce/bids.service');
    const fixture = await createPermissionFixture(prisma);
    const leader = await extraUser('replay-void');
    const other = await extraUser('replay-other');
    const admin = await extraUser('replay-admin');
    await prisma.user.update({
      where: { id: admin.id },
      data: { role: 'admin' },
    });
    const { listingId } = await liveAuction(fixture);
    expect((await postBid(other.client, listingId, 1_000, 'replay-other-key')).status).toBe(200);
    const first = await postBid(leader.client, listingId, 2_000, 'replay-void-key');
    expect(first.status).toBe(200);
    const firstBody = (await first.json()) as { bid: { id: string } };
    const ban = await admin.client.patch(`/admin/users/${leader.id}/status`, {
      status: 'banned',
      reason: 'Replay after void',
    });
    expect(ban.status).toBe(200);
    const again = await http.app.get(BidsService).placeBid(leader.id, listingId, {
      amountMinor: 2_000,
      idempotencyKey: 'replay-void-key',
      ip: '198.51.100.70',
      browserId: null,
      checkTurnstile: false,
    });
    expect(again.bid.id).toBe(firstBody.bid.id);
    expect(again.bid.amountMinor).toBe(2_000);
    expect(again.lot.priceMinor).toBe(1_000);
    expect(again.lot.bidCount).toBe(1);
  });
});
