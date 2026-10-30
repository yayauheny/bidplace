import { randomUUID } from 'node:crypto';

import { z } from 'zod';

import { Logger } from '@nestjs/common';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { MailTransport } from '../../src/core/mail';
import { SERVER_ENV } from '../../src/core/config';
import { TickService } from '../../src/core/tick/tick.service';
import { enqueueNotification } from '../../src/notifications/notification-outbox';
import { NotificationDeliveryService } from '../../src/notifications/notification-delivery.service';
import { isTickCronConfigured } from '../../src/notifications/notification-admin.controller';
import {
  createHttpTestApp,
  HttpTestClient,
  type HttpTestApp,
} from './http-test-app';
import { fixturePasswordHash } from './permission-fixtures';
import {
  createIntegrationDatabaseContext,
  type IntegrationDatabaseContext,
} from './test-database';

let database: IntegrationDatabaseContext;
let http: HttpTestApp;
let delivery: NotificationDeliveryService;

beforeAll(async () => {
  delete process.env.TICK_CRON;
  database = await createIntegrationDatabaseContext();
  http = await createHttpTestApp(database.databaseUrl);
  delivery = http.app.get(NotificationDeliveryService);
});

afterEach(async () => {
  vi.restoreAllMocks();
  await database.prisma.auditEvent.deleteMany();
  await database.prisma.notificationOutbox.deleteMany();
  await database.prisma.userNotificationSettings.deleteMany();
  await database.prisma.report.deleteMany();
  await database.prisma.listing.deleteMany();
});

afterAll(async () => {
  await http?.close();
  await database?.cleanup();
});

async function createUser(options: { verified: boolean; role?: string }) {
  return database.prisma.user.create({
    data: {
      email: `notice.${randomUUID()}@wave3.test`,
      passwordHash: fixturePasswordHash,
      displayName: 'Notice user',
      role: options.role ?? 'user',
      emailVerifiedAt: options.verified
        ? new Date('2026-10-01T00:00:00.000Z')
        : null,
    },
  });
}

async function login(client: HttpTestClient, email: string) {
  const response = await client.post('/auth/login', {
    email,
    password: 'password123',
  });
  expect(response.status).toBe(201);
}

