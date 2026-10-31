import { randomUUID } from 'node:crypto';

import { COMMERCE_LIMITS } from '@bidplace/contracts';
import { type PrismaClient } from '@bidplace/database';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { renderNotification } from '../../src/notifications/notification-templates';
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
  await prisma.rateLimitCounter.deleteMany();
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
const COMPLAINT = 'COMPLAINT-TEXT-9f3a';
const BUYER_PHONE = '+375291112233';
const SELLER_PHONE = '+375291110099';
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
    status: 'ACTIVE' | 'COMPLETED' | 'FAILED';
    completedAt?: Date;
    failedAt?: Date;
    failReason?: string;
    faultSide?: 'BUYER' | 'SELLER' | 'NONE';
    failedBy?: string;
  },
) {
  const product = await prisma.product.create({
    data: {
      publicId: `p${randomUUID().replace(/-/g, '').slice(0, 10)}`,
      sellerProfileId: fixture.sellers.approved.profileId,
      title: `Report ${randomUUID().slice(0, 8)}`,
      status: 'APPROVED',
    },
    select: { id: true, publicId: true, title: true },
  });
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
      contactWindowHours: 24,
    },
    select: { id: true },
  });
  const now = await databaseNow();
  if (product.publicId == null || product.title == null) {
    throw new Error('product snapshot fields missing');
  }
  return prisma.order.create({
    data: {
      publicId: `o${randomUUID().replace(/-/g, '').slice(0, 10)}`,
      dealCode: String(++dealSerial).padStart(6, '0'),
      productId: product.id,
      listingId: listing.id,
      sellerUserId: fixture.sellers.approved.id,
      buyerUserId: input.buyerId,
      source: 'FIXED_PURCHASE',
      amountMinor: 1_500,
      currency: 'BYN',
      status: input.status,
      ...(input.failReason === undefined
        ? {}
        : { failReason: input.failReason as never }),
      ...(input.faultSide === undefined ? {} : { faultSide: input.faultSide }),
      ...(input.failedBy === undefined ? {} : { failedBy: input.failedBy }),
      ...(input.failedAt === undefined ? {} : { failedAt: input.failedAt }),
      ...(input.completedAt === undefined
        ? {}
        : { completedAt: input.completedAt, completedBy: 'SELLER' }),
      activatedAt: input.status === 'ACTIVE' ? now : new Date(now.getTime() - DAY_MS),
      contactDeadlineAt:
        input.status === 'ACTIVE' ? new Date(now.getTime() + 24 * HOUR_MS) : now,
      workTitleSnapshot: product.title,
      workPublicIdSnapshot: product.publicId,
      sellerNameSnapshot: 'Wave 3 APPROVED',
    },
  });
}

function reportBody(text = COMPLAINT) {
  return { reason: 'NOT_HANDED_OVER', text };
}

function assertNoContacts(value: unknown) {
  const raw = JSON.stringify(value);
  expect(raw).not.toContain(BUYER_PHONE);
  expect(raw).not.toContain(SELLER_PHONE);
  expect(raw).not.toContain('@wave3.test');
  expect(raw).not.toContain('contactPhone');
  expect(raw).not.toContain('contactTelegram');
}

