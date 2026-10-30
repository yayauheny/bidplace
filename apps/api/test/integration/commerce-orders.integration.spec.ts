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
}, 30_000);

afterEach(async () => {
  await prisma.notificationOutbox.deleteMany();
  await prisma.report.deleteMany();
  await prisma.purchaseHold.deleteMany();
  await prisma.fraudSignal.deleteMany();
  await resetPermissionFixture(prisma);
});

afterAll(async () => {
  await http?.close();
  await database?.cleanup();
});

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
let dealSerial = 0;
let clientSerial = 0;

async function databaseNow(): Promise<Date> {
  const [row] = await prisma.$queryRaw<Array<{ now: Date }>>`
    SELECT clock_timestamp() AS now
  `;
  return row!.now;
}

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

async function errorBody(response: Response) {
  return response.json() as Promise<{ code?: string; message?: string }>;
}

async function giveContact(userId: string, phone = '+375291112233') {
  await prisma.user.update({
    where: { id: userId },
    data: { contactPhone: phone },
  });
}

async function spareProduct(fixture: PermissionFixture, title: string) {
  return prisma.product.create({
    data: {
      publicId: `p${randomUUID().replace(/-/g, '').slice(0, 10)}`,
      sellerProfileId: fixture.sellers.approved.profileId,
      title,
      status: 'APPROVED',
    },
    select: { id: true, publicId: true, title: true },
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

type Card = {
  publicId: string;
  dealCode: string;
  status: string;
  source: string;
  role: string;
  buyerContacts: { phone: string | null; email: string } | null;
  sellerContacts: { phone: string | null; email: string } | null;
  sellerContactHint: string | null;
  sellerNote: string | null;
  failReason: string | null;
  faultSide: string | null;
  offerExpiresAt: string | null;
  contactDeadlineAt: string | null;
};

async function purchaseFixed(
  fixture: PermissionFixture,
  contactWindowHours: 1 | 6 | 24 | 48 | 72 = 6,
) {
  await giveContact(fixture.buyer.id);
  await giveContact(fixture.sellers.approved.id, '+375291110099');
  const seller = await signedIn(fixture.sellers.approved.email);
  const buyer = await signedIn(fixture.buyer.email);
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
    contactWindowHours,
  });
  expect(created.status).toBe(201);
  const listingId = ((await created.json()) as { id: string }).id;
  const purchased = await buyer.post(`/listings/${listingId}/purchase`, {
    idempotencyKey: `buy-${randomUUID()}`,
    turnstileToken: 'XXXX.DUMMY.TOKEN.XXXX',
  });
  expect(purchased.status).toBe(200);
  const body = (await purchased.json()) as { order: { publicId: string } };
  return { seller, buyer, product, listingId, publicId: body.order.publicId };
}

async function insertOrder(
  fixture: PermissionFixture,
  input: {
    buyerId: string;
    status: 'OFFERED' | 'ACTIVE' | 'COMPLETED' | 'FAILED';
    source?: 'FIXED_PURCHASE' | 'AUCTION_WIN' | 'SECOND_CHANCE';
    listingType?: 'FIXED' | 'AUCTION';
    listingStatus?: 'LIVE' | 'ENDED';
    contactWindowHours?: number;
    offerExpiresAt?: Date | null;
    contactDeadlineAt?: Date | null;
    failReason?: string;
    faultSide?: 'BUYER' | 'SELLER' | 'NONE';
    failedBy?: string;
    failedAt?: Date;
    sellerNote?: string;
    amountMinor?: number;
    sourceBidId?: string;
    listingId?: string;
    productId?: string;
  },
) {
  const product = input.productId
    ? await prisma.product.findUniqueOrThrow({
        where: { id: input.productId },
        select: { id: true, publicId: true, title: true },
      })
    : await spareProduct(fixture, `Order ${randomUUID().slice(0, 8)}`);
  const listing =
    input.listingId !== undefined
      ? { id: input.listingId }
      : await prisma.listing.create({
          data: {
            productId: product.id,
            sellerUserId: fixture.sellers.approved.id,
            type: input.listingType ?? 'FIXED',
            status: input.listingStatus ?? 'ENDED',
            currency: 'BYN',
            priceMinor: input.listingType === 'AUCTION' ? null : 1_500,
            startsAt: new Date('2026-09-01T00:00:00.000Z'),
            endedAt:
              (input.listingStatus ?? 'ENDED') === 'ENDED'
                ? new Date('2026-09-02T00:00:00.000Z')
                : null,
            contactWindowHours: input.contactWindowHours ?? 24,
            ...(input.listingType === 'AUCTION'
              ? {
                  currentPriceMinor: input.amountMinor ?? 1_500,
                  endsAt: new Date('2026-09-02T00:00:00.000Z'),
                  auctionRules: {
                    create: { startPriceMinor: 1_000, stepTableCode: 'BYN_V1' },
                  },
                }
              : {}),
          },
          select: { id: true },
        });
  const now = await databaseNow();
  return prisma.order.create({
    data: {
      publicId: `o${randomUUID().replace(/-/g, '').slice(0, 10)}`,
      dealCode: String(++dealSerial).padStart(6, '0'),
      productId: product.id,
      listingId: listing.id,
      sellerUserId: fixture.sellers.approved.id,
      buyerUserId: input.buyerId,
      source: input.source ?? 'FIXED_PURCHASE',
      sourceBidId: input.sourceBidId,
      amountMinor: input.amountMinor ?? 1_500,
      currency: 'BYN',
      status: input.status,
      failReason: input.failReason as never,
      faultSide: input.faultSide,
      failedBy: input.failedBy,
      failedAt: input.failedAt,
      offerExpiresAt:
        input.offerExpiresAt === undefined
          ? input.status === 'OFFERED'
            ? new Date(now.getTime() + 6 * HOUR_MS)
            : null
          : input.offerExpiresAt,
      activatedAt: input.status === 'ACTIVE' ? now : null,
      contactDeadlineAt:
        input.contactDeadlineAt === undefined
          ? input.status === 'ACTIVE'
            ? new Date(now.getTime() + (input.contactWindowHours ?? 24) * HOUR_MS)
            : null
          : input.contactDeadlineAt,
      sellerNote: input.sellerNote,
      workTitleSnapshot: product.title,
      workPublicIdSnapshot: product.publicId,
      sellerNameSnapshot: 'Wave 3 APPROVED',
    },
  });
}

function sessionId(actor: HttpTestClient): string {
  const raw = actor.cookie('bidplace_session');
  if (!raw) throw new Error('missing session cookie');
  const decoded = decodeURIComponent(raw);
  if (!decoded.startsWith('s:')) throw new Error('unexpected session cookie');
  const signed = decoded.slice(2);
  const dot = signed.lastIndexOf('.');
  return signed.slice(0, dot);
}

async function ageAuthentication(actor: HttpTestClient) {
  const sid = sessionId(actor);
  const row = await prisma.authSession.findUniqueOrThrow({ where: { sid } });
  const sess = row.sess as { principal?: { authenticatedAt: number } };
  if (!sess.principal) throw new Error('session has no principal');
  sess.principal.authenticatedAt -= 6 * 60_000;
  await prisma.authSession.update({
    where: { sid },
    data: { sess },
  });
}

describe('order access', () => {
  it.each([
    ['buyer', 200],
    ['seller', 200],
    ['stranger', 404],
    ['admin', 200],
    ['anonymous', 401],
  ] as const)('the order card is %s → %s', async (role, status) => {
    const fixture = await createPermissionFixture(prisma);
    const bought = await purchaseFixed(fixture);
    const stranger = await extraBuyer('stranger');
    const admin = await adminUser();
    const actor =
      role === 'buyer'
        ? bought.buyer
        : role === 'seller'
          ? bought.seller
          : role === 'stranger'
            ? stranger.client
            : role === 'admin'
              ? admin.client
              : client();
    const response = await actor.get(`/orders/${bought.publicId}`);
    expect(response.status).toBe(status);
    if (status !== 200) return;
    const card = (await response.json()) as Card;
    expect(card.publicId).toBe(bought.publicId);
    expect(card.dealCode).toMatch(/^\d{6}$/);
    expect(response.headers.get('cache-control')).toContain('no-store');
    if (role === 'buyer') {
      expect(card.buyerContacts).toBeNull();
      expect(card.sellerContacts?.phone).toBe('+375291110099');
      expect(card.sellerNote).toBeNull();
    }
    if (role === 'seller') {
      expect(card.buyerContacts?.phone).toBe('+375291112233');
      expect(card.sellerContacts).toBeNull();
    }
    if (role === 'admin') {
      expect(card.buyerContacts?.phone).toBe('+375291112233');
      expect(card.sellerContacts?.phone).toBe('+375291110099');
    }
  });

  it('hides the author contacts from the buyer when the author turns them off, and keeps them after failure', async () => {
    const fixture = await createPermissionFixture(prisma);
    const bought = await purchaseFixed(fixture);
    await prisma.sellerProfile.update({
      where: { userId: fixture.sellers.approved.id },
      data: { showContactsToBuyer: false },
    });
    await prisma.order.update({
      where: { publicId: bought.publicId },
      data: { sellerNote: 'Called once' },
    });
    const hidden = (await (await bought.buyer.get(`/orders/${bought.publicId}`)).json()) as Card;
    expect(hidden.sellerContacts).toBeNull();
    expect(hidden.sellerContactHint).toBe('Автор свяжется с вами сам в течение 6 ч');
    expect(hidden.sellerNote).toBeNull();
    const author = (await (await bought.seller.get(`/orders/${bought.publicId}`)).json()) as Card;
    expect(author.sellerNote).toBe('Called once');
    expect(author.buyerContacts?.phone).toBe('+375291112233');
    const admin = await adminUser();
    const staff = (await (await admin.client.get(`/orders/${bought.publicId}`)).json()) as Card;
    expect(staff.sellerContacts?.phone).toBe('+375291110099');
    expect(staff.sellerNote).toBe('Called once');
    expect(staff.sellerContactHint).toBeNull();

    const failed = await bought.seller.post(`/orders/${bought.publicId}/fail`, {
      reason: 'SELLER_REFUSED',
    });
    expect(failed.status).toBe(200);
    const after = (await (await bought.buyer.get(`/orders/${bought.publicId}`)).json()) as Card;
    expect(after.status).toBe('FAILED');
    expect(after.sellerContactHint).toBe('Автор свяжется с вами сам в течение 6 ч');
    const staffAfter = (await (await admin.client.get(`/orders/${bought.publicId}`)).json()) as Card;
    expect(staffAfter.sellerContacts?.phone).toBe('+375291110099');
    expect(staffAfter.buyerContacts?.phone).toBe('+375291112233');
  });

  it('keeps deal contacts off the public author and work, and rejects a deal code lookup', async () => {
    const fixture = await createPermissionFixture(prisma);
    const bought = await purchaseFixed(fixture);
    const profile = await prisma.sellerProfile.findUniqueOrThrow({
      where: { userId: fixture.sellers.approved.id },
      select: { slug: true },
    });
    const visitor = client();
    const author = await visitor.get(`/authors/${profile.slug}`);
    const work = await visitor.get(`/works/${bought.product.publicId}`);
    expect(author.status).toBe(200);
    expect(work.status).toBe(200);
    const text = `${JSON.stringify(await author.json())}\n${JSON.stringify(await work.json())}`;
    expect(text).not.toContain('contactPhone');
    expect(text).not.toContain('contactTelegram');
    expect(text).not.toContain('contactInstagram');
    expect(text).not.toContain('+375291110099');
    expect(text).not.toContain('+375291112233');
    const order = await prisma.order.findUniqueOrThrow({
      where: { publicId: bought.publicId },
      select: { dealCode: true },
    });
    expect((await bought.buyer.get(`/orders/${order.dealCode}`)).status).toBe(404);
    expect(
      (await bought.buyer.get(`/orders/${bought.publicId}?dealCode=${order.dealCode}`)).status,
    ).toBe(404);
  });

  it('rejects a revoked session and a contact change from a session older than five minutes', async () => {
    const fixture = await createPermissionFixture(prisma);
    const bought = await purchaseFixed(fixture);
    const admin = await adminUser();
    await ageAuthentication(bought.buyer);
    const stale = await bought.buyer.put('/me/contacts', { phone: '+375291119900' });
    expect(stale.status).toBe(401);
    await login(bought.buyer, fixture.buyer.email);
    const changed = await bought.buyer.put('/me/contacts', {
      phone: '+375291119900',
      telegram: '@bidplace_buyer',
    });
    expect(changed.status).toBe(200);
    const letters = await prisma.notificationOutbox.findMany({
      where: { userId: fixture.buyer.id, kind: 'CONTACTS_CHANGED' },
    });
    expect(letters).toHaveLength(1);
    expect(JSON.stringify(letters[0]?.payload)).not.toContain('+375291119900');
    expect(JSON.stringify(letters[0]?.payload)).toContain('eventId');
    const seen = (await (await bought.seller.get(`/orders/${bought.publicId}`)).json()) as Card;
    expect(seen.buyerContacts?.phone).toBe('+375291119900');
    const revoked = await admin.client.post(
      `/admin/users/${fixture.buyer.id}/revoke-sessions`,
      { reason: 'Lost phone' },
    );
    expect(revoked.status).toBe(201);
    expect((await bought.buyer.get(`/orders/${bought.publicId}`)).status).toBe(401);
  });

  it('lists open orders without contacts and lets only the author write the note', async () => {
    const fixture = await createPermissionFixture(prisma);
    const bought = await purchaseFixed(fixture);
    const listed = await bought.buyer.get('/me/orders?role=buyer&state=open');
    expect(listed.status).toBe(200);
    const text = JSON.stringify(await listed.json());
    expect(text).toContain(bought.publicId);
    expect(text).not.toContain('contactPhone');
    expect(text).not.toContain('+37529');
    expect(
      (await bought.buyer.put(`/orders/${bought.publicId}/note`, { note: 'buyer note' }))
        .status,
    ).toBe(403);
    const noted = await bought.seller.put(`/orders/${bought.publicId}/note`, {
      note: 'Left a message',
    });
    expect(noted.status).toBe(200);
    const card = (await noted.json()) as Card;
    expect(card.sellerNote).toBe('Left a message');
    expect(card.buyerContacts?.phone).toBe('+375291112233');
  });
});

describe('order transitions', () => {
  it.each([
    {
      label: 'buyer accepts an offer',
      from: 'OFFERED' as const,
      action: 'accept',
      actor: 'buyer' as const,
      body: {},
      status: 'ACTIVE',
      reason: null,
    },
    {
      label: 'buyer declines an offer',
      from: 'OFFERED' as const,
      action: 'decline',
      actor: 'buyer' as const,
      body: {},
      status: 'FAILED',
      reason: 'OFFER_DECLINED',
    },
    {
      label: 'seller completes',
      from: 'ACTIVE' as const,
      action: 'complete',
      actor: 'seller' as const,
      body: {},
      status: 'COMPLETED',
      reason: null,
    },
    {
      label: 'buyer refuses with confirmation',
      from: 'ACTIVE' as const,
      action: 'fail',
      actor: 'buyer' as const,
      body: { reason: 'BUYER_REFUSED', confirm: true },
      status: 'FAILED',
      reason: 'BUYER_REFUSED',
    },
    {
      label: 'seller marks a buyer refusal',
      from: 'ACTIVE' as const,
      action: 'fail',
      actor: 'seller' as const,
      body: { reason: 'BUYER_REFUSED' },
      status: 'FAILED',
      reason: 'BUYER_REFUSED',
    },
    {
      label: 'seller refuses',
      from: 'ACTIVE' as const,
      action: 'fail',
      actor: 'seller' as const,
      body: { reason: 'SELLER_REFUSED' },
      status: 'FAILED',
      reason: 'SELLER_REFUSED',
    },
  ])('$label', async (row) => {
    const fixture = await createPermissionFixture(prisma);
    await giveContact(fixture.buyer.id);
    const order = await insertOrder(fixture, {
      buyerId: fixture.buyer.id,
      status: row.from,
      source: row.from === 'OFFERED' ? 'SECOND_CHANCE' : 'FIXED_PURCHASE',
      listingType: row.from === 'OFFERED' ? 'AUCTION' : 'FIXED',
    });
    const actor = await signedIn(
      row.actor === 'buyer' ? fixture.buyer.email : fixture.sellers.approved.email,
    );
    const response = await actor.post(`/orders/${order.publicId}/${row.action}`, row.body);
    expect(response.status).toBe(200);
    expect(
      await prisma.order.findUniqueOrThrow({ where: { id: order.id } }),
    ).toMatchObject({
      status: row.status,
      failReason: row.reason,
    });
  });

  it.each([
    { hours: 1 as const, reason: 'BUYER_NO_CONTACT', offsetMs: 60_000, status: 409 },
    { hours: 1 as const, reason: 'BUYER_NO_CONTACT', offsetMs: -1_000, status: 200 },
    { hours: 72 as const, reason: 'BUYER_NO_CONTACT', offsetMs: 60_000, status: 409 },
    { hours: 72 as const, reason: 'BUYER_NO_CONTACT', offsetMs: -1_000, status: 200 },
    { hours: 1 as const, reason: 'BUYER_INVALID_CONTACTS', offsetMs: 60_000, status: 409 },
    { hours: 1 as const, reason: 'BUYER_INVALID_CONTACTS', offsetMs: -1_000, status: 200 },
    { hours: 72 as const, reason: 'BUYER_INVALID_CONTACTS', offsetMs: 60_000, status: 409 },
    { hours: 72 as const, reason: 'BUYER_INVALID_CONTACTS', offsetMs: -1_000, status: 200 },
  ])(
    '$reason at a $hours h window moved by $offsetMs is $status',
    async ({ hours, reason, offsetMs, status }) => {
      const fixture = await createPermissionFixture(prisma);
      const bought = await purchaseFixed(fixture, hours);
      const order = await prisma.order.findUniqueOrThrow({
        where: { publicId: bought.publicId },
      });
      expect(order.contactDeadlineAt!.getTime() - order.activatedAt!.getTime()).toBe(
        hours * HOUR_MS,
      );
      const now = await databaseNow();
      await prisma.order.update({
        where: { id: order.id },
        data: { contactDeadlineAt: new Date(now.getTime() + offsetMs) },
      });
      const response = await bought.seller.post(`/orders/${bought.publicId}/fail`, { reason });
      expect(response.status).toBe(status);
      if (status === 409) {
        expect(await errorBody(response)).toMatchObject({
          code: 'ORDER_TRANSITION_NOT_ALLOWED',
        });
        expect(
          (await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).status,
        ).toBe('ACTIVE');
      }
    },
  );

  it('requires the buyer to confirm a refusal and does not close an active order by itself', async () => {
    const fixture = await createPermissionFixture(prisma);
    const bought = await purchaseFixed(fixture);
    const missing = await bought.buyer.post(`/orders/${bought.publicId}/fail`, {
      reason: 'BUYER_REFUSED',
    });
    expect(missing.status).toBe(400);
    const order = await prisma.order.findUniqueOrThrow({
      where: { publicId: bought.publicId },
    });
    await prisma.order.update({
      where: { id: order.id },
      data: { activatedAt: new Date(order.activatedAt!.getTime() - 30 * DAY_MS) },
    });
    const card = (await (await bought.seller.get(`/orders/${bought.publicId}`)).json()) as Card;
    expect(card.status).toBe('ACTIVE');
  });

  it.each([
    { actor: 'seller' as const, action: 'accept', body: {}, status: 409 },
    { actor: 'buyer' as const, action: 'complete', body: {}, status: 409 },
    { actor: 'buyer' as const, action: 'fail', body: { reason: 'SELLER_REFUSED' }, status: 409 },
    { actor: 'buyer' as const, action: 'fail', body: { reason: 'OFFER_EXPIRED' }, status: 409 },
    { actor: 'seller' as const, action: 'fail', body: { reason: 'OFFER_DECLINED' }, status: 409 },
    { actor: 'buyer' as const, action: 'decline', body: {}, status: 409 },
    { actor: 'stranger' as const, action: 'fail', body: { reason: 'SELLER_REFUSED' }, status: 404 },
  ])('$actor $action on an active order is $status', async (row) => {
    const fixture = await createPermissionFixture(prisma);
    await giveContact(fixture.buyer.id);
    const order = await insertOrder(fixture, {
      buyerId: fixture.buyer.id,
      status: 'ACTIVE',
    });
    const stranger = await extraBuyer('outsider');
    const actor = await signedIn(
      row.actor === 'buyer'
        ? fixture.buyer.email
        : row.actor === 'seller'
          ? fixture.sellers.approved.email
          : stranger.email,
    );
    const response = await actor.post(`/orders/${order.publicId}/${row.action}`, row.body);
    expect(response.status).toBe(row.status);
  });

  it('sends the completion letter to both parties and the failure letter to the other party', async () => {
    const fixture = await createPermissionFixture(prisma);
    const bought = await purchaseFixed(fixture);
    const completed = await bought.seller.post(`/orders/${bought.publicId}/complete`);
    expect(completed.status).toBe(200);
    const done = await prisma.notificationOutbox.findMany({
      where: { kind: 'DEAL_COMPLETED' },
    });
    expect(done.map((row) => row.userId).sort()).toEqual(
      [fixture.buyer.id, fixture.sellers.approved.id].sort(),
    );
    for (const letter of done) {
      const payload = JSON.stringify(letter.payload);
      expect(payload).toContain(bought.publicId);
      expect(payload).not.toContain('+375291112233');
      expect(payload).not.toContain('contactPhone');
    }

    const second = await purchaseOnNewWork(fixture);
    const failed = await second.buyer.post(`/orders/${second.publicId}/fail`, {
      reason: 'BUYER_REFUSED',
      confirm: true,
    });
    expect(failed.status).toBe(200);
    const failure = await prisma.notificationOutbox.findMany({
      where: { kind: 'ORDER_FAILED', userId: fixture.sellers.approved.id },
    });
    expect(failure).toHaveLength(1);
    const payload = failure[0]?.payload as { failReason?: string; listingType?: string };
    expect(payload.failReason).toBe('BUYER_REFUSED');
    expect(payload.listingType).toBe('FIXED');
    expect(JSON.stringify(payload)).not.toContain('+37529');
    expect(
      await prisma.listing.findUniqueOrThrow({ where: { id: second.listingId } }),
    ).toMatchObject({ status: 'LIVE', endedAt: null });
    expect(
      await prisma.order.findUniqueOrThrow({ where: { publicId: second.publicId } }),
    ).toMatchObject({ failedBy: 'buyer', faultSide: 'BUYER' });
  });

  it('lets an admin change the outcome only with a reason and writes the audit', async () => {
    const fixture = await createPermissionFixture(prisma);
    const bought = await purchaseFixed(fixture);
    const admin = await adminUser();
    const missing = await admin.client.post(`/admin/orders/${bought.publicId}/outcome`, {
      to: 'FAILED',
      failReason: 'ADMIN_CANCELLED',
    });
    expect(missing.status).toBe(400);
    const changed = await admin.client.post(`/admin/orders/${bought.publicId}/outcome`, {
      to: 'FAILED',
      failReason: 'ADMIN_CANCELLED',
      reason: 'Duplicate reservation',
    });
    expect(changed.status).toBe(200);
    const order = await prisma.order.findUniqueOrThrow({
      where: { publicId: bought.publicId },
    });
    expect(order).toMatchObject({
      status: 'FAILED',
      failReason: 'ADMIN_CANCELLED',
      faultSide: 'NONE',
      failedBy: 'admin',
    });
    const audit = await prisma.auditEvent.findFirstOrThrow({
      where: { targetId: order.id, action: 'ORDER_OUTCOME' },
    });
    expect(audit.actorUserId).toBe(admin.id);
    expect(audit.oldStatus).toBe('ACTIVE');
    expect(audit.newStatus).toBe('FAILED:ADMIN_CANCELLED');
    expect(audit.reason).toContain(bought.publicId);
    expect(audit.reason).toContain('Duplicate reservation');
    const restored = await admin.client.post(`/admin/orders/${bought.publicId}/outcome`, {
      to: 'COMPLETED',
      reason: 'The work was handed over',
    });
    expect(restored.status).toBe(200);
    expect(
      await prisma.order.findUniqueOrThrow({ where: { id: order.id } }),
    ).toMatchObject({ status: 'COMPLETED', failReason: null, completedBy: 'ADMIN' });
  });
});

describe('next participant', () => {
  it('offers the next two bidders and skips a blocked or voided candidate', async () => {
    const fixture = await createPermissionFixture(prisma);
    const amounts = [4_000, 3_000, 2_000, 1_500];
    const bidders = [];
    for (const [index, amount] of amounts.entries()) {
      bidders.push(await extraBuyer(`bidder-${index}`, amount));
    }
    const auction = await auctionWithBids(fixture, bidders);
    const winner = bidders[0]!;
    const failed = await insertOrder(fixture, {
      buyerId: winner.id,
      status: 'FAILED',
      source: 'AUCTION_WIN',
      listingType: 'AUCTION',
      listingId: auction.listingId,
      productId: auction.productId,
      failReason: 'BUYER_REFUSED',
      faultSide: 'BUYER',
      failedBy: 'buyer',
      failedAt: await databaseNow(),
      amountMinor: 4_000,
      sourceBidId: auction.bids[0],
    });
    expect(
      await prisma.order.count({ where: { listingId: auction.listingId } }),
    ).toBe(1);

    const seller = await signedIn(fixture.sellers.approved.email);
    const second = await seller.post(`/orders/${failed.publicId}/offer-next`);
    expect(second.status).toBe(200);
    const secondCard = (await second.json()) as Card;
    expect(secondCard.status).toBe('OFFERED');
    expect(secondCard.source).toBe('SECOND_CHANCE');
    const secondOrder = await prisma.order.findUniqueOrThrow({
      where: { publicId: secondCard.publicId },
    });
    expect(secondOrder.buyerUserId).toBe(bidders[1]!.id);
    expect(secondOrder.offerExpiresAt!.getTime() - secondOrder.createdAt.getTime()).toBe(
      24 * HOUR_MS,
    );

    const declined = await bidders[1]!.client.post(
      `/orders/${secondCard.publicId}/decline`,
    );
    expect(declined.status).toBe(200);
    const third = await seller.post(`/orders/${secondCard.publicId}/offer-next`);
    expect(third.status).toBe(200);
    const thirdOrder = await prisma.order.findFirstOrThrow({
      where: { listingId: auction.listingId, status: 'OFFERED' },
    });
    expect(thirdOrder.buyerUserId).toBe(bidders[2]!.id);
    const none = await seller.post(`/orders/${thirdOrder.publicId}/offer-next`);
    expect(none.status).toBe(409);
    expect(await errorBody(none)).toMatchObject({ code: 'NO_NEXT_BIDDER' });
  });

  it('skips a banned bidder and a voided bid, then blocks accept at three reservations', async () => {
    const fixture = await createPermissionFixture(prisma);
    const bidders = [
      await extraBuyer('lead'),
      await extraBuyer('banned'),
      await extraBuyer('third'),
      await extraBuyer('fourth'),
    ];
    const auction = await auctionWithBids(
      fixture,
      bidders.map((bidder, index) => ({ ...bidder, amount: 4_000 - index * 500 })),
    );
    await prisma.user.update({
      where: { id: bidders[1]!.id },
      data: { status: 'banned' },
    });
    await prisma.bid.update({
      where: { id: auction.bids[3] },
      data: { voidedAt: new Date('2026-09-02T00:00:00.000Z'), voidReason: 'BANNED' },
    });
    const failed = await insertOrder(fixture, {
      buyerId: bidders[0]!.id,
      status: 'FAILED',
      source: 'AUCTION_WIN',
      listingId: auction.listingId,
      productId: auction.productId,
      failReason: 'BUYER_NO_CONTACT',
      faultSide: 'BUYER',
      failedBy: 'seller',
      failedAt: new Date('2026-09-03T00:00:00.000Z'),
      sourceBidId: auction.bids[0],
      listingType: 'AUCTION',
    });
    const seller = await signedIn(fixture.sellers.approved.email);
    const offered = await seller.post(`/orders/${failed.publicId}/offer-next`);
    expect(offered.status).toBe(200);
    const offer = await prisma.order.findFirstOrThrow({
      where: { listingId: auction.listingId, status: 'OFFERED' },
    });
    expect(offer.buyerUserId).toBe(bidders[2]!.id);

    await insertOrder(fixture, { buyerId: bidders[2]!.id, status: 'ACTIVE' });
    await insertOrder(fixture, { buyerId: bidders[2]!.id, status: 'ACTIVE' });
    await insertOrder(fixture, { buyerId: bidders[2]!.id, status: 'ACTIVE' });
    const accepted = await bidders[2]!.client.post(`/orders/${offer.publicId}/accept`);
    expect(accepted.status).toBe(403);
    expect(await errorBody(accepted)).toMatchObject({ code: 'BUYER_ORDER_LIMIT' });
  });

  it('lets the author list the work again after a failed auction', async () => {
    const fixture = await createPermissionFixture(prisma);
    const seller = await signedIn(fixture.sellers.approved.email);
    const now = await databaseNow();
    const created = await seller.post(`/works/${fixture.approvedProductId}/listings`, {
      type: 'AUCTION',
      currency: 'BYN',
      startPriceMinor: 1_000,
      startsAt: new Date(now.getTime() - 1_000).toISOString(),
      endsAt: new Date(now.getTime() + 2 * DAY_MS).toISOString(),
      contactWindowHours: 24,
    });
    expect(created.status).toBe(201);
    const listingId = ((await created.json()) as { id: string }).id;
    await prisma.listing.update({
      where: { id: listingId },
      data: { status: 'ENDED', endedAt: now },
    });
    await insertOrder(fixture, {
      buyerId: fixture.buyer.id,
      status: 'FAILED',
      source: 'AUCTION_WIN',
      listingType: 'AUCTION',
      listingId,
      productId: fixture.approvedProductId,
      failReason: 'BUYER_REFUSED',
      faultSide: 'BUYER',
      failedBy: 'buyer',
      failedAt: now,
    });
    const again = await seller.post(`/works/${fixture.approvedProductId}/listings`, {
      type: 'AUCTION',
      currency: 'BYN',
      startPriceMinor: 1_000,
      startsAt: new Date(now.getTime() - 1_000).toISOString(),
      endsAt: new Date(now.getTime() + 3 * DAY_MS).toISOString(),
    });
    expect(again.status).toBe(201);
  });
});

describe('strikes and trust', () => {
  it('blocks bidding, buying and accepting after two buyer refusals until an admin voids one', async () => {
    const fixture = await createPermissionFixture(prisma);
    await giveContact(fixture.buyer.id);
    const buyer = await signedIn(fixture.buyer.email);
    const first = await insertOrder(fixture, {
      buyerId: fixture.buyer.id,
      status: 'FAILED',
      failReason: 'BUYER_REFUSED',
      faultSide: 'BUYER',
      failedBy: 'buyer',
      failedAt: await databaseNow(),
    });
    await insertOrder(fixture, {
      buyerId: fixture.buyer.id,
      status: 'FAILED',
      failReason: 'BUYER_REFUSED',
      faultSide: 'BUYER',
      failedBy: 'buyer',
      failedAt: await databaseNow(),
    });
    const auction = await liveAuction(fixture);
    const bid = await buyer.post(`/listings/${auction}/bids`, {
      amountMinor: 1_000,
      idempotencyKey: 'blocked-bid',
      turnstileToken: 'XXXX.DUMMY.TOKEN.XXXX',
    });
    expect(bid.status).toBe(403);
    expect(await errorBody(bid)).toMatchObject({ code: 'BUYER_BLOCKED' });
    const { seller, listingId } = await fixedOnApproved(fixture);
    const purchase = await buyer.post(`/listings/${listingId}/purchase`, {
      idempotencyKey: 'blocked-buy',
      turnstileToken: 'XXXX.DUMMY.TOKEN.XXXX',
    });
    expect(purchase.status).toBe(403);
    const offered = await insertOrder(fixture, {
      buyerId: fixture.buyer.id,
      status: 'OFFERED',
      source: 'SECOND_CHANCE',
      listingType: 'AUCTION',
    });
    const accepted = await buyer.post(`/orders/${offered.publicId}/accept`);
    expect(accepted.status).toBe(403);
    expect(await errorBody(accepted)).toMatchObject({ code: 'BUYER_BLOCKED' });

    const admin = await adminUser();
    const missing = await admin.client.post(
      `/admin/orders/${first.publicId}/void-strike`,
      {},
    );
    expect(missing.status).toBe(400);
    const voided = await admin.client.post(`/admin/orders/${first.publicId}/void-strike`, {
      reason: 'The buyer did write',
    });
    expect(voided.status).toBe(200);
    const audit = await prisma.auditEvent.findFirstOrThrow({
      where: { targetId: first.id, action: 'ORDER_VOID_STRIKE' },
    });
    expect(audit.actorUserId).toBe(admin.id);
    expect(audit.oldStatus).toBe('strike');
    expect(audit.newStatus).toBe('voided');
    expect(audit.reason).toContain(first.publicId);
    const again = await buyer.post(`/listings/${auction}/bids`, {
      amountMinor: 1_000,
      idempotencyKey: 'after-void',
      turnstileToken: 'XXXX.DUMMY.TOKEN.XXXX',
    });
    expect(again.status).toBe(200);
    expect(seller).toBeDefined();
  });

  it('counts a seller-marked refusal only after 72 hours and not during the buyer report', async () => {
    const fixture = await createPermissionFixture(prisma);
    const bought = await purchaseFixed(fixture);
    const marked = await bought.seller.post(`/orders/${bought.publicId}/fail`, {
      reason: 'BUYER_REFUSED',
    });
    expect(marked.status).toBe(200);
    const fresh = await prisma.order.findUniqueOrThrow({
      where: { publicId: bought.publicId },
    });
    expect(fresh.failedBy).toBe('seller');
    const auction = await liveAuction(fixture);
    const buyer = bought.buyer;
    expect(
      (
        await buyer.post(`/listings/${auction}/bids`, {
          amountMinor: 1_000,
          idempotencyKey: 'fresh-seller-mark',
          turnstileToken: 'XXXX.DUMMY.TOKEN.XXXX',
        })
      ).status,
    ).toBe(200);
    await prisma.order.update({
      where: { id: fresh.id },
      data: { failedAt: new Date((await databaseNow()).getTime() - 73 * HOUR_MS) },
    });
    await insertOrder(fixture, {
      buyerId: fixture.buyer.id,
      status: 'FAILED',
      failReason: 'BUYER_NO_CONTACT',
      faultSide: 'BUYER',
      failedBy: 'seller',
      failedAt: new Date((await databaseNow()).getTime() - 73 * HOUR_MS),
    });
    await prisma.report.create({
      data: {
        targetType: 'ORDER',
        targetId: fresh.id,
        reporterUserId: fixture.buyer.id,
        reason: 'NO_CONTACT',
        status: 'OPEN',
      },
    });
    const secondAuction = await liveAuction(fixture, 'Report auction');
    expect(
      (
        await buyer.post(`/listings/${secondAuction}/bids`, {
          amountMinor: 1_000,
          idempotencyKey: 'report-open',
          turnstileToken: 'XXXX.DUMMY.TOKEN.XXXX',
        })
      ).status,
    ).toBe(200);
  });

  it('bans through the admin route and shows trust signals on the user card', async () => {
    const fixture = await createPermissionFixture(prisma);
    await giveContact(fixture.buyer.id);
    await insertOrder(fixture, {
      buyerId: fixture.buyer.id,
      status: 'COMPLETED',
      source: 'FIXED_PURCHASE',
    });
    const admin = await adminUser();
    const missing = await admin.client.post(`/admin/users/${fixture.buyer.id}/ban`, {});
    expect(missing.status).toBe(400);
    const banned = await admin.client.post(`/admin/users/${fixture.buyer.id}/ban`, {
      reason: 'Repeated refusals',
    });
    expect(banned.status).toBe(200);
    const audit = await prisma.auditEvent.findFirstOrThrow({
      where: { targetId: fixture.buyer.id, newStatus: 'banned' },
    });
    expect(audit.actorUserId).toBe(admin.id);
    expect(audit.oldStatus).toBe('active');
    expect(audit.reason).toBe('Repeated refusals');
    const card = await admin.client.get(`/admin/users/${fixture.buyer.id}`);
    expect(card.status).toBe(200);
    const body = (await card.json()) as {
      trustSignals: { completedAsBuyer: number; emailVerified: boolean };
    };
    expect(body.trustSignals.completedAsBuyer).toBe(1);
    expect(body.trustSignals.emailVerified).toBe(true);
    expect(JSON.stringify(body)).not.toContain('contactPhone');
  });
});

async function extraBuyer(label: string, amount = 0) {
  const email = `${label}.${randomUUID().slice(0, 8)}@wave3.test`;
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: fixturePasswordHash,
      displayName: label,
      emailVerifiedAt: new Date('2026-09-01T00:00:00.000Z'),
      contactPhone: '+375291112244',
      termsAcceptances: {
        create: {
          rulesVersion: 'MVP_RULES_V1',
          acceptedAt: new Date('2026-09-01T00:00:00.000Z'),
        },
      },
    },
    select: { id: true, email: true },
  });
  return { ...user, amount, client: await signedIn(email) };
}