describe('notification outbox', () => {
  it('skips OUTBID when disabled and still queues mandatory mail in the caller transaction', async () => {
    const user = await createUser({ verified: true });
    const send = vi.spyOn(http.app.get(MailTransport), 'send');
    await database.prisma.userNotificationSettings.create({
      data: { userId: user.id, outbidEmail: false },
    });

    await database.prisma.$transaction(async (tx) => {
      await enqueueNotification(tx, {
        userId: user.id,
        kind: 'OUTBID',
        payload: {
          orderPublicId: 'ordroutbid0001',
          workTitle: 'Ваза',
          bidId: '6f0c1c4a-6c3e-4b7a-9c1d-2a9e0f5b7c11',
        },
      });
      await enqueueNotification(tx, {
        userId: user.id,
        kind: 'BID_WON',
        payload: { orderPublicId: 'ordrmandatory1', workTitle: 'Ваза' },
      });
    });

    await expect(
      database.prisma.$transaction(async (tx) => {
        await enqueueNotification(tx, {
          userId: user.id,
          kind: 'PURCHASED',
          payload: { orderPublicId: 'ordrrollback001', workTitle: 'Ваза' },
        });
        throw new Error('rollback');
      }),
    ).rejects.toThrow('rollback');

    const rows = await database.prisma.notificationOutbox.findMany({
      orderBy: { kind: 'asc' },
    });
    expect(rows.map((row) => row.kind)).toEqual(['BID_WON']);
    expect(send).not.toHaveBeenCalled();

    await database.prisma.$transaction(async (tx) => {
      await enqueueNotification(tx, {
        userId: user.id,
        kind: 'BID_WON',
        payload: { orderPublicId: 'ordrmandatory1', workTitle: 'Ваза' },
      });
    });
    expect(await database.prisma.notificationOutbox.count()).toBe(1);
  });

  it('commits a later write in the same transaction after a duplicate enqueue', async () => {
    const user = await createUser({ verified: true });
    const payload = {
      orderPublicId: 'ordrdedupe00001',
      workTitle: 'Ваза',
    };

    await database.prisma.$transaction(async (tx) => {
      await enqueueNotification(tx, {
        userId: user.id,
        kind: 'BID_WON',
        payload,
      });
      await enqueueNotification(tx, {
        userId: user.id,
        kind: 'BID_WON',
        payload,
      });
      await tx.user.update({
        where: { id: user.id },
        data: { displayName: 'Still open' },
      });
    });

    expect(await database.prisma.notificationOutbox.count()).toBe(1);
    expect(
      (
        await database.prisma.user.findUniqueOrThrow({
          where: { id: user.id },
        })
      ).displayName,
    ).toBe('Still open');
  });

  it.each([
    [
      'CONFIRM_DEAL_REMINDER',
      'slot',
      '24h',
      '48h',
      { orderPublicId: 'ordrslot0000001' },
    ],
    [
      'OUTBID',
      'bidId',
      '6f0c1c4a-6c3e-4b7a-9c1d-2a9e0f5b7c41',
      '6f0c1c4a-6c3e-4b7a-9c1d-2a9e0f5b7c42',
      { workTitle: 'Ваза' },
    ],
    [
      'ORDER_REPORTED',
      'reportId',
      '6f0c1c4a-6c3e-4b7a-9c1d-2a9e0f5b7c43',
      '6f0c1c4a-6c3e-4b7a-9c1d-2a9e0f5b7c44',
      { orderPublicId: 'ordrreport00001' },
    ],
    [
      'CONTACTS_CHANGED',
      'eventId',
      '6f0c1c4a-6c3e-4b7a-9c1d-2a9e0f5b7c45',
      '6f0c1c4a-6c3e-4b7a-9c1d-2a9e0f5b7c46',
      {},
    ],
  ] as const)(
    'keeps two %s rows when %s differs',
    async (kind, key, first, second, base) => {
      const user = await createUser({ verified: true });
      await database.prisma.$transaction(async (tx) => {
        await enqueueNotification(tx, {
          userId: user.id,
          kind,
          payload: { ...base, [key]: first },
        });
        await enqueueNotification(tx, {
          userId: user.id,
          kind,
          payload: { ...base, [key]: second },
        });
      });
      expect(await database.prisma.notificationOutbox.count()).toBe(2);
    },
  );

  it('queues OUTBID when the setting is missing or enabled', async () => {
    const user = await createUser({ verified: true });
    await database.prisma.$transaction((tx) =>
      enqueueNotification(tx, {
        userId: user.id,
        kind: 'OUTBID',
        payload: {
          orderPublicId: 'ordroutbid0002',
          workTitle: 'Ваза',
          bidId: '6f0c1c4a-6c3e-4b7a-9c1d-2a9e0f5b7c12',
        },
      }),
    );
    expect(await database.prisma.notificationOutbox.count()).toBe(1);
  });

  it('registers notifications.send and delivers at most 20 due letters', async () => {
    const user = await createUser({ verified: true });
    const send = vi.spyOn(http.app.get(MailTransport), 'send');
    await database.prisma.$transaction(async (tx) => {
      for (let index = 0; index < 21; index += 1) {
        await enqueueNotification(tx, {
          userId: user.id,
          kind: 'BID_WON',
          payload: {
            orderPublicId: `ordrbatch${String(index).padStart(4, '0')}`,
            workTitle: 'Ваза',
          },
        });
      }
    });

    const tick = http.app.get(TickService);
    const result = await tick.run();
    expect(result.jobs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'notifications.send',
          failed: false,
        }),
      ]),
    );
    expect(send).toHaveBeenCalledTimes(20);
    expect(
      await database.prisma.notificationOutbox.count({
        where: { status: 'SENT' },
      }),
    ).toBe(20);
    expect(
      await database.prisma.notificationOutbox.count({
        where: { status: 'PENDING' },
      }),
    ).toBe(1);
    expect(send.mock.calls.every(([message]) => message.to === user.email)).toBe(
      true,
    );
  });

  it('does not deliver the same row twice when two workers claim together', async () => {
    const user = await createUser({ verified: true });
    const send = vi.spyOn(http.app.get(MailTransport), 'send');
    await database.prisma.$transaction((tx) =>
      enqueueNotification(tx, {
        userId: user.id,
        kind: 'LISTING_SOLD',
        payload: { orderPublicId: 'ordrclaim00001', workTitle: 'Ваза' },
      }),
    );

    await Promise.all([delivery.sendDue(), delivery.sendDue()]);

    expect(send).toHaveBeenCalledTimes(1);
    expect(
      await database.prisma.notificationOutbox.count({
        where: { status: 'SENT' },
      }),
    ).toBe(1);
  });

  it('retries a transport failure later and does not log the address', async () => {
    const user = await createUser({ verified: true });
    const logged = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    vi.spyOn(http.app.get(MailTransport), 'send').mockRejectedValue(
      new Error('connect ECONNRESET'),
    );
    await database.prisma.$transaction((tx) =>
      enqueueNotification(tx, {
        userId: user.id,
        kind: 'OFFER_RECEIVED',
        payload: { orderPublicId: 'ordrretry00001', workTitle: 'Ваза' },
      }),
    );

    expect(await delivery.sendDue()).toBe(0);
    const row = await database.prisma.notificationOutbox.findFirstOrThrow();
    const [dbNow] = await database.prisma.$queryRaw<{ now: Date }[]>`
      SELECT now() AS now
    `;
    expect(row.status).toBe('PENDING');
    expect(row.attemptCount).toBe(1);
    expect(row.nextAttemptAt.getTime()).toBeGreaterThan(
      dbNow!.now.getTime() + 30_000,
    );
    expect(logged.mock.calls.flat().join(' ')).not.toContain(user.email);
    expect(logged.mock.calls.flat().join(' ')).not.toContain('@');
  });

  it('counts the attempt before the transport returns', async () => {
    const user = await createUser({ verified: true });
    await database.prisma.$transaction((tx) =>
      enqueueNotification(tx, {
        userId: user.id,
        kind: 'LISTING_SOLD',
        payload: { orderPublicId: 'ordrclaimed0001', workTitle: 'Ваза' },
      }),
    );
    vi.spyOn(http.app.get(MailTransport), 'send').mockImplementation(
      async () => {
        const row = await database.prisma.notificationOutbox.findFirstOrThrow();
        expect(row.attemptCount).toBe(1);
      },
    );

    await delivery.sendDue();
  });

  it('fails a row that already used ten attempts without sending', async () => {
    const user = await createUser({ verified: true });
    const send = vi.spyOn(http.app.get(MailTransport), 'send');
    const created = await database.prisma.notificationOutbox.create({
      data: {
        userId: user.id,
        kind: 'BID_WON',
        payload: { orderPublicId: 'ordrexhausted01', workTitle: 'Ваза' },
        status: 'PENDING',
        attemptCount: 10,
        nextAttemptAt: new Date('2020-01-01T00:00:00.000Z'),
      },
    });

    await delivery.sendDue();
    const row = await database.prisma.notificationOutbox.findUniqueOrThrow({
      where: { id: created.id },
    });
    expect(send).not.toHaveBeenCalled();
    expect(row.status).toBe('FAILED');
    expect(row.attemptCount).toBe(10);
  });

  it('stops a hung send within the transport bound', async () => {
    const user = await createUser({ verified: true });
    vi.spyOn(http.app.get(MailTransport), 'send').mockImplementation(
      () => new Promise(() => undefined),
    );
    await database.prisma.$transaction((tx) =>
      enqueueNotification(tx, {
        userId: user.id,
        kind: 'OFFER_RECEIVED',
        payload: { orderPublicId: 'ordrhung0000001', workTitle: 'Ваза' },
      }),
    );

    const started = Date.now();
    await delivery.sendDue();
    expect(Date.now() - started).toBeLessThan(12_000);
    const row = await database.prisma.notificationOutbox.findFirstOrThrow();
    expect(row.attemptCount).toBe(1);
    expect(row.status).toBe('PENDING');
  });

  it('marks the tenth transport failure FAILED and logs once without an address', async () => {
    const user = await createUser({ verified: true });
    const logged = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    vi.spyOn(http.app.get(MailTransport), 'send').mockRejectedValue(
      new Error('connect ETIMEDOUT'),
    );
    const created = await database.prisma.notificationOutbox.create({
      data: {
        userId: user.id,
        kind: 'CONFIRM_DEAL_REMINDER',
        payload: { orderPublicId: 'ordrtenth00001', workTitle: 'Ваза' },
        status: 'PENDING',
        attemptCount: 9,
        nextAttemptAt: new Date('2020-01-01T00:00:00.000Z'),
      },
    });

    await delivery.sendDue();
    const row = await database.prisma.notificationOutbox.findUniqueOrThrow({
      where: { id: created.id },
    });
    const dead = logged.mock.calls
      .map((call) => call.map(String).join(' '))
      .filter((message) => message.includes('Notification delivery dead'));

    expect(row.status).toBe('FAILED');
    expect(row.attemptCount).toBe(10);
    expect(dead).toHaveLength(1);
    expect(dead[0]).not.toContain(user.email);
    expect(dead[0]).not.toContain('@');
  });

  it('stops immediately on a definite SMTP reject', async () => {
    const user = await createUser({ verified: true });
    vi.spyOn(http.app.get(MailTransport), 'send').mockRejectedValue({
      responseCode: 550,
    });
    await database.prisma.$transaction((tx) =>
      enqueueNotification(tx, {
        userId: user.id,
        kind: 'ORDER_FAILED',
        payload: {
          orderPublicId: 'ordrreject0001',
          workTitle: 'Ваза',
          listingType: 'FIXED',
          failReason: 'BUYER_REFUSED',
          failedAt: '2026-10-30T12:00:00.000Z',
        },
      }),
    );

    await delivery.sendDue();
    const row = await database.prisma.notificationOutbox.findFirstOrThrow();
    expect(row.status).toBe('FAILED');
    expect(row.attemptCount).toBe(1);
  });

  it('does not send to an address without emailVerifiedAt', async () => {
    const user = await createUser({ verified: false });
    const send = vi.spyOn(http.app.get(MailTransport), 'send');
    await database.prisma.notificationOutbox.create({
      data: {
        userId: user.id,
        kind: 'BID_WON',
        payload: { orderPublicId: 'ordrunverified1', workTitle: 'Ваза' },
        status: 'PENDING',
        nextAttemptAt: new Date('2020-01-01T00:00:00.000Z'),
      },
    });

    await delivery.sendDue();
    const row = await database.prisma.notificationOutbox.findFirstOrThrow();
    expect(send).not.toHaveBeenCalled();
    expect(row.status).toBe('PENDING');
    expect(row.attemptCount).toBe(0);
  });

  it('keeps a single recipient when the title, comment, and name contain a Bcc line', async () => {
    const user = await createUser({ verified: true });
    const send = vi.spyOn(http.app.get(MailTransport), 'send');
    await database.prisma.$transaction((tx) =>
      enqueueNotification(tx, {
        userId: user.id,
        kind: 'DEAL_COMPLETED',
        payload: {
          orderPublicId: 'ordrinject00001',
          workTitle: 'Ваза\r\nBcc: a@b.c',
          comment: 'Комментарий\r\nBcc: a@b.c',
          buyerName: 'Имя\r\nBcc: a@b.c',
          sellerName: 'Автор',
          dealCode: '654321',
          amountMinor: 2500,
          currency: 'BYN',
          completedAt: '2026-10-30',
        },
      }),
    );

    await delivery.sendDue();
    expect(send).toHaveBeenCalledTimes(1);
    const message = send.mock.calls[0]![0];
    expect(message.to).toBe(user.email);
    expect(message.to).not.toMatch(/[\r\n,]/);
    expect(message.to).not.toContain('a@b.c');
    expect(message.subject).not.toMatch(/[\r\n]/);
    expect(message.text).not.toMatch(/\r/);
    expect(`${message.subject}\n${message.text}`).not.toMatch(/\nBcc:/);
    expect(Object.keys(message).sort()).toEqual(['subject', 'text', 'to']);
  });
});

