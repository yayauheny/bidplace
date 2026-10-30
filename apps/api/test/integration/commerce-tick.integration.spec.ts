import { randomUUID } from 'node:crypto';

import { type PrismaClient } from '@bidplace/database';
import { Logger } from '@nestjs/common';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { CommerceTickService } from '../../src/commerce/commerce-tick';
import { TickService } from '../../src/core/tick/tick.service';
import {
  renderNotification,
  type NotificationKind,
} from '../../src/notifications/notification-outbox';
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
}, 30_000);

afterEach(async () => {
  await prisma.notificationOutbox.deleteMany();
  await prisma.purchaseHold.deleteMany();
  await prisma.report.deleteMany();
  await resetPermissionFixture(prisma);
});

afterAll(async () => {
  await http?.close();
  await database?.cleanup();
});

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const PASS = 'XXXX.DUMMY.TOKEN.XXXX';

async function databaseNow(): Promise<Date> {
  const [row] = await prisma.$queryRaw<Array<{ now: Date }>>`
    SELECT clock_timestamp() AS now
  `;
  return row!.now;
}

async function buyer(label: string) {
  return prisma.user.create({
    data: {
      email: `${label}.${randomUUID().slice(0, 8)}@wave3.test`,
      displayName: label,
      emailVerifiedAt: new Date('2026-09-01T00:00:00.000Z'),
    },
    select: { id: true, email: true },
  });
}

async function signedBidder(label: string) {
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
  const client = new HttpTestClient(
    http.baseUrl,
    'http://localhost:8081',
    '198.51.100.24',
  );
  const login = await client.post('/auth/login', {
    email,
    password: 'password123',
  });
  expect(login.status).toBe(201);
  return { ...user, client };
}

async function work(fixture: PermissionFixture, title: string) {
  return prisma.product.create({
    data: {
      publicId: `p${randomUUID().replace(/-/g, '').slice(0, 10)}`,
      sellerProfileId: fixture.sellers.approved.profileId,
      title,
      status: 'APPROVED',
    },
    select: { id: true, title: true },
  });
}

async function liveAuction(
  fixture: PermissionFixture,
  title: string,
  endsAt: Date,
  bids: Array<{
    bidderUserId: string;
    amountMinor: number;
    voidedAt?: Date;
  }>,
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
      currentPriceMinor: bids[0]?.amountMinor ?? 1_000,
      bidCount: bids.length,
      auctionRules: {
        create: { startPriceMinor: 1_000, stepTableCode: 'BYN_V1' },
      },
    },
    select: { id: true, productId: true },
  });
  const storedBids = [];
  for (const [index, bid] of bids.entries()) {
    storedBids.push(
      await prisma.bid.create({
        data: {
          listingId: listing.id,
          bidderUserId: bid.bidderUserId,
          amountMinor: bid.amountMinor,
          idempotencyKey: `bid-${listing.id}-${index}`,
          createdAt: new Date(endsAt.getTime() - (bids.length - index) * 1_000),
          ...(bid.voidedAt === undefined ? {} : { voidedAt: bid.voidedAt }),
        },
        select: { id: true, bidderUserId: true, amountMinor: true },
      }),
    );
  }
  return { product, listing, bids: storedBids };
}

function payloadRecord(value: unknown): Record<string, string | number> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('notification payload is invalid');
  }
  const payload: Record<string, string | number> = {};
  for (const [key, item] of Object.entries(value)) {
    if (typeof item === 'string' || typeof item === 'number') payload[key] = item;
  }
  return payload;
}

function rendered(kind: string, payload: unknown) {
  return renderNotification(kind as NotificationKind, payloadRecord(payload));
}

