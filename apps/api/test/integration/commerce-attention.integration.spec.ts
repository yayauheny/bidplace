import { randomUUID } from 'node:crypto';

import {
  adminAttentionResponseSchema,
  attentionResponseSchema,
  type AdminAttentionResponse,
} from '@bidplace/contracts';
import { type PrismaClient } from '@bidplace/database';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { PrismaService } from '../../src/core/database';
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

process.env.BIDPLACE_QUERY_COUNT = '1';

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
  await prisma.report.deleteMany();
  await prisma.rateLimitCounter.deleteMany();
  await prisma.purchaseHold.deleteMany();
  await prisma.fraudSignal.deleteMany();
  await prisma.favoriteWork.deleteMany();
  await resetPermissionFixture(prisma);
});

afterAll(async () => {
  delete process.env.BIDPLACE_QUERY_COUNT;
  await http?.close();
  await database?.cleanup();
});

const BUYER_PHONE = '+375291112233';
const SELLER_PHONE = '+375291110099';
const HELD_PHONE = '+375291110088';
const STRANGER_PHONE = '+375291110077';
let clientSerial = 0;
let dealSerial = 0;

type AttentionItem = {
  kind:
    | 'OFFER'
    | 'ACTIVE_ORDER'
    | 'OPEN_REPORT'
    | 'AUCTION_CHOICE'
    | 'CONTACTS_REQUIRED';
  orderPublicId: string | null;
  listingId: string | null;
  productId: string | null;
};

type StoredOrder = {
  id: string;
  publicId: string;
  listingId: string;
  productId: string;
};

function client() {
  clientSerial += 1;
  const host = (clientSerial % 200) + 1;
  const net = (Math.floor(clientSerial / 200) % 200) + 1;
  return new HttpTestClient(
    http.baseUrl,
    'http://localhost:8081',
    `198.51.${net}.${host}`,
  );
}

async function login(actor: HttpTestClient, email: string) {
  const response = await actor.post('/auth/login', {
    email,
    password: 'password123',
  });
  expect(response.status).toBe(201);
  return actor;
}

async function signedIn(email: string) {
  return login(client(), email);
}

function publicId(prefix: string): string {
  return `${prefix}${randomUUID().replace(/-/g, '').slice(0, 10)}`;
}

function sameItem(left: AttentionItem, right: AttentionItem): boolean {
  return (
    left.kind === right.kind &&
    left.orderPublicId === right.orderPublicId &&
    left.listingId === right.listingId &&
    left.productId === right.productId
  );
}

function assertNoPrivateContacts(value: unknown) {
  const raw = JSON.stringify(value);
  expect(raw).not.toContain(BUYER_PHONE);
  expect(raw).not.toContain(SELLER_PHONE);
  expect(raw).not.toContain(HELD_PHONE);
  expect(raw).not.toContain(STRANGER_PHONE);
  expect(raw).not.toContain('@wave3.test');
  expect(raw).not.toContain('contactPhone');
  expect(raw).not.toContain('contactTelegram');
}

async function giveContact(userId: string, phone: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { contactPhone: phone },
  });
}

async function adminUser() {
  const email = `admin.${randomUUID().slice(0, 8)}@wave3.test`;
  const user = await prisma.user.create({
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
    select: { id: true, email: true },
  });
  return { ...user, client: await signedIn(email) };
}