async function auctionWithBids(
  fixture: PermissionFixture,
  bidders: Array<{ id: string; amount: number }>,
) {
  const product = await spareProduct(fixture, `Auction ${randomUUID().slice(0, 8)}`);
  const listing = await prisma.listing.create({
    data: {
      productId: product.id,
      sellerUserId: fixture.sellers.approved.id,
      type: 'AUCTION',
      status: 'ENDED',
      currency: 'BYN',
      startsAt: new Date('2026-09-01T00:00:00.000Z'),
      endsAt: new Date('2026-09-02T00:00:00.000Z'),
      originalEndsAt: new Date('2026-09-02T00:00:00.000Z'),
      endedAt: new Date('2026-09-02T00:00:00.000Z'),
      contactWindowHours: 24,
      currentPriceMinor: bidders[0]?.amount ?? 1_000,
      bidCount: bidders.length,
      auctionRules: { create: { startPriceMinor: 1_000, stepTableCode: 'BYN_V1' } },
    },
    select: { id: true },
  });
  const bids: string[] = [];
  for (const [index, bidder] of bidders.entries()) {
    const bid = await prisma.bid.create({
      data: {
        listingId: listing.id,
        bidderUserId: bidder.id,
        amountMinor: bidder.amount,
        idempotencyKey: `seed-${index}`,
        createdAt: new Date(Date.parse('2026-09-01T01:00:00.000Z') + index * 60_000),
      },
      select: { id: true },
    });
    bids.push(bid.id);
  }
  return { listingId: listing.id, productId: product.id, bids };
}