describe('notification settings and admin health', () => {
  it('reads and updates outbid email for the signed-in user', async () => {
    const user = await createUser({ verified: true });
    const client = new HttpTestClient(http.baseUrl);
    const anonymous = await client.get('/me/notification-settings');
    expect(anonymous.status).toBe(401);

    await login(client, user.email);
    expect(await (await client.get('/me/notification-settings')).json()).toEqual({
      outbidEmail: true,
    });
    const updated = await client.put('/me/notification-settings', {
      outbidEmail: false,
    });
    expect(updated.status).toBe(200);
    expect(await updated.json()).toEqual({ outbidEmail: false });
    expect(await (await client.get('/me/notification-settings')).json()).toEqual({
      outbidEmail: false,
    });
    const rejected = await client.put('/me/notification-settings', {
      outbidEmail: true,
      sms: true,
    });
    expect(rejected.status).toBe(400);
  });

  it('requeues only FAILED rows from the last 48 hours for an admin', async () => {
    const user = await createUser({ verified: true });
    const admin = await createUser({ verified: true, role: 'admin' });
    const recent = await database.prisma.notificationOutbox.create({
      data: {
        userId: user.id,
        kind: 'BID_WON',
        payload: { orderPublicId: 'ordrrecent0001' },
        status: 'FAILED',
        attemptCount: 10,
        nextAttemptAt: new Date('2020-01-01T00:00:00.000Z'),
        createdAt: new Date(Date.now() - 60 * 60 * 1000),
      },
    });
    const stale = await database.prisma.notificationOutbox.create({
      data: {
        userId: user.id,
        kind: 'PURCHASED',
        payload: { orderPublicId: 'ordrstale000001' },
        status: 'FAILED',
        attemptCount: 10,
        nextAttemptAt: new Date('2020-01-01T00:00:00.000Z'),
        createdAt: new Date(Date.now() - 49 * 60 * 60 * 1000),
      },
    });
    const sent = await database.prisma.notificationOutbox.create({
      data: {
        userId: user.id,
        kind: 'LISTING_SOLD',
        payload: { orderPublicId: 'ordrsent0000001' },
        status: 'SENT',
        attemptCount: 1,
        nextAttemptAt: new Date(),
        sentAt: new Date(),
        createdAt: new Date(),
      },
    });

    const member = new HttpTestClient(http.baseUrl);
    await login(member, user.email);
    expect(
      (await member.post('/admin/notifications/retry-failed')).status,
    ).toBe(403);
    expect((await new HttpTestClient(http.baseUrl).post('/admin/notifications/retry-failed')).status).toBe(401);

    const adminClient = new HttpTestClient(http.baseUrl);
    await login(adminClient, admin.email);
    const response = await adminClient.post('/admin/notifications/retry-failed');
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ retried: 1 });

    const [recentRow, staleRow, sentRow] = await Promise.all([
      database.prisma.notificationOutbox.findUniqueOrThrow({
        where: { id: recent.id },
      }),
      database.prisma.notificationOutbox.findUniqueOrThrow({
        where: { id: stale.id },
      }),
      database.prisma.notificationOutbox.findUniqueOrThrow({
        where: { id: sent.id },
      }),
    ]);
    expect(recentRow.status).toBe('PENDING');
    expect(recentRow.attemptCount).toBe(0);
    expect(staleRow.status).toBe('FAILED');
    expect(sentRow.status).toBe('SENT');

    const audits = await database.prisma.auditEvent.findMany({
      where: { action: 'NOTIFICATION_RETRY' },
    });
    expect(audits).toHaveLength(1);
    expect(audits[0]).toMatchObject({
      actorUserId: admin.id,
      targetType: 'USER',
      targetId: user.id,
      oldStatus: 'FAILED',
      newStatus: 'PENDING',
    });
    expect(JSON.stringify(audits[0])).not.toContain(user.email);
  });

  it('shows admin health only to an admin', async () => {
    const user = await createUser({ verified: true });
    const admin = await createUser({ verified: true, role: 'admin' });
    const suffix = randomUUID().replace(/-/g, '').slice(0, 8);
    const category = await database.prisma.category.create({
      data: {
        slug: `notice-${suffix}`,
        name: 'Notice',
        normalizedName: `notice ${suffix}`,
      },
    });
    const profile = await database.prisma.sellerProfile.create({
      data: {
        userId: admin.id,
        slug: `notice-${suffix}`,
        sellerType: 'creator',
        fullName: 'Admin seller',
        country: 'BY',
        profilePhotoMimeType: 'image/png',
        profilePhotoByteLength: 1,
        profilePhotoChecksum: 'ab'.repeat(32),
        profilePhotoData: Buffer.from([1]),
        shortDescription: 'Notice',
        status: 'APPROVED',
      },
    });
    const product = await database.prisma.product.create({
      data: {
        publicId: `nt${suffix}`.slice(0, 16),
        sellerProfileId: profile.id,
        categoryId: category.id,
        title: 'Live work',
        status: 'APPROVED',
      },
    });
    const startsAt = new Date('2026-10-01T00:00:00.000Z');
    const endsAt = new Date('2026-10-02T00:00:00.000Z');
    await database.prisma.listing.create({
      data: {
        productId: product.id,
        sellerUserId: admin.id,
        type: 'AUCTION',
        status: 'LIVE',
        currency: 'BYN',
        startsAt,
        originalEndsAt: endsAt,
        endsAt,
        currentPriceMinor: 1000,
        auctionRules: {
          create: { startPriceMinor: 1000, stepTableCode: 'BYN_V1' },
        },
      },
    });
    await database.prisma.listing.create({
      data: {
        productId: product.id,
        sellerUserId: admin.id,
        type: 'FIXED',
        status: 'ENDED',
        currency: 'BYN',
        priceMinor: 2000,
        startsAt,
      },
    });
    const older = new Date('2026-10-01T00:00:00.000Z');
    await database.prisma.report.create({
      data: {
        targetType: 'ORDER',
        targetId: randomUUID(),
        reporterUserId: user.id,
        reason: 'NO_CONTACT',
        status: 'OPEN',
        createdAt: older,
      },
    });
    await database.prisma.report.create({
      data: {
        targetType: 'ORDER',
        targetId: randomUUID(),
        reporterUserId: admin.id,
        reason: 'OTHER',
        status: 'OPEN',
        createdAt: new Date('2026-10-20T00:00:00.000Z'),
      },
    });
    await database.prisma.notificationOutbox.create({
      data: {
        userId: user.id,
        kind: 'BID_WON',
        payload: { orderPublicId: 'ordrhealth0001' },
        status: 'FAILED',
        attemptCount: 10,
        nextAttemptAt: new Date(),
      },
    });
    await http.app.get(TickService).run();

    const member = new HttpTestClient(http.baseUrl);
    await login(member, user.email);
    expect((await member.get('/admin/health')).status).toBe(403);
    expect((await new HttpTestClient(http.baseUrl).get('/admin/health')).status).toBe(
      401,
    );

    const adminClient = new HttpTestClient(http.baseUrl);
    await login(adminClient, admin.email);
    const response = await adminClient.get('/admin/health');
    expect(response.status).toBe(200);
    const body = z
      .object({
        lastTickAt: z.string(),
        cronConfigured: z.boolean(),
        liveAuctions: z.number(),
        failedNotifications: z.number(),
        openReports: z.number(),
        oldestOpenReportAt: z.string(),
      })
      .parse(await response.json());
    const env = http.app.get(SERVER_ENV);
    expect(body).toEqual({
      lastTickAt: expect.any(String),
      cronConfigured: isTickCronConfigured(env.TICK_CRON),
      liveAuctions: 1,
      failedNotifications: 1,
      openReports: 2,
      oldestOpenReportAt: older.toISOString(),
    });
    expect(body.liveAuctions).toBe(
      await database.prisma.listing.count({ where: { status: 'LIVE' } }),
    );
  });
});