async function insertOrder(
  fixture: PermissionFixture,
  input: {
    buyerId: string;
    status: 'OFFERED' | 'ACTIVE' | 'FAILED';
    type?: 'FIXED' | 'AUCTION';
    source?: 'FIXED_PURCHASE' | 'AUCTION_WIN' | 'SECOND_CHANCE';
    failReason?: 'BUYER_REFUSED' | 'OFFER_EXPIRED';
    faultSide?: 'BUYER' | 'NONE';
    listingId?: string;
    productId?: string;
  },
): Promise<StoredOrder> {
  const seller = fixture.sellers.approved;
  const productId = input.productId ?? (
    await prisma.product.create({
      data: {
        publicId: publicId('p'),
        sellerProfileId: seller.profileId,
        title: `Attention ${randomUUID().slice(0, 8)}`,
        status: 'APPROVED',
      },
      select: { id: true },
    })
  ).id;
  const listingId = input.listingId ?? (
    await prisma.listing.create({
      data: {
        productId,
        sellerUserId: seller.id,
        type: input.type ?? 'FIXED',
        status: 'ENDED',
        currency: 'BYN',
        priceMinor: 1_500,
        startsAt: new Date('2026-09-01T00:00:00.000Z'),
        endedAt: new Date('2026-09-02T00:00:00.000Z'),
        contactWindowHours: 24,
      },
      select: { id: true },
    })
  ).id;
  const product = await prisma.product.findUniqueOrThrow({
    where: { id: productId },
    select: { publicId: true, title: true },
  });
  if (!product.publicId || !product.title) {
    throw new Error('product snapshot fields missing');
  }
  dealSerial += 1;
  const order = await prisma.order.create({
    data: {
      publicId: publicId('o'),
      dealCode: String(dealSerial).padStart(6, '0'),
      productId,
      listingId,
      sellerUserId: seller.id,
      buyerUserId: input.buyerId,
      source: input.source ?? 'FIXED_PURCHASE',
      amountMinor: 1_500,
      currency: 'BYN',
      status: input.status,
      ...(input.failReason ? { failReason: input.failReason } : {}),
      ...(input.faultSide ? { faultSide: input.faultSide } : {}),
      ...(input.status === 'FAILED'
        ? { failedAt: new Date('2026-09-03T00:00:00.000Z'), failedBy: 'buyer' }
        : {}),
      ...(input.status === 'ACTIVE'
        ? {
            activatedAt: new Date('2026-10-30T00:00:00.000Z'),
            contactDeadlineAt: new Date('2026-10-31T00:00:00.000Z'),
          }
        : {}),
      ...(input.status === 'OFFERED'
        ? { offerExpiresAt: new Date('2026-10-31T00:00:00.000Z') }
        : {}),
      workTitleSnapshot: product.title,
      workPublicIdSnapshot: product.publicId,
      sellerNameSnapshot: 'Wave 3 APPROVED',
    },
    select: { id: true, publicId: true, listingId: true, productId: true },
  });
  return order;
}

function itemOf(
  kind: AttentionItem['kind'],
  order: Pick<StoredOrder, 'publicId' | 'listingId' | 'productId'> | null,
): AttentionItem {
  if (!order) {
    return {
      kind,
      orderPublicId: null,
      listingId: null,
      productId: null,
    };
  }
  return {
    kind,
    orderPublicId: order.publicId,
    listingId: order.listingId,
    productId: order.productId,
  };
}

async function readAttention(actor: HttpTestClient) {
  const response = await actor.get('/me/attention');
  expect(response.status).toBe(200);
  expect(response.headers.get('cache-control')).toBe('private, no-store');
  return attentionResponseSchema.parse(await response.json());
}

