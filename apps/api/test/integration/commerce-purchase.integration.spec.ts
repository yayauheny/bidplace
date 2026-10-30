import { randomUUID } from 'node:crypto';

import { type PrismaClient } from '@bidplace/database';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import {
  ANALYTICS_BROWSER_COOKIE,
  signAnalyticsBrowser,
} from '../../src/analytics/browser-attribution';
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
  await prisma.purchaseHold.deleteMany();
  await prisma.fraudSignal.deleteMany();
  await prisma.analyticsEvent.deleteMany();
  await resetPermissionFixture(prisma);
});

afterAll(async () => {
  await http?.close();
  await database?.cleanup();
});

const HOUR_MS = 60 * 60 * 1000;
const PASS = 'XXXX.DUMMY.TOKEN.XXXX';
let dealSerial = 0;
let clientSerial = 0;

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

function client() {
  clientSerial += 1;
  return new HttpTestClient(
    http.baseUrl,
    'http://localhost:8081',
    `198.51.100.${clientSerial}`,
  );
}

async function signedIn(email: string, password: string) {
  const next = client();
  await login(next, email, password);
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
  return {
    ...user,
    client: await signedIn(email, 'password123'),
  };
}

type PurchaseBody = {
  order: {
    publicId: string;
    dealCode: string;
    status: string;
    source: string;
    amountMinor: number;
    currency: string;
    activatedAt: string;
    contactDeadlineAt: string;
    buyerComment: string | null;
  };
  lot: {
    effectiveStatus: string;
    mark: string | null;
    priceMinor: number | null;
  };
};

function postPurchase(
  actor: HttpTestClient,
  listingId: string,
  idempotencyKey: string,
  comment?: string,
  turnstileToken: string | null = PASS,
) {
  return actor.post(`/listings/${listingId}/purchase`, {
    idempotencyKey,
    ...(comment === undefined ? {} : { comment }),
    ...(turnstileToken === null ? {} : { turnstileToken }),
  });
}

async function fixedListing(
  fixture: PermissionFixture,
  contactWindowHours = 6,
) {
  const seller = await signedIn(
    fixture.sellers.approved.email,
    fixture.sellers.approved.password,
  );
  const product = await prisma.product.findUniqueOrThrow({
    where: { id: fixture.approvedProductId },
    select: {
      id: true,
      publicId: true,
      title: true,
      images: { orderBy: { position: 'asc' }, select: { id: true }, take: 1 },
    },
  });
  const now = await databaseNow();
  const created = await seller.post(`/works/${product.id}/listings`, {
    type: 'FIXED',
    currency: 'BYN',
    priceMinor: 1_500,
    startsAt: new Date(now.getTime() - 1_000).toISOString(),
    contactWindowHours,
  });
  expect(created.status).toBe(201);
  const body = (await created.json()) as { id: string };
  return { seller, product, listingId: body.id };
}