describe('commerce tick', () => {
  it('closes a past auction onto one AUCTION_WIN order and letters both parties', async () => {
    const fixture = await createPermissionFixture(prisma);
    const now = await databaseNow();
    const high = await buyer('high');
    const low = await buyer('low');
    const auction = await liveAuction(
      fixture,
      'Closed with bids',
      new Date(now.getTime() - 60_000),
      [
        { bidderUserId: low.id, amountMinor: 1_200 },
        { bidderUserId: high.id, amountMinor: 2_500 },
      ],
    );

    const tick = http.app.get(TickService);
    const result = await tick.run();

    expect(result.skipped).toBe(false);
    expect(result.jobs.find((job) => job.name === 'commerce.close')).toMatchObject({
      failed: false,
    });
    const orders = await prisma.order.findMany({
      where: { listingId: auction.listing.id },
    });
    expect(orders).toHaveLength(1);
    const order = orders[0]!;
    expect(order).toMatchObject({
      source: 'AUCTION_WIN',
      status: 'ACTIVE',
      buyerUserId: high.id,
      amountMinor: 2_500,
      sourceBidId: auction.bids[1]!.id,
      sellerUserId: fixture.sellers.approved.id,
    });
    expect(order.publicId).toMatch(/^[A-Za-z0-9_-]{11}$/);
    expect(order.dealCode).toMatch(/^\d{6}$/);
    expect(order.activatedAt).toBeInstanceOf(Date);
    expect(order.contactDeadlineAt!.getTime() - order.activatedAt!.getTime()).toBe(
      24 * HOUR_MS,
    );
    const listing = await prisma.listing.findUniqueOrThrow({
      where: { id: auction.listing.id },
    });
    expect(listing.status).toBe('ENDED');
    expect(listing.endedAt).toBeInstanceOf(Date);

    const letters = await prisma.notificationOutbox.findMany({
      where: { userId: { in: [high.id, fixture.sellers.approved.id] } },
    });
    expect(letters.map((letter) => letter.kind).sort()).toEqual([
      'AUCTION_ENDED',
      'BID_WON',
    ]);
    const buyerLetter = letters.find((letter) => letter.userId === high.id)!;
    const authorLetter = letters.find(
      (letter) => letter.userId === fixture.sellers.approved.id,
    )!;
    expect(buyerLetter.kind).toBe('BID_WON');
    expect(rendered(buyerLetter.kind, buyerLetter.payload).subject).toContain(
      'Ваша ставка лучшая',
    );
    expect(authorLetter.kind).toBe('AUCTION_ENDED');
    const authorCopy = rendered(authorLetter.kind, authorLetter.payload);
    expect(authorCopy.subject).toContain('Аукцион завершён');
    expect(authorCopy.text).not.toContain('забронирован');
    expect(authorCopy.text).not.toContain('без ставок');
    expect(JSON.stringify(authorLetter.payload)).not.toContain('@');
    expect(JSON.stringify(buyerLetter.payload)).not.toContain('@');
  });

  it('ends an auction with no bids and letters only the author', async () => {
    const fixture = await createPermissionFixture(prisma);
    const now = await databaseNow();
    const auction = await liveAuction(
      fixture,
      'Closed without bids',
      new Date(now.getTime() - 60_000),
      [],
    );

    await http.app.get(TickService).run();

    expect(
      await prisma.order.count({ where: { listingId: auction.listing.id } }),
    ).toBe(0);
    const listing = await prisma.listing.findUniqueOrThrow({
      where: { id: auction.listing.id },
    });
    expect(listing.status).toBe('ENDED');
    const letters = await prisma.notificationOutbox.findMany({
      where: { userId: fixture.sellers.approved.id },
    });
    expect(letters).toHaveLength(1);
    expect(letters[0]!.kind).toBe('AUCTION_ENDED_NO_BIDS');
    const copy = rendered(letters[0]!.kind, letters[0]!.payload);
    expect(copy.subject).toContain('Аукцион завершён');
    expect(copy.text).toContain('без ставок');
    expect(JSON.stringify(letters[0]!.payload)).not.toContain('@');
  });

  it('lets two overlapping closes create one order and no duplicate letters', async () => {
    const fixture = await createPermissionFixture(prisma);
    const now = await databaseNow();
    const winner = await buyer('parallel');
    const auction = await liveAuction(
      fixture,
      'Parallel close',
      new Date(now.getTime() - 60_000),
      [{ bidderUserId: winner.id, amountMinor: 1_800 }],
    );
    const jobs = http.app.get(CommerceTickService);
    const deadline = Date.now() + 20_000;

    await Promise.all([jobs.closeDue(deadline), jobs.closeDue(deadline)]);

    expect(
      await prisma.order.count({ where: { listingId: auction.listing.id } }),
    ).toBe(1);
    const letters = await prisma.notificationOutbox.findMany({
      where: {
        userId: { in: [winner.id, fixture.sellers.approved.id] },
      },
    });
    expect(letters.map((letter) => letter.kind).sort()).toEqual([
      'AUCTION_ENDED',
      'BID_WON',
    ]);
  });

  it('awards the highest non-voided bid and does not pass over a held leader', async () => {
    const fixture = await createPermissionFixture(prisma);
    const now = await databaseNow();
    const voided = await buyer('voided');
    const held = await buyer('held');
    const blocked = await buyer('blocked');
    const eligible = await buyer('eligible');
    await prisma.purchaseHold.create({
      data: { userId: held.id, reason: 'FRAUD_REVIEW' },
    });
    for (const index of [0, 1]) {
      const product = await work(fixture, `Strike ${index}`);
      const listing = await prisma.listing.create({
        data: {
          productId: product.id,
          sellerUserId: fixture.sellers.approved.id,
          type: 'AUCTION',
          status: 'ENDED',
          currency: 'BYN',
          startsAt: new Date(now.getTime() - 2 * DAY_MS),
          endsAt: new Date(now.getTime() - DAY_MS),
          contactWindowHours: 24,
        },
        select: { id: true },
      });
      await prisma.order.create({
        data: {
          publicId: `s${randomUUID().replace(/-/g, '').slice(0, 10)}`,
          dealCode: `4${index}0000`,
          productId: product.id,
          listingId: listing.id,
          sellerUserId: fixture.sellers.approved.id,
          buyerUserId: blocked.id,
          source: 'AUCTION_WIN',
          amountMinor: 1_000,
          currency: 'BYN',
          status: 'FAILED',
          failReason: 'BUYER_REFUSED',
          faultSide: 'BUYER',
          failedBy: 'buyer',
          failedAt: new Date(now.getTime() - HOUR_MS),
          workTitleSnapshot: product.title ?? 'Strike',
          workPublicIdSnapshot: 'strike000000',
          sellerNameSnapshot: 'Wave 3 APPROVED',
        },
      });
    }
    const auction = await liveAuction(
      fixture,
      'Highest non-voided bid',
      new Date(now.getTime() - 60_000),
      [
        { bidderUserId: voided.id, amountMinor: 5_000, voidedAt: now },
        { bidderUserId: held.id, amountMinor: 4_000 },
        { bidderUserId: blocked.id, amountMinor: 2_000 },
        { bidderUserId: eligible.id, amountMinor: 1_100 },
      ],
    );
    const empty = await liveAuction(
      fixture,
      'Only voided bids',
      new Date(now.getTime() - 60_000),
      [{ bidderUserId: voided.id, amountMinor: 9_000, voidedAt: now }],
    );

    await http.app.get(TickService).run();

    const order = await prisma.order.findFirstOrThrow({
      where: { listingId: auction.listing.id },
    });
    expect(order).toMatchObject({
      source: 'AUCTION_WIN',
      status: 'ACTIVE',
      buyerUserId: held.id,
      amountMinor: 4_000,
    });
    expect(
      await prisma.order.count({ where: { listingId: empty.listing.id } }),
    ).toBe(0);
    const listing = await prisma.listing.findUniqueOrThrow({
      where: { id: empty.listing.id },
    });
    expect(listing.status).toBe('ENDED');
    const letters = await prisma.notificationOutbox.findMany({
      where: { userId: fixture.sellers.approved.id, kind: 'AUCTION_ENDED_NO_BIDS' },
    });
    const noBidLetter = letters.find(
      (letter) => payloadRecord(letter.payload).listingId === empty.listing.id,
    );
    expect(noBidLetter).toBeTruthy();
    expect(rendered(noBidLetter!.kind, noBidLetter!.payload).text).toContain(
      'без ставок',
    );
  });

  it('fails an expired offer and leaves a future offer offered', async () => {
    const fixture = await createPermissionFixture(prisma);
    const now = await databaseNow();
    const offeredBuyer = await buyer('offered');
    const waitingBuyer = await buyer('waiting-offer');
    const expired = await insertOffer(fixture, offeredBuyer.id, now, -HOUR_MS);
    const waiting = await insertOffer(fixture, waitingBuyer.id, now, HOUR_MS);

    await http.app.get(TickService).run();

    const failed = await prisma.order.findUniqueOrThrow({
      where: { id: expired.id },
    });
    expect(failed).toMatchObject({
      status: 'FAILED',
      failReason: 'OFFER_EXPIRED',
      faultSide: 'NONE',
      failedBy: 'system',
    });
    expect(failed.failedAt).toBeInstanceOf(Date);
    const still = await prisma.order.findUniqueOrThrow({
      where: { id: waiting.id },
    });
    expect(still.status).toBe('OFFERED');
    const letters = await prisma.notificationOutbox.findMany({
      where: {
        userId: { in: [offeredBuyer.id, fixture.sellers.approved.id] },
        kind: 'ORDER_FAILED',
      },
    });
    expect(letters).toHaveLength(2);
    for (const letter of letters) {
      const payload = payloadRecord(letter.payload);
      expect(payload.failReason).toBe('OFFER_EXPIRED');
      expect(payload.failedAt).toEqual(failed.failedAt!.toISOString());
      expect(payload.orderPublicId).toBe(failed.publicId);
    }
    await http.app.get(TickService).run();
    expect(
      await prisma.notificationOutbox.count({
        where: { kind: 'ORDER_FAILED' },
      }),
    ).toBe(2);
  });

  it('reminds once at 24h and 48h and never closes an active order', async () => {
    const fixture = await createPermissionFixture(prisma);
    const now = await databaseNow();
    const recentBuyer = await buyer('recent');
    const oldBuyer = await buyer('old');
    const recent = await insertActive(
      fixture,
      recentBuyer.id,
      new Date(now.getTime() - 25 * HOUR_MS),
    );
    const aged = await insertActive(
      fixture,
      oldBuyer.id,
      new Date(now.getTime() - 30 * DAY_MS),
    );

    await http.app.get(TickService).run();

    expect(
      (await prisma.order.findUniqueOrThrow({ where: { id: recent.id } }))
        .status,
    ).toBe('ACTIVE');
    expect(
      (await prisma.order.findUniqueOrThrow({ where: { id: recent.id } }))
        .sellerRemindersSent,
    ).toBe(1);
    const agedAfter = await prisma.order.findUniqueOrThrow({
      where: { id: aged.id },
    });
    expect(agedAfter.status).toBe('ACTIVE');
    expect(agedAfter.sellerRemindersSent).toBe(2);
    const first = await prisma.notificationOutbox.findMany({
      where: { userId: fixture.sellers.approved.id, kind: 'CONFIRM_DEAL_REMINDER' },
    });
    expect(first).toHaveLength(2);
    expect(
      first.map((letter) => payloadRecord(letter.payload).slot).sort(),
    ).toEqual(['24h', '48h']);

    await prisma.order.update({
      where: { id: recent.id },
      data: { activatedAt: new Date((await databaseNow()).getTime() - 49 * HOUR_MS) },
    });
    await http.app.get(TickService).run();

    expect(
      (await prisma.order.findUniqueOrThrow({ where: { id: recent.id } }))
        .sellerRemindersSent,
    ).toBe(2);
    expect(
      (await prisma.order.findUniqueOrThrow({ where: { id: recent.id } })).status,
    ).toBe('ACTIVE');
    expect(
      (await prisma.order.findUniqueOrThrow({ where: { id: aged.id } })).status,
    ).toBe('ACTIVE');
    const second = await prisma.notificationOutbox.findMany({
      where: {
        userId: fixture.sellers.approved.id,
        kind: 'CONFIRM_DEAL_REMINDER',
      },
    });
    const recentSlots = second
      .filter((letter) => payloadRecord(letter.payload).orderPublicId === recent.publicId)
      .map((letter) => payloadRecord(letter.payload).slot)
      .sort();
    expect(recentSlots).toEqual(['24h', '48h']);

    await http.app.get(TickService).run();

    expect(
      await prisma.notificationOutbox.count({
        where: { kind: 'CONFIRM_DEAL_REMINDER' },
      }),
    ).toBe(3);
    const after = await prisma.order.findUniqueOrThrow({ where: { id: aged.id } });
    expect(after.status).toBe('ACTIVE');
    expect(after.failReason).toBeNull();
    expect(
      (await prisma.order.findUniqueOrThrow({ where: { id: recent.id } })).status,
    ).toBe('ACTIVE');
  });

  it('sends only the 48h reminder when that slot is already due', async () => {
    const fixture = await createPermissionFixture(prisma);
    const now = await databaseNow();
    const person = await buyer('late-reminder');
    const order = await insertActive(
      fixture,
      person.id,
      new Date(now.getTime() - 49 * HOUR_MS),
    );

    await http.app.get(TickService).run();

    const stored = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(stored.status).toBe('ACTIVE');
    expect(stored.sellerRemindersSent).toBe(2);
    const letters = await prisma.notificationOutbox.findMany({
      where: { userId: fixture.sellers.approved.id, kind: 'CONFIRM_DEAL_REMINDER' },
    });
    expect(letters).toHaveLength(1);
    expect(payloadRecord(letters[0]!.payload).slot).toBe('48h');
    expect(payloadRecord(letters[0]!.payload).orderPublicId).toBe(order.publicId);

    await http.app.get(TickService).run();
    expect(
      await prisma.notificationOutbox.count({
        where: { kind: 'CONFIRM_DEAL_REMINDER' },
      }),
    ).toBe(1);
  });

  it('keeps a later close when an earlier listing fails', async () => {
    const fixture = await createPermissionFixture(prisma);
    const now = await databaseNow();
    const winner = await buyer('survives');
    const bad = await liveAuction(
      fixture,
      'Broken close',
      new Date(now.getTime() - 120_000),
      [{ bidderUserId: winner.id, amountMinor: 1_600 }],
    );
    const good = await liveAuction(
      fixture,
      'Good close',
      new Date(now.getTime() - 60_000),
      [{ bidderUserId: winner.id, amountMinor: 1_700 }],
    );
    await prisma.product.update({
      where: { id: bad.product.id },
      data: { title: '   ' },
    });
    const tick = http.app.get(TickService);
    const before = await tick.lastSucceededAt();
    const logged = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);

    try {
      const result = await tick.run();
      expect(result.jobs.find((job) => job.name === 'commerce.close')).toMatchObject({
        failed: true,
      });
    } finally {
      const lines = logged.mock.calls.map((call) => String(call[0]));
      logged.mockRestore();
      expect(lines.some((line) => line.includes(bad.listing.id))).toBe(true);
      expect(lines.join('\n')).not.toContain(winner.email);
      expect(lines.join('\n')).not.toContain(fixture.sellers.approved.email);
    }

    expect(await tick.lastSucceededAt()).toEqual(before);
    expect(
      await prisma.order.count({ where: { listingId: bad.listing.id } }),
    ).toBe(0);
    const orders = await prisma.order.findMany({
      where: { listingId: good.listing.id },
    });
    expect(orders).toHaveLength(1);
    expect(orders[0]).toMatchObject({
      source: 'AUCTION_WIN',
      status: 'ACTIVE',
      buyerUserId: winner.id,
      amountMinor: 1_700,
    });
  });

  it('rejects a bid after endsAt and creates one order on the first tick', async () => {
    const fixture = await createPermissionFixture(prisma);
    const now = await databaseNow();
    const person = await signedBidder('asleep');
    const auction = await liveAuction(
      fixture,
      'Container slept',
      new Date(now.getTime() + HOUR_MS),
      [],
    );
    const placed = await person.client.post(`/listings/${auction.listing.id}/bids`, {
      amountMinor: 1_500,
      idempotencyKey: `open-${randomUUID()}`,
      turnstileToken: PASS,
    });
    expect(placed.status).toBe(200);
    await prisma.listing.update({
      where: { id: auction.listing.id },
      data: { endsAt: new Date((await databaseNow()).getTime() - 60_000) },
    });
    const late = await person.client.post(`/listings/${auction.listing.id}/bids`, {
      amountMinor: 2_500,
      idempotencyKey: `late-${randomUUID()}`,
      turnstileToken: PASS,
    });
    expect(late.status).toBe(409);
    expect(((await late.json()) as { code?: string }).code).toBe('LISTING_NOT_OPEN');

    const tick = http.app.get(TickService);
    await tick.run();
    const orders = await prisma.order.findMany({
      where: { listingId: auction.listing.id },
    });
    expect(orders).toHaveLength(1);
    expect(orders[0]).toMatchObject({
      source: 'AUCTION_WIN',
      status: 'ACTIVE',
      buyerUserId: person.id,
      amountMinor: 1_500,
    });

    await tick.run();
    expect(
      await prisma.order.count({ where: { listingId: auction.listing.id } }),
    ).toBe(1);
    expect(
      await prisma.notificationOutbox.count({
        where: { userId: { in: [person.id, fixture.sellers.approved.id] } },
      }),
    ).toBe(2);
  });

  it('activates at most 50 scheduled listings per run', async () => {
    const fixture = await createPermissionFixture(prisma);
    const now = await databaseNow();
    const dueIds: string[] = [];
    for (let index = 0; index < 51; index += 1) {
      const product = await work(fixture, `Scheduled ${index}`);
      const listing = await prisma.listing.create({
        data: {
          productId: product.id,
          sellerUserId: fixture.sellers.approved.id,
          type: 'FIXED',
          status: 'SCHEDULED',
          currency: 'BYN',
          priceMinor: 1_500,
          startsAt: new Date(now.getTime() - 60_000),
          contactWindowHours: 24,
        },
        select: { id: true },
      });
      dueIds.push(listing.id);
    }
    const futureProduct = await work(fixture, 'Still scheduled');
    const future = await prisma.listing.create({
      data: {
        productId: futureProduct.id,
        sellerUserId: fixture.sellers.approved.id,
        type: 'FIXED',
        status: 'SCHEDULED',
        currency: 'BYN',
        priceMinor: 1_500,
        startsAt: new Date(now.getTime() + DAY_MS),
        contactWindowHours: 24,
      },
      select: { id: true },
    });

    const first = await http.app.get(TickService).run();
    expect(first.jobs.find((job) => job.name === 'commerce.activate')).toMatchObject({
      processed: 50,
      failed: false,
    });
    expect(
      await prisma.listing.count({
        where: { id: { in: dueIds }, status: 'LIVE' },
      }),
    ).toBe(50);
    expect(
      await prisma.listing.count({
        where: { id: { in: dueIds }, status: 'SCHEDULED' },
      }),
    ).toBe(1);
    expect(
      (await prisma.listing.findUniqueOrThrow({ where: { id: future.id } })).status,
    ).toBe('SCHEDULED');

    await http.app.get(TickService).run();
    expect(
      await prisma.listing.count({
        where: { id: { in: dueIds }, status: 'LIVE' },
      }),
    ).toBe(51);
  });

  it('reports lastTickAt from TickService.lastSucceededAt', async () => {
    const email = `admin.${randomUUID().slice(0, 8)}@wave3.test`;
    await prisma.user.create({
      data: {
        email,
        passwordHash: fixturePasswordHash,
        displayName: 'Admin',
        role: 'admin',
        emailVerifiedAt: new Date('2026-09-01T00:00:00.000Z'),
        termsAcceptances: {
          create: {
            rulesVersion: 'MVP_RULES_V1',
            acceptedAt: new Date('2026-09-01T00:00:00.000Z'),
          },
        },
      },
    });
    const tick = http.app.get(TickService);
    const result = await tick.run();
    expect(result.jobs.some((job) => job.failed)).toBe(false);
    const heartbeat = await tick.lastSucceededAt();
    const admin = new HttpTestClient(http.baseUrl, 'http://localhost:8081');
    const login = await admin.post('/auth/login', {
      email,
      password: 'password123',
    });
    expect(login.status).toBe(201);
    const response = await admin.get('/admin/health');
    expect(response.status).toBe(200);
    const body = (await response.json()) as { lastTickAt: string | null };
    expect(body.lastTickAt).toBe(heartbeat?.toISOString() ?? null);
  });
});