describe('personal attention', () => {
  it('rejects an anonymous reader', async () => {
    expect((await client().get('/me/attention')).status).toBe(401);
    expect((await client().get('/admin/attention')).status).toBe(401);
  });

  it.each([
    'OFFER',
    'ACTIVE_ORDER',
    'OPEN_REPORT',
    'AUCTION_CHOICE',
    'CONTACTS_REQUIRED',
  ] as const)('%s is listed for the actor and hidden from everyone else', async (kind) => {
    const fixture = await createPermissionFixture(prisma);
    const seller = fixture.sellers.approved;
    const buyer = fixture.buyer;
    await giveContact(fixture.sellers.otherApproved.id, STRANGER_PHONE);
    const stranger = await signedIn(fixture.sellers.otherApproved.email);

    let actor = await signedIn(buyer.email);
    let item: AttentionItem = itemOf('CONTACTS_REQUIRED', null);
    const also: HttpTestClient[] = [];

    if (kind === 'OFFER') {
      await giveContact(buyer.id, BUYER_PHONE);
      await giveContact(seller.id, SELLER_PHONE);
      const order = await insertOrder(fixture, {
        buyerId: buyer.id,
        status: 'OFFERED',
        type: 'AUCTION',
        source: 'SECOND_CHANCE',
      });
      item = itemOf('OFFER', order);
      actor = await signedIn(buyer.email);
    } else if (kind === 'ACTIVE_ORDER') {
      await giveContact(buyer.id, BUYER_PHONE);
      await giveContact(seller.id, SELLER_PHONE);
      const order = await insertOrder(fixture, {
        buyerId: buyer.id,
        status: 'ACTIVE',
      });
      item = itemOf('ACTIVE_ORDER', order);
      actor = await signedIn(seller.email);
      const buyerClient = await signedIn(buyer.email);
      expect(
        (await readAttention(buyerClient)).items.some((row) => sameItem(row, item)),
      ).toBe(false);
    } else if (kind === 'OPEN_REPORT') {
      await giveContact(buyer.id, BUYER_PHONE);
      await giveContact(seller.id, SELLER_PHONE);
      const order = await insertOrder(fixture, {
        buyerId: buyer.id,
        status: 'ACTIVE',
      });
      await prisma.report.create({
        data: {
          targetType: 'ORDER',
          targetId: order.id,
          reporterUserId: buyer.id,
          reason: 'FRAUD',
          status: 'OPEN',
        },
      });
      item = itemOf('OPEN_REPORT', order);
      actor = await signedIn(buyer.email);
      also.push(await signedIn(seller.email));
    } else if (kind === 'AUCTION_CHOICE') {
      await giveContact(buyer.id, BUYER_PHONE);
      await giveContact(seller.id, SELLER_PHONE);
      const fixed = await insertOrder(fixture, {
        buyerId: buyer.id,
        status: 'FAILED',
        type: 'FIXED',
        source: 'FIXED_PURCHASE',
        failReason: 'BUYER_REFUSED',
        faultSide: 'BUYER',
      });
      const order = await insertOrder(fixture, {
        buyerId: buyer.id,
        status: 'FAILED',
        type: 'AUCTION',
        source: 'AUCTION_WIN',
        failReason: 'BUYER_REFUSED',
        faultSide: 'BUYER',
      });
      item = itemOf('AUCTION_CHOICE', order);
      actor = await signedIn(seller.email);
      const buyerClient = await signedIn(buyer.email);
      expect(
        (await readAttention(buyerClient)).items.some((row) => sameItem(row, item)),
      ).toBe(false);
      expect(fixed.listingId).not.toBe(order.listingId);
    } else {
      actor = await signedIn(buyer.email);
      const admin = await adminUser();
      expect(
        (await readAttention(admin.client)).items.some(
          (row) => row.kind === 'CONTACTS_REQUIRED',
        ),
      ).toBe(false);
    }

    const mine = await readAttention(actor);
    expect(mine.items.filter((row) => row.kind === kind)).toEqual([item]);
    assertNoPrivateContacts(mine);
    for (const other of also) {
      const body = await readAttention(other);
      expect(body.items.some((row) => sameItem(row, item))).toBe(true);
      assertNoPrivateContacts(body);
    }
    const hidden = await readAttention(stranger);
    expect(hidden.items.some((row) => sameItem(row, item))).toBe(false);
  });

  it('drops an auction choice after the next offer and after a new listing', async () => {
    const fixture = await createPermissionFixture(prisma);
    const seller = fixture.sellers.approved;
    await giveContact(seller.id, SELLER_PHONE);
    await giveContact(fixture.buyer.id, BUYER_PHONE);
    const failed = await insertOrder(fixture, {
      buyerId: fixture.buyer.id,
      status: 'FAILED',
      type: 'AUCTION',
      source: 'AUCTION_WIN',
      failReason: 'BUYER_REFUSED',
      faultSide: 'BUYER',
    });
    const actor = await signedIn(seller.email);
    expect(
      (await readAttention(actor)).items.some((row) => sameItem(row, itemOf('AUCTION_CHOICE', failed))),
    ).toBe(true);

    const offered = await insertOrder(fixture, {
      buyerId: fixture.sellers.otherApproved.id,
      status: 'OFFERED',
      source: 'SECOND_CHANCE',
      listingId: failed.listingId,
      productId: failed.productId,
    });
    expect(
      (await readAttention(actor)).items.some((row) => row.kind === 'AUCTION_CHOICE'),
    ).toBe(false);

    await prisma.order.update({
      where: { id: offered.id },
      data: {
        status: 'FAILED',
        failReason: 'OFFER_EXPIRED',
        faultSide: 'NONE',
        failedAt: new Date('2026-10-04T00:00:00.000Z'),
        failedBy: 'system',
        offerExpiresAt: null,
      },
    });
    const again = await readAttention(actor);
    expect(again.items.filter((row) => row.kind === 'AUCTION_CHOICE')).toEqual([
      itemOf('AUCTION_CHOICE', offered),
    ]);

    await prisma.listing.create({
      data: {
        productId: failed.productId,
        sellerUserId: seller.id,
        type: 'AUCTION',
        status: 'LIVE',
        currency: 'BYN',
        startsAt: new Date('2026-10-05T00:00:00.000Z'),
        endsAt: new Date('2026-10-12T00:00:00.000Z'),
        contactWindowHours: 24,
      },
    });
    expect(
      (await readAttention(actor)).items.some((row) => row.kind === 'AUCTION_CHOICE'),
    ).toBe(false);
  });
});