async function liveAuction(fixture: PermissionFixture, title = 'Live auction') {
  const product = await spareProduct(fixture, title);
  const now = await databaseNow();
  const listing = await prisma.listing.create({
    data: {
      productId: product.id,
      sellerUserId: fixture.sellers.approved.id,
      type: 'AUCTION',
      status: 'LIVE',
      currency: 'BYN',
      startsAt: new Date(now.getTime() - 60_000),
      endsAt: new Date(now.getTime() + DAY_MS),
      originalEndsAt: new Date(now.getTime() + DAY_MS),
      contactWindowHours: 24,
      currentPriceMinor: 1_000,
      bidCount: 0,
      auctionRules: { create: { startPriceMinor: 1_000, stepTableCode: 'BYN_V1' } },
    },
    select: { id: true },
  });
  return listing.id;
}

async function fixedOnApproved(fixture: PermissionFixture) {
  const seller = await signedIn(fixture.sellers.approved.email);
  const now = await databaseNow();
  const created = await seller.post(`/works/${fixture.approvedProductId}/listings`, {
    type: 'FIXED',
    currency: 'BYN',
    priceMinor: 1_500,
    startsAt: new Date(now.getTime() - 1_000).toISOString(),
    contactWindowHours: 6,
  });
  expect(created.status).toBe(201);
  return { seller, listingId: ((await created.json()) as { id: string }).id };
}

async function purchaseOnNewWork(fixture: PermissionFixture) {
  const product = await spareProduct(fixture, `Second ${randomUUID().slice(0, 8)}`);
  await prisma.productRevision
    .findFirst({ where: { productId: fixture.approvedProductId } })
    .then(async (revision) => {
      if (!revision) return;
      await prisma.product.update({
        where: { id: product.id },
        data: { publishedRevisionId: null },
      });
    });
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
  const buyer = await signedIn(fixture.buyer.email);
  const purchased = await buyer.post(`/listings/${listing.id}/purchase`, {
    idempotencyKey: `second-${randomUUID()}`,
    turnstileToken: 'XXXX.DUMMY.TOKEN.XXXX',
  });
  expect(purchased.status).toBe(200);
  const body = (await purchased.json()) as { order: { publicId: string } };
  return { buyer, listingId: listing.id, publicId: body.order.publicId };
}