async function insertOffer(
  fixture: PermissionFixture,
  buyerId: string,
  now: Date,
  offsetMs: number,
) {
  const product = await work(fixture, `Offer ${offsetMs}`);
  const listing = await prisma.listing.create({
    data: {
      productId: product.id,
      sellerUserId: fixture.sellers.approved.id,
      type: 'AUCTION',
      status: 'ENDED',
      currency: 'BYN',
      startsAt: new Date(now.getTime() - DAY_MS),
      endsAt: new Date(now.getTime() - HOUR_MS),
      contactWindowHours: 24,
    },
    select: { id: true },
  });
  return prisma.order.create({
    data: {
      publicId: `o${randomUUID().replace(/-/g, '').slice(0, 10)}`,
      dealCode: String(Math.abs(offsetMs)).padStart(6, '0').slice(0, 6),
      productId: product.id,
      listingId: listing.id,
      sellerUserId: fixture.sellers.approved.id,
      buyerUserId: buyerId,
      source: 'SECOND_CHANCE',
      amountMinor: 1_500,
      currency: 'BYN',
      status: 'OFFERED',
      offerExpiresAt: new Date(now.getTime() + offsetMs),
      workTitleSnapshot: product.title ?? 'Offer',
      workPublicIdSnapshot: 'offer0000000',
      sellerNameSnapshot: 'Wave 3 APPROVED',
    },
  });
}