describe('admin attention', () => {
  it('lists reported orders, unmarked orders at 72h, and active holds', async () => {
    const fixture = await createPermissionFixture(prisma);
    const seller = fixture.sellers.approved;
    const buyer = fixture.buyer;
    await giveContact(buyer.id, BUYER_PHONE);
    await giveContact(seller.id, SELLER_PHONE);
    await prisma.sellerProfile.update({
      where: { id: seller.profileId },
      data: { showContactsToBuyer: false },
    });
    const reported = await insertOrder(fixture, {
      buyerId: buyer.id,
      status: 'ACTIVE',
    });
    await prisma.report.create({
      data: {
        targetType: 'ORDER',
        targetId: reported.id,
        reporterUserId: buyer.id,
        reason: 'NO_CONTACT',
        status: 'OPEN',
      },
    });
    const stale = await insertOrder(fixture, {
      buyerId: buyer.id,
      status: 'ACTIVE',
    });
    const fresh = await insertOrder(fixture, {
      buyerId: buyer.id,
      status: 'ACTIVE',
    });
    await prisma.$executeRaw`
      UPDATE orders
      SET activated_at = clock_timestamp() - interval '72 hours'
      WHERE id = ${stale.id}::uuid
    `;
    await prisma.$executeRaw`
      UPDATE orders
      SET activated_at = clock_timestamp() - interval '71 hours'
      WHERE id = ${fresh.id}::uuid
    `;
    const held = await prisma.user.update({
      where: { id: fixture.sellers.otherApproved.id },
      data: { contactPhone: HELD_PHONE },
      select: { id: true, email: true },
    });
    const hold = await prisma.purchaseHold.create({
      data: { userId: held.id, reason: 'FRAUD_REVIEW' },
      select: { id: true },
    });

    const admin = await adminUser();
    const buyerClient = await signedIn(buyer.email);
    expect((await buyerClient.get('/admin/attention')).status).toBe(403);

    const response = await admin.client.get('/admin/attention');
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    const body = adminAttentionResponseSchema.parse(await response.json());
    expect(body.reportedOrders.map((order) => order.publicId)).toEqual([
      reported.publicId,
    ]);
    expect(body.unmarkedOrders.map((order) => order.publicId)).toEqual([
      stale.publicId,
    ]);
    expect(body.blocks.map((user) => user.id)).toEqual([held.id]);
    expect(body.blocks[0]?.email).toBe(held.email);
    assertAdminContacts(body.reportedOrders[0]);
    assertAdminContacts(body.unmarkedOrders[0]);
    expect(JSON.stringify(body.blocks)).not.toContain(HELD_PHONE);
    expect(JSON.stringify(body)).not.toContain('contactPhone');

    const personal = await readAttention(buyerClient);
    expect(personal.items.some((row) => row.kind === 'OPEN_REPORT' && row.orderPublicId === reported.publicId)).toBe(true);
    assertNoPrivateContacts(personal);
    const sellerList = await readAttention(await signedIn(seller.email));
    expect(sellerList.items.filter((row) => row.kind === 'ACTIVE_ORDER').map((row) => row.orderPublicId)).toEqual(
      expect.arrayContaining([reported.publicId, stale.publicId, fresh.publicId]),
    );
    assertNoPrivateContacts(sellerList);

    await prisma.purchaseHold.update({
      where: { id: hold.id },
      data: { releasedAt: new Date('2026-10-30T00:00:00.000Z') },
    });
    const afterRelease = adminAttentionResponseSchema.parse(
      await (await admin.client.get('/admin/attention')).json(),
    );
    expect(afterRelease.blocks).toEqual([]);
  });

  it('keeps the same query count for one offer and for many', async () => {
    const fixture = await createPermissionFixture(prisma);
    await giveContact(fixture.buyer.id, BUYER_PHONE);
    await insertOrder(fixture, {
      buyerId: fixture.buyer.id,
      status: 'OFFERED',
      type: 'AUCTION',
      source: 'SECOND_CHANCE',
    });
    const actor = await signedIn(fixture.buyer.email);
    PrismaService.queryCount = 0;
    expect((await readAttention(actor)).items.filter((row) => row.kind === 'OFFER')).toHaveLength(1);
    const once = PrismaService.queryCount;
    expect(once).toBeGreaterThan(0);

    for (let index = 0; index < 4; index += 1) {
      await insertOrder(fixture, {
        buyerId: fixture.buyer.id,
        status: 'OFFERED',
        type: 'AUCTION',
        source: 'SECOND_CHANCE',
      });
    }
    PrismaService.queryCount = 0;
    expect((await readAttention(actor)).items.filter((row) => row.kind === 'OFFER')).toHaveLength(5);
    expect(PrismaService.queryCount).toBe(once);
    expect(once).toBeLessThan(20);
  });
});

function assertAdminContacts(
  order: AdminAttentionResponse['reportedOrders'][number] | undefined,
) {
  expect(order?.role).toBe('admin');
  expect(order?.buyerContacts?.phone).toBe(BUYER_PHONE);
  expect(order?.sellerContacts?.phone).toBe(SELLER_PHONE);
  expect(order?.sellerContactHint).toBeNull();
  expect(order?.buyerContacts?.email).toContain('@wave3.test');
  expect(order?.sellerContacts?.email).toContain('@wave3.test');
}