describe('order reports', () => {
  it.each([
    {
      label: '14 days',
      ageMs: COMMERCE_LIMITS.reportWindowDays * DAY_MS - 60_000,
      status: 201,
      orderStatus: 'COMPLETED' as const,
    },
    {
      label: '14 days plus 1 minute',
      ageMs: COMMERCE_LIMITS.reportWindowDays * DAY_MS + 60_000,
      status: 409,
      orderStatus: 'COMPLETED' as const,
    },
    {
      label: '15 days',
      ageMs: (COMMERCE_LIMITS.reportWindowDays + 1) * DAY_MS,
      status: 409,
      orderStatus: 'COMPLETED' as const,
    },
    {
      label: '14 days after a failed order',
      ageMs: COMMERCE_LIMITS.reportWindowDays * DAY_MS - 60_000,
      status: 201,
      orderStatus: 'FAILED' as const,
    },
  ])(
    'a participant report $label after the order closed is $status',
    async ({ ageMs, status, orderStatus }) => {
      const fixture = await createPermissionFixture(prisma);
      await giveContact(fixture.buyer.id, BUYER_PHONE);
      await giveContact(fixture.sellers.approved.id, SELLER_PHONE);
      const closedAt = new Date((await databaseNow()).getTime() - ageMs);
      const order = await insertOrder(fixture, {
        buyerId: fixture.buyer.id,
        status: orderStatus,
        ...(orderStatus === 'COMPLETED'
          ? { completedAt: closedAt }
          : {
              failedAt: closedAt,
              failReason: 'BUYER_REFUSED',
              faultSide: 'BUYER' as const,
              failedBy: 'seller',
            }),
      });
      const buyer = await signedIn(fixture.buyer.email);
      const response = await buyer.post(
        `/orders/${order.publicId}/reports`,
        reportBody(),
      );
      expect(response.status).toBe(status);
      if (status === 201) {
        const body = await response.json();
        assertNoContacts(body);
        expect(body).toMatchObject({
          targetType: 'ORDER',
          targetId: order.id,
          reason: 'NOT_HANDED_OVER',
          status: 'OPEN',
          text: COMPLAINT,
        });
      } else {
        expect((await errorBody(response)).code).toBe('conflict');
        expect(
          await prisma.report.count({ where: { targetId: order.id } }),
        ).toBe(0);
      }
    },
  );

  it('lets the buyer report after the author marks the deal failed', async () => {
    const fixture = await createPermissionFixture(prisma);
    await giveContact(fixture.buyer.id, BUYER_PHONE);
    await giveContact(fixture.sellers.approved.id, SELLER_PHONE);
    const order = await insertOrder(fixture, {
      buyerId: fixture.buyer.id,
      status: 'ACTIVE',
    });
    const seller = await signedIn(fixture.sellers.approved.email);
    const failed = await seller.post(`/orders/${order.publicId}/fail`, {
      reason: 'BUYER_REFUSED',
    });
    expect(failed.status).toBe(200);
    const buyer = await signedIn(fixture.buyer.email);
    const response = await buyer.post(
      `/orders/${order.publicId}/reports`,
      reportBody(),
    );
    expect(response.status).toBe(201);
    const body = (await response.json()) as { status: string };
    assertNoContacts(body);
    expect(body.status).toBe('OPEN');
  });

  it('hides the order from a stranger', async () => {
    const fixture = await createPermissionFixture(prisma);
    const order = await insertOrder(fixture, {
      buyerId: fixture.buyer.id,
      status: 'ACTIVE',
    });
    const stranger = await signedIn(fixture.sellers.otherApproved.email);
    const response = await stranger.post(
      `/orders/${order.publicId}/reports`,
      reportBody(),
    );
    expect(response.status).toBe(404);
    expect(await prisma.report.count({ where: { targetId: order.id } })).toBe(0);
  });

  it('refuses a second open report from the same participant and letters the other party without the text', async () => {
    const fixture = await createPermissionFixture(prisma);
    await giveContact(fixture.buyer.id, BUYER_PHONE);
    await giveContact(fixture.sellers.approved.id, SELLER_PHONE);
    const order = await insertOrder(fixture, {
      buyerId: fixture.buyer.id,
      status: 'ACTIVE',
    });
    const buyer = await signedIn(fixture.buyer.email);
    const seller = await signedIn(fixture.sellers.approved.email);
    const first = await buyer.post(
      `/orders/${order.publicId}/reports`,
      reportBody(),
    );
    expect(first.status).toBe(201);
    const created = (await first.json()) as { id: string; text: string };
    const second = await buyer.post(
      `/orders/${order.publicId}/reports`,
      reportBody('another complaint'),
    );
    expect(second.status).toBe(409);
    expect((await errorBody(second)).code).toBe('conflict');
    expect(
      await prisma.report.count({
        where: { targetId: order.id, reporterUserId: fixture.buyer.id, status: 'OPEN' },
      }),
    ).toBe(1);

    const sellerReport = await seller.post(
      `/orders/${order.publicId}/reports`,
      { reason: 'TERMS_CHANGED', text: 'seller side' },
    );
    expect(sellerReport.status).toBe(201);

    const letters = await prisma.notificationOutbox.findMany({
      where: { kind: 'ORDER_REPORTED' },
    });
    expect(letters.map((row) => row.userId).sort()).toEqual(
      [fixture.buyer.id, fixture.sellers.approved.id].sort(),
    );
    const toSeller = letters.find((row) => row.userId === fixture.sellers.approved.id);
    expect(toSeller).toBeTruthy();
    const payload = toSeller!.payload as Record<string, unknown>;
    expect(payload).toMatchObject({
      orderPublicId: order.publicId,
      reportId: created.id,
    });
    expect(payload).not.toHaveProperty('text');
    expect(JSON.stringify(payload)).not.toContain(COMPLAINT);
    assertNoContacts(payload);
    const rendered = renderNotification(
      'ORDER_REPORTED',
      payload as Record<string, string | number>,
    );
    expect(rendered.text).not.toContain(COMPLAINT);
    expect(rendered.subject).toContain('По вашему заказу открыта жалоба');

    const admin = await adminUser();
    const list = await admin.client.get('/admin/reports?status=OPEN');
    expect(list.status).toBe(200);
    const listed = (await list.json()) as {
      reports: Array<{
        id: string;
        orderPublicId: string;
        reporterUserId: string;
        buyerUserId: string;
        sellerUserId: string;
        adminNote: string | null;
      }>;
    };
    const row = listed.reports.find((item) => item.id === created.id);
    expect(row).toMatchObject({
      orderPublicId: order.publicId,
      reporterUserId: fixture.buyer.id,
      buyerUserId: fixture.buyer.id,
      sellerUserId: fixture.sellers.approved.id,
      adminNote: null,
    });
    assertNoContacts(listed);
  });

  it('freezes the buyer strike while that buyer report is open', async () => {
    const fixture = await createPermissionFixture(prisma);
    await giveContact(fixture.buyer.id, BUYER_PHONE);
    const order = await insertOrder(fixture, {
      buyerId: fixture.buyer.id,
      status: 'ACTIVE',
    });
    const seller = await signedIn(fixture.sellers.approved.email);
    const failed = await seller.post(`/orders/${order.publicId}/fail`, {
      reason: 'BUYER_REFUSED',
    });
    expect(failed.status).toBe(200);
    await prisma.order.update({
      where: { id: order.id },
      data: {
        failedAt: new Date((await databaseNow()).getTime() - 73 * HOUR_MS),
      },
    });
    const admin = await adminUser();
    const before = await admin.client.get(`/admin/users/${fixture.buyer.id}`);
    expect(before.status).toBe(200);
    expect(
      ((await before.json()) as { trustSignals: { buyerStrikes: number } })
        .trustSignals.buyerStrikes,
    ).toBe(1);

    const buyer = await signedIn(fixture.buyer.email);
    const report = await buyer.post(
      `/orders/${order.publicId}/reports`,
      reportBody(),
    );
    expect(report.status).toBe(201);
    const after = await admin.client.get(`/admin/users/${fixture.buyer.id}`);
    expect(
      ((await after.json()) as { trustSignals: { buyerStrikes: number } })
        .trustSignals.buyerStrikes,
    ).toBe(0);
  });

  it('counts the buyer strike again after the report is resolved without voiding it', async () => {
    const fixture = await createPermissionFixture(prisma);
    await giveContact(fixture.buyer.id, BUYER_PHONE);
    const order = await insertOrder(fixture, {
      buyerId: fixture.buyer.id,
      status: 'ACTIVE',
    });
    const seller = await signedIn(fixture.sellers.approved.email);
    const failed = await seller.post(`/orders/${order.publicId}/fail`, {
      reason: 'BUYER_REFUSED',
    });
    expect(failed.status).toBe(200);
    await prisma.order.update({
      where: { id: order.id },
      data: {
        failedAt: new Date((await databaseNow()).getTime() - 73 * HOUR_MS),
      },
    });
    const buyer = await signedIn(fixture.buyer.email);
    const report = await buyer.post(
      `/orders/${order.publicId}/reports`,
      reportBody(),
    );
    expect(report.status).toBe(201);
    const reportId = ((await report.json()) as { id: string }).id;
    const admin = await adminUser();
    const resolved = await admin.client.post(`/admin/reports/${reportId}/resolve`, {
      status: 'REJECTED',
      adminNote: 'The refusal stands',
    });
    expect(resolved.status).toBe(200);
    const card = await admin.client.get(`/admin/users/${fixture.buyer.id}`);
    expect(
      ((await card.json()) as { trustSignals: { buyerStrikes: number } })
        .trustSignals.buyerStrikes,
    ).toBe(1);
    const stored = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(stored.strikeVoidedAt).toBeNull();
  });

  it('resolves an open report, changes the order, and counts an upheld author fault', async () => {
    const fixture = await createPermissionFixture(prisma);
    await giveContact(fixture.buyer.id, BUYER_PHONE);
    await giveContact(fixture.sellers.approved.id, SELLER_PHONE);
    const order = await insertOrder(fixture, {
      buyerId: fixture.buyer.id,
      status: 'ACTIVE',
    });
    const buyer = await signedIn(fixture.buyer.email);
    const created = await buyer.post(
      `/orders/${order.publicId}/reports`,
      reportBody(),
    );
    expect(created.status).toBe(201);
    const reportId = ((await created.json()) as { id: string }).id;
    const admin = await adminUser();
    const missing = await admin.client.post(`/admin/reports/${reportId}/resolve`, {
      status: 'UPHELD',
      faultSide: 'SELLER',
    });
    expect(missing.status).toBe(400);
    expect((await errorBody(missing)).code).toBe('validation_error');
    expect(await prisma.auditEvent.count({ where: { targetId: reportId } })).toBe(0);

    const resolved = await admin.client.post(`/admin/reports/${reportId}/resolve`, {
      status: 'UPHELD',
      faultSide: 'SELLER',
      adminNote: 'Author did not hand the work over',
      orderAction: { to: 'FAILED', failReason: 'ADMIN_CANCELLED' },
    });
    expect(resolved.status).toBe(200);
    const body = await resolved.json();
    assertNoContacts(body);
    expect(body).toMatchObject({
      id: reportId,
      status: 'UPHELD',
      faultSide: 'SELLER',
    });
    const stored = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(stored.status).toBe('FAILED');
    expect(stored.failReason).toBe('ADMIN_CANCELLED');
    const reportAudit = await prisma.auditEvent.findFirstOrThrow({
      where: { targetType: 'REPORT', targetId: reportId },
    });
    expect(reportAudit.actorUserId).toBe(admin.id);
    expect(reportAudit.oldStatus).toBe('OPEN');
    expect(reportAudit.reason).toContain(order.publicId);
    expect(reportAudit.reason).toContain('Author did not hand the work over');
    const orderAudit = await prisma.auditEvent.findFirstOrThrow({
      where: { targetType: 'ORDER', targetId: order.id, action: 'ORDER_OUTCOME' },
    });
    expect(orderAudit.actorUserId).toBe(admin.id);
    expect(orderAudit.oldStatus).toBe('ACTIVE');
    expect(orderAudit.newStatus).toBe('FAILED:ADMIN_CANCELLED');

    const sellerCard = await admin.client.get(
      `/admin/users/${fixture.sellers.approved.id}`,
    );
    expect(
      ((await sellerCard.json()) as { trustSignals: { upheldReportsAgainst: number } })
        .trustSignals.upheldReportsAgainst,
    ).toBe(1);
    const buyerCard = await admin.client.get(`/admin/users/${fixture.buyer.id}`);
    expect(
      ((await buyerCard.json()) as { trustSignals: { upheldReportsAgainst: number } })
        .trustSignals.upheldReportsAgainst,
    ).toBe(0);

    const same = await admin.client.post(`/admin/reports/${reportId}/resolve`, {
      status: 'UPHELD',
      faultSide: 'SELLER',
      adminNote: 'Author did not hand the work over',
      orderAction: { to: 'FAILED', failReason: 'ADMIN_CANCELLED' },
    });
    expect(same.status).toBe(200);
    expect(((await same.json()) as { status: string }).status).toBe('UPHELD');

    const again = await admin.client.post(`/admin/reports/${reportId}/resolve`, {
      status: 'REJECTED',
      adminNote: 'Already decided',
      orderAction: { to: 'COMPLETED' },
    });
    expect(again.status).toBe(409);
    expect((await errorBody(again)).code).toBe('conflict');
    expect(
      (await prisma.report.findUniqueOrThrow({ where: { id: reportId } })).status,
    ).toBe('UPHELD');
    const still = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(still.status).toBe('FAILED');
    expect(
      await prisma.auditEvent.count({
        where: { targetType: 'ORDER', targetId: order.id, action: 'ORDER_OUTCOME' },
      }),
    ).toBe(1);
    const open = await admin.client.get('/admin/reports?status=OPEN');
    const openBody = (await open.json()) as { reports: Array<{ id: string }> };
    expect(openBody.reports.map((row) => row.id)).not.toContain(reportId);
  });

  it('does not resolve a report for a banned admin', async () => {
    const fixture = await createPermissionFixture(prisma);
    const order = await insertOrder(fixture, {
      buyerId: fixture.buyer.id,
      status: 'ACTIVE',
    });
    const buyer = await signedIn(fixture.buyer.email);
    const created = await buyer.post(
      `/orders/${order.publicId}/reports`,
      reportBody(),
    );
    expect(created.status).toBe(201);
    const reportId = ((await created.json()) as { id: string }).id;
    const admin = await adminUser();
    await prisma.user.update({
      where: { id: admin.id },
      data: { status: 'banned' },
    });
    const response = await admin.client.post(`/admin/reports/${reportId}/resolve`, {
      status: 'REJECTED',
      adminNote: 'Too late',
    });
    expect(response.status).toBe(401);
    expect(
      (await prisma.report.findUniqueOrThrow({ where: { id: reportId } })).status,
    ).toBe('OPEN');
  });

  it('stops the sixth report from one user in an hour', async () => {
    const fixture = await createPermissionFixture(prisma);
    await giveContact(fixture.buyer.id, BUYER_PHONE);
    const buyer = await signedIn(fixture.buyer.email);
    const orders = [];
    for (let index = 0; index < 6; index += 1) {
      orders.push(
        await insertOrder(fixture, {
          buyerId: fixture.buyer.id,
          status: 'ACTIVE',
        }),
      );
    }
    const statuses: number[] = [];
    let last: Response | null = null;
    for (const order of orders) {
      last = await buyer.post(`/orders/${order.publicId}/reports`, reportBody());
      statuses.push(last.status);
    }
    expect(statuses).toEqual([201, 201, 201, 201, 201, 429]);
    expect((await errorBody(last!)).code).toBe('rate_limited');
    const counter = await prisma.rateLimitCounter.findUniqueOrThrow({
      where: { key: `commerce:report:${fixture.buyer.id}:global` },
    });
    expect(counter.count).toBeGreaterThanOrEqual(6);
    expect(
      await prisma.report.count({ where: { reporterUserId: fixture.buyer.id } }),
    ).toBe(5);
  });
});