async function insertActive(
  fixture: PermissionFixture,
  buyerId: string,
  activatedAt: Date,
) {
  const product = await work(fixture, `Active ${activatedAt.toISOString()}`);
  const listing = await prisma.listing.create({
    data: {
      productId: product.id,
      sellerUserId: fixture.sellers.approved.id,
      type: 'AUCTION',
      status: 'ENDED',
      currency: 'BYN',
      startsAt: new Date(activatedAt.getTime() - DAY_MS),
      endsAt: activatedAt,
      contactWindowHours: 24,
    },
    select: { id: true },
  });
  return prisma.order.create({
    data: {
      publicId: `a${randomUUID().replace(/-/g, '').slice(0, 10)}`,
      dealCode: randomUUID().replace(/\D/g, '').padEnd(6, '0').slice(0, 6),
      productId: product.id,
      listingId: listing.id,
      sellerUserId: fixture.sellers.approved.id,
      buyerUserId: buyerId,
      source: 'AUCTION_WIN',
      amountMinor: 1_500,
      currency: 'BYN',
      status: 'ACTIVE',
      activatedAt,
      contactDeadlineAt: new Date(activatedAt.getTime() + 24 * HOUR_MS),
      sellerRemindersSent: 0,
      workTitleSnapshot: product.title ?? 'Active',
      workPublicIdSnapshot: 'active000000',
      sellerNameSnapshot: 'Wave 3 APPROVED',
    },
  });
}