async function anotherFixedListing(fixture: PermissionFixture) {
  const product = await spareProduct(fixture, `Next ${randomUUID().slice(0, 8)}`);
  const now = await databaseNow();
  const listing = await prisma.listing.create({
    data: {
      productId: product.id,
      sellerUserId: fixture.sellers.approved.id,
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

async function spareProduct(fixture: PermissionFixture, title: string) {
  return prisma.product.create({
    data: {
      publicId: `p${randomUUID().replace(/-/g, '').slice(0, 10)}`,
      sellerProfileId: fixture.sellers.approved.profileId,
      title,
      status: 'APPROVED',
    },
    select: { id: true, publicId: true },
  });
}

async function orderOn(
  fixture: PermissionFixture,
  buyerId: string,
  status: 'ACTIVE' | 'FAILED',
  fail?: { reason: 'BUYER_REFUSED'; failedAt: Date },
) {
  const product = await spareProduct(fixture, `Order ${randomUUID().slice(0, 8)}`);
  const listing = await prisma.listing.create({
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
      ...(fail
        ? {
            failReason: fail.reason,
            faultSide: 'BUYER' as const,
            failedAt: fail.failedAt,
          }
        : {}),
      workTitleSnapshot: titleOf(product.publicId),
      workPublicIdSnapshot: product.publicId,
      sellerNameSnapshot: 'Wave 3 APPROVED',
    },
    select: { id: true },
  });
}

function titleOf(value: string): string {
  return value.slice(0, 200);
}

describe('fixed price purchase', () => {
  it('reserves a fixed-price work for the buyer', async () => {
    const fixture = await createPermissionFixture(prisma);
    await giveContact(fixture.buyer.id);
    const buyer = await signedIn(fixture.buyer.email, fixture.buyer.password);
    const { product, listingId } = await fixedListing(fixture, 6);
    const before = await databaseNow();
    const response = await postPurchase(
      buyer,
      listingId,
      'purchase-key-1',
      'Заберу вечером',
    );
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    const body = (await response.json()) as PurchaseBody;
    expect(body.order.publicId).toMatch(/^[A-Za-z0-9_-]{11}$/);
    expect(body.order.publicId).not.toBe('BP-7K3M9Q');
    expect(body.order.dealCode).toMatch(/^\d{6}$/);
    expect(body.order).toMatchObject({
      status: 'ACTIVE',
      source: 'FIXED_PURCHASE',
      amountMinor: 1_500,
      currency: 'BYN',
      buyerComment: 'Заберу вечером',
    });
    expect(body.lot).toMatchObject({
      effectiveStatus: 'ENDED',
      mark: 'RESERVED',
      priceMinor: 1_500,
    });
    expect(body.lot.mark).not.toBe('SOLD');

    const order = await prisma.order.findFirstOrThrow({ where: { listingId } });
    expect(order.publicId).toBe(body.order.publicId);
    expect(order.dealCode).toBe(body.order.dealCode);
    expect(order.status).toBe('ACTIVE');
    expect(order.workTitleSnapshot).toBe(product.title);
    expect(order.workPublicIdSnapshot).toBe(product.publicId);
    expect(order.coverImageIdSnapshot).toBe(product.images[0]?.id ?? null);
    expect(order.sellerNameSnapshot).toBe('Wave 3 APPROVED');
    expect(order.activatedAt).toEqual(order.createdAt);
    const deadline =
      order.contactDeadlineAt!.getTime() - order.activatedAt!.getTime();
    expect(deadline).toBe(6 * HOUR_MS);
    expect(order.activatedAt!.getTime()).toBeGreaterThanOrEqual(before.getTime() - 1_000);
    expect(
      await prisma.listing.findUniqueOrThrow({ where: { id: listingId } }),
    ).toMatchObject({ status: 'ENDED' });

    const letters = await prisma.notificationOutbox.findMany({
      where: { kind: { in: ['PURCHASED', 'LISTING_SOLD'] } },
    });
    expect(letters).toHaveLength(2);
    const buyerLetter = letters.find((row) => row.userId === fixture.buyer.id);
    const sellerLetter = letters.find(
      (row) => row.userId === fixture.sellers.approved.id,
    );
    expect(buyerLetter?.kind).toBe('PURCHASED');
    expect(sellerLetter?.kind).toBe('LISTING_SOLD');
    expect(buyerLetter?.payload).toMatchObject({
      orderPublicId: order.publicId,
      listingId,
      comment: 'Заберу вечером',
    });
    expect(sellerLetter?.payload).toMatchObject({
      orderPublicId: order.publicId,
      listingId,
    });
    const dumped = JSON.stringify(letters.map((row) => row.payload));
    expect(dumped).not.toContain(order.dealCode);
    expect(dumped).not.toContain('+375291112233');

    const lot = await buyer.get(`/works/${product.publicId}/lot`);
    expect(lot.status).toBe(200);
    expect(await lot.json()).toMatchObject({
      effectiveStatus: 'ENDED',
      mark: 'RESERVED',
    });
  });

  it('returns the same order for the same key and refuses another key', async () => {
    const fixture = await createPermissionFixture(prisma);
    await giveContact(fixture.buyer.id);
    const buyer = await signedIn(fixture.buyer.email, fixture.buyer.password);
    const { listingId } = await fixedListing(fixture);
    const first = await postPurchase(buyer, listingId, 'same-purchase-key', 'Первый');
    const second = await postPurchase(buyer, listingId, 'same-purchase-key', 'Второй');
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    const firstBody = (await first.json()) as PurchaseBody;
    const secondBody = (await second.json()) as PurchaseBody;
    expect(secondBody.order).toEqual(firstBody.order);
    expect(secondBody.lot.mark).toBe('RESERVED');
    expect(await prisma.order.count({ where: { listingId } })).toBe(1);
    expect(
      await prisma.notificationOutbox.count({
        where: { kind: { in: ['PURCHASED', 'LISTING_SOLD'] } },
      }),
    ).toBe(2);

    const other = await postPurchase(buyer, listingId, 'other-purchase-key');
    expect(other.status).toBe(409);
    expect(await errorBody(other)).toMatchObject({ code: 'LISTING_NOT_OPEN' });
    expect(await prisma.order.count({ where: { listingId } })).toBe(1);
  });

  it('rejects a deal code in the body or query and does not look one up', async () => {
    const fixture = await createPermissionFixture(prisma);
    await giveContact(fixture.buyer.id);
    const buyer = await signedIn(fixture.buyer.email, fixture.buyer.password);
    const { listingId } = await fixedListing(fixture);
    const rejected = await buyer.post(
      `/listings/${listingId}/purchase?dealCode=123456`,
      {
        idempotencyKey: 'reject-deal-code',
        dealCode: '123456',
        turnstileToken: PASS,
      },
    );
    expect(rejected.status).toBe(400);
    expect(await prisma.order.count({ where: { listingId } })).toBe(0);
    const lookup = await buyer.get('/orders/123456');
    expect(lookup.status).toBe(404);
  });

  it('lets one of two parallel purchases reserve the work', async () => {
    const fixture = await createPermissionFixture(prisma);
    await giveContact(fixture.buyer.id);
    const buyer = await signedIn(fixture.buyer.email, fixture.buyer.password);
    const rival = await extraUser('rival');
    const { listingId, product } = await fixedListing(fixture);
    const [left, right] = await Promise.all([
      postPurchase(buyer, listingId, 'parallel-a'),
      postPurchase(rival.client, listingId, 'parallel-b'),
    ]);
    const statuses = [left.status, right.status].sort((a, b) => a - b);
    expect(statuses).toEqual([200, 409]);
    const lost = left.status === 409 ? left : right;
    expect(await errorBody(lost)).toMatchObject({ code: 'LISTING_NOT_OPEN' });
    expect(
      await prisma.order.count({
        where: { productId: product.id, status: { in: ['ACTIVE', 'OFFERED'] } },
      }),
    ).toBe(1);
  });

  it('lets one of four parallel purchases open an order', async () => {
    const fixture = await createPermissionFixture(prisma);
    await giveContact(fixture.buyer.id);
    const buyers = [await signedIn(fixture.buyer.email, fixture.buyer.password)];
    for (const label of ['m-two', 'm-three', 'm-four']) {
      buyers.push((await extraUser(label)).client);
    }
    const { listingId, product } = await fixedListing(fixture);
    const responses = await Promise.all(
      buyers.map((actor, index) =>
        postPurchase(actor, listingId, `modest-${index}`),
      ),
    );
    expect(responses.filter((response) => response.status === 200)).toHaveLength(1);
    for (const response of responses) {
      if (response.status === 200) continue;
      expect(response.status).toBe(409);
      expect(await errorBody(response)).toMatchObject({ code: 'LISTING_NOT_OPEN' });
    }
    expect(
      await prisma.order.count({
        where: { productId: product.id, status: { in: ['ACTIVE', 'OFFERED'] } },
      }),
    ).toBe(1);
  });

  it.each([
    ['a withdrawn listing', 'LISTING_NOT_OPEN', 409],
    ['an auction', 'LISTING_NOT_OPEN', 409],
    ['the seller', 'SELF_BID_FORBIDDEN', 403],
    ['an administrator', 'ADMIN_BID_FORBIDDEN', 403],
    ['three active orders', 'BUYER_ORDER_LIMIT', 403],
    ['two buyer strikes', 'BUYER_BLOCKED', 403],
    ['a buyer without contacts', 'BUYER_CONTACTS_REQUIRED', 403],
    ['a purchase hold', 'BUYER_BLOCKED', 403],
  ] as const)('%s → %s', async (name, code, status) => {
    const fixture = await createPermissionFixture(prisma);
    if (name !== 'a buyer without contacts') await giveContact(fixture.buyer.id);
    const buyer = await signedIn(fixture.buyer.email, fixture.buyer.password);

    if (name === 'a withdrawn listing') {
      const { seller, listingId } = await fixedListing(fixture);
      expect((await seller.post(`/listings/${listingId}/cancel`)).status).toBe(201);
      const response = await postPurchase(buyer, listingId, 'withdrawn-key');
      expect(response.status).toBe(status);
      expect(await errorBody(response)).toMatchObject({ code });
      expect(await prisma.order.count({ where: { listingId } })).toBe(0);
      return;
    }

    if (name === 'an auction') {
      const seller = await signedIn(
        fixture.sellers.approved.email,
        fixture.sellers.approved.password,
      );
      const now = await databaseNow();
      const created = await seller.post(
        `/works/${fixture.approvedProductId}/listings`,
        {
          type: 'AUCTION',
          currency: 'BYN',
          startPriceMinor: 1_000,
          startsAt: new Date(now.getTime() - 1_000).toISOString(),
          endsAt: new Date(now.getTime() + 2 * 24 * HOUR_MS).toISOString(),
        },
      );
      expect(created.status).toBe(201);
      const listingId = ((await created.json()) as { id: string }).id;
      const response = await postPurchase(buyer, listingId, 'auction-key');
      expect(response.status).toBe(status);
      expect(await errorBody(response)).toMatchObject({ code });
      return;
    }

    const { seller, listingId } = await fixedListing(fixture);
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
    if (name === 'a purchase hold') {
      await prisma.purchaseHold.create({
        data: { userId: fixture.buyer.id, reason: 'FRAUD_REVIEW' },
      });
    }

    const actor =
      name === 'the seller'
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
    const response = await postPurchase(
      actor,
      listingId,
      `refuse-${name.replace(/[^A-Za-z0-9_-]/g, '-')}`,
    );
    expect(response.status).toBe(status);
    expect(await errorBody(response)).toMatchObject({ code });
    expect(await prisma.order.count({ where: { listingId } })).toBe(0);
  });

  it('refuses a purchase when the author is no longer approved', async () => {
    const fixture = await createPermissionFixture(prisma);
    await giveContact(fixture.buyer.id);
    const buyer = await signedIn(fixture.buyer.email, fixture.buyer.password);
    const { listingId } = await fixedListing(fixture);
    await prisma.sellerProfile.update({
      where: { id: fixture.sellers.approved.profileId },
      data: { status: 'SUSPENDED' },
    });
    const response = await postPurchase(buyer, listingId, 'suspended-author');
    expect(response.status).toBe(403);
    expect(await errorBody(response)).toMatchObject({ code: 'forbidden' });
    expect(await prisma.order.count({ where: { listingId } })).toBe(0);
    expect(
      await prisma.listing.findUniqueOrThrow({ where: { id: listingId } }),
    ).toMatchObject({ status: 'LIVE' });
  });

  it('refuses author cancel once an order exists', async () => {
    const fixture = await createPermissionFixture(prisma);
    await giveContact(fixture.buyer.id);
    const buyer = await signedIn(fixture.buyer.email, fixture.buyer.password);
    const { seller, listingId } = await fixedListing(fixture);
    expect((await postPurchase(buyer, listingId, 'cancel-after')).status).toBe(200);
    const refused = await seller.post(`/listings/${listingId}/cancel`);
    expect(refused.status).toBe(409);
    expect(await errorBody(refused)).toMatchObject({ code: 'conflict' });
    expect(
      await prisma.listing.findUniqueOrThrow({ where: { id: listingId } }),
    ).toMatchObject({ status: 'ENDED' });
    expect(
      await prisma.order.count({ where: { listingId, status: 'ACTIVE' } }),
    ).toBe(1);
  });

  it('refuses author cancel after a purchase without writing again', async () => {
    const fixture = await createPermissionFixture(prisma);
    await giveContact(fixture.buyer.id);
    const buyer = await signedIn(fixture.buyer.email, fixture.buyer.password);
    const { seller, listingId } = await fixedListing(fixture);
    expect((await postPurchase(buyer, listingId, 'cancel-no-write')).status).toBe(200);
    const before = await prisma.listing.findUniqueOrThrow({ where: { id: listingId } });
    const refused = await seller.post(`/listings/${listingId}/cancel`);
    expect(refused.status).toBe(409);
    expect(await errorBody(refused)).toMatchObject({ code: 'conflict' });
    expect(await prisma.listing.findUniqueOrThrow({ where: { id: listingId } })).toEqual(
      before,
    );
  });

  it('checks Turnstile on every purchase in the session', async () => {
    const fixture = await createPermissionFixture(prisma);
    await giveContact(fixture.buyer.id);
    const buyer = await signedIn(fixture.buyer.email, fixture.buyer.password);
    const first = await fixedListing(fixture);
    expect((await postPurchase(buyer, first.listingId, 'turnstile-first')).status).toBe(200);
    expect(
      await prisma.fraudSignal.count({
        where: { userId: fixture.buyer.id, kind: 'TURNSTILE_FAILED' },
      }),
    ).toBe(0);
    const second = await anotherFixedListing(fixture);
    const checked = await postPurchase(
      buyer,
      second.listingId,
      'turnstile-second',
      undefined,
      'bad-turnstile-token',
    );
    expect(checked.status).toBe(200);
    expect(
      await prisma.fraudSignal.count({
        where: { userId: fixture.buyer.id, kind: 'TURNSTILE_FAILED' },
      }),
    ).toBe(1);
  });

  it('records a shared browser when the author second account buys and blocks the next purchase', async () => {
    const fixture = await createPermissionFixture(prisma);
    const browserId = randomUUID();
    await prisma.analyticsEvent.create({
      data: {
        anonymousId: browserId,
        userId: fixture.sellers.approved.id,
        eventName: 'page_view',
        environment: 'local',
      },
    });
    const second = await extraUser('author-second');
    second.client.setCookie(
      ANALYTICS_BROWSER_COOKIE,
      signAnalyticsBrowser(browserId, {
        SESSION_SECRET: 'wave-3-http-test-secret',
        APP_ENV: 'local',
      } as ServerEnv),
    );
    const first = await fixedListing(fixture);
    const accepted = await postPurchase(
      second.client,
      first.listingId,
      'shared-buy',
      undefined,
      'bad-turnstile-token',
    );
    expect(accepted.status).toBe(200);
    const kinds = await prisma.fraudSignal.findMany({
      where: { userId: second.id },
      select: { kind: true },
    });
    expect(kinds.map((row) => row.kind).sort()).toEqual([
      'SHARED_BROWSER_WITH_SELLER',
      'TURNSTILE_FAILED',
    ]);
    const next = await anotherFixedListing(fixture);
    const blocked = await postPurchase(second.client, next.listingId, 'shared-next');
    expect(blocked.status).toBe(403);
    expect(await errorBody(blocked)).toMatchObject({ code: 'BUYER_BLOCKED' });
  });

  it('lets exactly one of cancel and purchase commit', async () => {
    const fixture = await createPermissionFixture(prisma);
    await giveContact(fixture.buyer.id);
    const buyer = await signedIn(fixture.buyer.email, fixture.buyer.password);
    const { seller, listingId } = await fixedListing(fixture);
    const [purchase, cancel] = await Promise.all([
      postPurchase(buyer, listingId, 'cancel-race'),
      seller.post(`/listings/${listingId}/cancel`),
    ]);
    const listing = await prisma.listing.findUniqueOrThrow({
      where: { id: listingId },
    });
    const openOrders = await prisma.order.count({
      where: { listingId, status: { in: ['ACTIVE', 'OFFERED'] } },
    });
    if (purchase.status === 200) {
      expect(cancel.status).toBe(409);
      expect(listing.status).toBe('ENDED');
      expect(openOrders).toBe(1);
      return;
    }
    expect(purchase.status).toBe(409);
    expect(await errorBody(purchase)).toMatchObject({ code: 'LISTING_NOT_OPEN' });
    expect(cancel.status).toBe(201);
    expect(listing.status).toBe('CANCELLED');
    expect(openOrders).toBe(0);
  });

  it.each([
    ['BUYER_REFUSED', 'buyer', false],
    ['SELLER_REFUSED', 'seller', false],
    ['BUYER_NO_CONTACT', 'seller', true],
    ['BUYER_INVALID_CONTACTS', 'seller', true],
    ['ADMIN_CANCELLED', 'admin', false],
  ] as const)(
    'failing a fixed-price order as %s returns the listing to sale',
    async (reason, actor, pastDeadline) => {
      const fixture = await createPermissionFixture(prisma);
      await giveContact(fixture.buyer.id);
      const buyer = await signedIn(fixture.buyer.email, fixture.buyer.password);
      const { product, listingId } = await fixedListing(fixture);
      expect((await postPurchase(buyer, listingId, `fail-${reason}`)).status).toBe(200);
      const order = await prisma.order.findFirstOrThrow({ where: { listingId } });
      if (pastDeadline) {
        await prisma.order.update({
          where: { id: order.id },
          data: { contactDeadlineAt: new Date('2020-01-01T00:00:00.000Z') },
        });
      }
      const { OrdersService } = await import('../../src/commerce/orders.service');
      await http.app.get(OrdersService).failFixedPriceReservation({
        orderId: order.id,
        actor,
        failReason: reason,
      });
      expect(
        await prisma.listing.findUniqueOrThrow({ where: { id: listingId } }),
      ).toMatchObject({ status: 'LIVE', endedAt: null });
      expect(
        await prisma.order.findUniqueOrThrow({ where: { id: order.id } }),
      ).toMatchObject({ status: 'FAILED', failReason: reason });
      const lot = await buyer.get(`/works/${product.publicId}/lot`);
      const lotBody = (await lot.json()) as { mark: string | null; effectiveStatus: string };
      expect(lotBody.effectiveStatus).toBe('LIVE');
      expect(lotBody.mark).toBe('BUY');
      expect(lotBody.mark).not.toBe('RESERVED');
      expect(lotBody.mark).not.toBe('SOLD');
    },
  );

  it('opens exactly one order when a new purchase races a restored listing', async () => {
    const fixture = await createPermissionFixture(prisma);
    await giveContact(fixture.buyer.id);
    const first = await signedIn(fixture.buyer.email, fixture.buyer.password);
    const { listingId, product } = await fixedListing(fixture);
    expect((await postPurchase(first, listingId, 'before-fail')).status).toBe(200);
    const order = await prisma.order.findFirstOrThrow({ where: { listingId } });
    const { OrdersService } = await import('../../src/commerce/orders.service');
    await http.app.get(OrdersService).failFixedPriceReservation({
      orderId: order.id,
      actor: 'seller',
      failReason: 'SELLER_REFUSED',
    });
    const buyers = [
      first,
      (await extraUser('again-two')).client,
      (await extraUser('again-three')).client,
      (await extraUser('again-four')).client,
    ];
    const responses = await Promise.all(
      buyers.map((actor, index) =>
        postPurchase(actor, listingId, `again-key-${index}`),
      ),
    );
    expect(responses.filter((response) => response.status === 200)).toHaveLength(1);
    for (const response of responses) {
      if (response.status === 200) continue;
      expect(response.status).toBe(409);
      expect(await errorBody(response)).toMatchObject({ code: 'LISTING_NOT_OPEN' });
    }
    expect(
      await prisma.order.count({
        where: { productId: product.id, status: { in: ['ACTIVE', 'OFFERED'] } },
      }),
    ).toBe(1);
  });

  it('keeps one open order when failure races new purchases', async () => {
    const fixture = await createPermissionFixture(prisma);
    await giveContact(fixture.buyer.id);
    const first = await signedIn(fixture.buyer.email, fixture.buyer.password);
    const { listingId, product } = await fixedListing(fixture);
    expect((await postPurchase(first, listingId, 'race-fail-before')).status).toBe(200);
    const order = await prisma.order.findFirstOrThrow({ where: { listingId } });
    const buyers = [
      first,
      (await extraUser('race-two')).client,
      (await extraUser('race-three')).client,
      (await extraUser('race-four')).client,
    ];
    const { OrdersService } = await import('../../src/commerce/orders.service');
    const responses = await Promise.all([
      ...buyers.map((actor, index) =>
        postPurchase(actor, listingId, `race-key-${index}`),
      ),
      http.app.get(OrdersService).failFixedPriceReservation({
        orderId: order.id,
        actor: 'seller',
        failReason: 'SELLER_REFUSED',
      }),
    ]);
    const purchases = responses.slice(0, buyers.length) as Response[];
    for (const response of purchases) {
      expect([200, 409]).toContain(response.status);
      if (response.status === 409) {
        expect(await errorBody(response)).toMatchObject({ code: 'LISTING_NOT_OPEN' });
      }
    }
    const open = await prisma.order.count({
      where: { productId: product.id, status: { in: ['ACTIVE', 'OFFERED'] } },
    });
    expect(open).toBeLessThanOrEqual(1);
    expect(purchases.filter((response) => response.status === 200)).toHaveLength(open);
    const listing = await prisma.listing.findUniqueOrThrow({ where: { id: listingId } });
    expect(listing.status).toBe(open === 1 ? 'ENDED' : 'LIVE');
    expect(
      await prisma.order.findUniqueOrThrow({ where: { id: order.id } }),
    ).toMatchObject({ status: 'FAILED', failReason: 'SELLER_REFUSED' });
  });
});
