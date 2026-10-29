import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  AntifraudService,
  type ActorAction,
  type SignalKind,
} from '../../src/antifraud';
import {
  createIntegrationDatabaseContext,
  type IntegrationDatabaseContext,
} from './test-database';
import {
  createHttpTestApp,
  HttpTestClient,
  type HttpTestApp,
} from './http-test-app';
import {
  PrismaService,
  runSerializableTransaction,
} from '../../src/core/database';
import { fixturePasswordHash } from './permission-fixtures';

let db: IntegrationDatabaseContext;
let first: HttpTestApp;
let second: HttpTestApp;
const service = () => first.app.get(AntifraudService);
beforeAll(async () => {
  db = await createIntegrationDatabaseContext();
  first = await createHttpTestApp(db.databaseUrl);
  second = await createHttpTestApp(db.databaseUrl);
});
afterAll(async () => {
  await first?.close();
  await second?.close();
  await db?.cleanup();
});
async function user(role = 'user') {
  return db.prisma.user.create({
    data: {
      email: `${randomUUID()}@signals.test`,
      role,
      emailVerifiedAt: new Date(),
      passwordHash: fixturePasswordHash,
    },
  });
}
async function signal(userId: string, kind: SignalKind) {
  await db.prisma.$transaction((tx) =>
    service().recordSignal(tx, { userId, kind }),
  );
}
async function hold(userId: string) {
  await signal(userId, 'TURNSTILE_FAILED');
  await signal(userId, 'BID_BURST');
}
async function login(account: { email: string }) {
  const client = new HttpTestClient(first.baseUrl, 'http://localhost:8081');
  expect(
    (
      await client.post('/auth/login', {
        email: account.email,
        password: 'password123',
      })
    ).status,
  ).toBe(201);
  return client;
}

describe('antifraud signals and administrative decisions', () => {
  it('serializes distinct parallel signals across independent connections into one hold and audit', async () => {
    const target = await user();
    const otherPrisma = second.app.get(AntifraudService);
    await Promise.all([
      db.prisma.$transaction((tx) =>
        service().recordSignal(tx, {
          userId: target.id,
          kind: 'TURNSTILE_FAILED',
        }),
      ),
      second.app.get(PrismaService).$transaction((tx) =>
        otherPrisma.recordSignal(tx, {
          userId: target.id,
          kind: 'BID_BURST',
        }),
      ),
    ]);
    expect(
      await db.prisma.fraudSignal.count({ where: { userId: target.id } }),
    ).toBe(2);
    expect(
      await db.prisma.purchaseHold.count({
        where: { userId: target.id, releasedAt: null },
      }),
    ).toBe(1);
    expect(
      await db.prisma.auditEvent.count({
        where: { targetId: target.id, action: 'FRAUD_HOLD' },
      }),
    ).toBe(1);
    await signal(target.id, 'NEW_ACCOUNT_BURST');
    expect(
      await db.prisma.auditEvent.count({
        where: { targetId: target.id, action: 'FRAUD_HOLD' },
      }),
    ).toBe(1);
  });

  it('retries serializable parallel signals without losing either distinct kind', async () => {
    const target = await user();
    await Promise.all([
      runSerializableTransaction(first.app.get(PrismaService), (tx) =>
        service().recordSignal(tx, { userId: target.id, kind: 'BID_BURST' }),
      ),
      runSerializableTransaction(second.app.get(PrismaService), (tx) =>
        second.app
          .get(AntifraudService)
          .recordSignal(tx, { userId: target.id, kind: 'TURNSTILE_FAILED' }),
      ),
    ]);
    expect(
      await db.prisma.fraudSignal.count({ where: { userId: target.id } }),
    ).toBe(2);
    expect(
      await db.prisma.purchaseHold.count({
        where: { userId: target.id, releasedAt: null },
      }),
    ).toBe(1);
    expect(
      await db.prisma.auditEvent.count({
        where: { targetId: target.id, action: 'FRAUD_HOLD' },
      }),
    ).toBe(1);
  });

  it('waits for a concurrent hold transaction before authorizing the action', async () => {
    const target = await user();
    await signal(target.id, 'BID_BURST');
    let release!: () => void;
    let ready!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const locked = new Promise<void>((resolve) => {
      ready = resolve;
    });
    const write = db.prisma.$transaction(async (tx) => {
      await service().recordSignal(tx, {
        userId: target.id,
        kind: 'TURNSTILE_FAILED',
      });
      ready();
      await gate;
    });
    await Promise.race([locked, write]);
    const action = second.app
      .get(PrismaService)
      .$transaction((tx) =>
        second.app.get(AntifraudService).assertCanAct(tx, target.id, 'bid'),
      );
    const outcome = action.then(
      () => 'allowed',
      (error) => error,
    );
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      expect(
        await Promise.race([
          outcome,
          new Promise((resolve) => {
            timer = setTimeout(() => resolve('waiting'), 50);
          }),
        ]),
      ).toBe('waiting');
    } finally {
      clearTimeout(timer);
      release();
      await write;
    }
    expect(await outcome).toMatchObject({
      response: { code: 'BUYER_BLOCKED' },
    });
  });

  it('enforces one active hold in PostgreSQL even for a writer outside the facade', async () => {
    const target = await user();
    await hold(target.id);
    await expect(
      db.prisma.purchaseHold.create({
        data: { userId: target.id, reason: 'FRAUD_REVIEW' },
      }),
    ).rejects.toMatchObject({ code: 'P2002' });
    await expect(signal(randomUUID(), 'BID_BURST')).rejects.toMatchObject({
      status: 404,
    });
  });

  it('sees a signal committed by a later transaction while an earlier one waited', async () => {
    const target = await user();
    let started!: () => void;
    const startedGate = new Promise<void>((resolve) => {
      started = resolve;
    });
    let release!: () => void;
    const releaseGate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const earlier = db.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT 1`;
      started();
      await releaseGate;
      await service().recordSignal(tx, {
        userId: target.id,
        kind: 'TURNSTILE_FAILED',
      });
    });
    try {
      await startedGate;
      await new Promise((resolve) => setTimeout(resolve, 30));
      await second.app.get(PrismaService).$transaction((tx) =>
        second.app.get(AntifraudService).recordSignal(tx, {
          userId: target.id,
          kind: 'BID_BURST',
        }),
      );
    } finally {
      release();
    }
    await earlier;
    expect(
      await db.prisma.fraudSignal.count({ where: { userId: target.id } }),
    ).toBe(2);
    expect(
      await db.prisma.purchaseHold.count({
        where: { userId: target.id, releasedAt: null },
      }),
    ).toBe(1);
  });

  it('keeps three signals of one kind as evidence without holding', async () => {
    const target = await user();
    for (let i = 0; i < 3; i++) await signal(target.id, 'BID_BURST');
    expect(
      await db.prisma.purchaseHold.count({ where: { userId: target.id } }),
    ).toBe(0);
  });

  it('uses the database 24-hour boundary inclusively, excluding older signals', async () => {
    const target = await user();
    await db.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`INSERT INTO fraud_signals (id,user_id,kind,created_at) VALUES (${randomUUID()}::uuid,${target.id}::uuid,'BID_BURST',now()::timestamp(3) - interval '24 hours' - interval '1 millisecond')`;
      await service().recordSignal(tx, {
        userId: target.id,
        kind: 'TURNSTILE_FAILED',
      });
      expect(
        await tx.purchaseHold.count({ where: { userId: target.id } }),
      ).toBe(0);
      await tx.$executeRaw`UPDATE fraud_signals SET created_at=now()::timestamp(3) - interval '24 hours' WHERE user_id=${target.id}::uuid AND kind='BID_BURST'`;
      await service().recordSignal(tx, {
        userId: target.id,
        kind: 'TURNSTILE_FAILED',
      });
      expect(
        await tx.purchaseHold.count({ where: { userId: target.id } }),
      ).toBe(1);
    });
  });

  it('rolls back evidence, hold and audit with the caller transaction', async () => {
    const target = await user();
    await expect(
      db.prisma.$transaction(async (tx) => {
        await service().recordSignal(tx, {
          userId: target.id,
          kind: 'BID_BURST',
        });
        await service().recordSignal(tx, {
          userId: target.id,
          kind: 'TURNSTILE_FAILED',
        });
        throw new Error('cancel');
      }),
    ).rejects.toThrow('cancel');
    expect(
      await db.prisma.fraudSignal.count({ where: { userId: target.id } }),
    ).toBe(0);
    expect(
      await db.prisma.purchaseHold.count({ where: { userId: target.id } }),
    ).toBe(0);
    expect(
      await db.prisma.auditEvent.count({ where: { targetId: target.id } }),
    ).toBe(0);
  });

  it.each<ActorAction>(['bid', 'purchase', 'accept-offer'])(
    'rejects %s during an active hold',
    async (action) => {
      const target = await user();
      await hold(target.id);
      await expect(
        db.prisma.$transaction((tx) =>
          service().assertCanAct(tx, target.id, action),
        ),
      ).rejects.toMatchObject({ response: { code: 'BUYER_BLOCKED' } });
    },
  );

  it('checks current user status and email proof and permits an eligible account', async () => {
    const target = await user();
    await db.prisma.$transaction((tx) =>
      service().assertCanAct(tx, target.id, 'bid'),
    );
    await db.prisma.user.update({
      where: { id: target.id },
      data: { emailVerifiedAt: null },
    });
    await expect(
      db.prisma.$transaction((tx) =>
        service().assertCanAct(tx, target.id, 'bid'),
      ),
    ).rejects.toMatchObject({
      response: { code: 'EMAIL_VERIFICATION_REQUIRED' },
    });
    await db.prisma.user.update({
      where: { id: target.id },
      data: { status: 'banned' },
    });
    await expect(
      db.prisma.$transaction((tx) =>
        service().assertCanAct(tx, target.id, 'bid'),
      ),
    ).rejects.toMatchObject({ response: { code: 'BUYER_BLOCKED' } });
  });

  it('releases only through an active admin with a note, audits once, and can hold again', async () => {
    const target = await user();
    const admin = await user('admin');
    const ordinary = await user();
    await hold(target.id);
    await expect(
      service().releaseHold(ordinary.id, target.id, 'review'),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      service().releaseHold(admin.id, target.id, '  '),
    ).rejects.toMatchObject({ status: 400 });
    await db.prisma.user.update({
      where: { id: admin.id },
      data: { status: 'banned' },
    });
    await expect(
      service().releaseHold(admin.id, target.id, 'review'),
    ).rejects.toMatchObject({ status: 403 });
    await db.prisma.user.update({
      where: { id: admin.id },
      data: { status: 'active' },
    });
    await Promise.all([
      service().releaseHold(admin.id, target.id, ' Reviewed '),
      service().releaseHold(admin.id, target.id, 'Reviewed'),
    ]);
    expect(
      await db.prisma.purchaseHold.findFirst({ where: { userId: target.id } }),
    ).toMatchObject({
      releasedById: admin.id,
      note: 'Reviewed',
      releasedAt: expect.any(Date),
    });
    expect(
      await db.prisma.auditEvent.count({
        where: { targetId: target.id, action: 'FRAUD_HOLD_RELEASE' },
      }),
    ).toBe(1);
    await db.prisma.$transaction((tx) =>
      service().assertCanAct(tx, target.id, 'purchase'),
    );
    await signal(target.id, 'NEW_ACCOUNT_BURST');
    expect(
      await db.prisma.purchaseHold.count({
        where: { userId: target.id, releasedAt: null },
      }),
    ).toBe(1);
  });

  it('guards facade bans against missing reason, non-admin, inactive admin, self and admin target', async () => {
    const target = await user();
    const admin = await user('admin');
    const otherAdmin = await user('admin');
    await expect(
      service().banUser(admin.id, target.id, ''),
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      service().banUser(target.id, otherAdmin.id, 'review'),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      service().banUser(admin.id, admin.id, 'review'),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      service().banUser(admin.id, otherAdmin.id, 'review'),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      service().banUser(admin.id, randomUUID(), 'review'),
    ).rejects.toMatchObject({ status: 404 });
    await db.prisma.user.update({
      where: { id: admin.id },
      data: { status: 'banned' },
    });
    await expect(
      service().banUser(admin.id, target.id, 'review'),
    ).rejects.toMatchObject({ status: 403 });
    expect(
      (await db.prisma.user.findUniqueOrThrow({ where: { id: target.id } }))
        .status,
    ).toBe('active');
  });

  it('invalidates a real HTTP session on facade ban and audits exactly once', async () => {
    const target = await user();
    const admin = await user('admin');
    const buyerClient = await login(target);
    expect((await buyerClient.get('/auth/me')).status).toBe(200);
    await Promise.all([
      service().banUser(admin.id, target.id, 'Abuse'),
      service().banUser(admin.id, target.id, 'Abuse'),
    ]);
    expect((await buyerClient.get('/auth/me')).status).toBe(401);
    expect(
      await db.prisma.user.findUniqueOrThrow({ where: { id: target.id } }),
    ).toMatchObject({ status: 'banned', sessionVersion: 1 });
    expect(
      await db.prisma.auditEvent.findMany({ where: { targetId: target.id } }),
    ).toEqual([
      expect.objectContaining({
        actorUserId: admin.id,
        oldStatus: 'active',
        newStatus: 'banned',
        reason: 'Abuse',
      }),
    ]);
  });

  it('exposes admin hold release with validated note and rejects an ordinary HTTP session', async () => {
    const target = await user();
    const admin = await user('admin');
    await hold(target.id);
    const ordinary = await login(target);
    expect(
      (
        await ordinary.post(`/admin/users/${target.id}/release-hold`, {
          note: 'review',
        })
      ).status,
    ).toBe(403);
    const client = await login(admin);
    expect(
      (
        await client.post(`/admin/users/${target.id}/release-hold`, {
          note: '',
        })
      ).status,
    ).toBe(400);
    expect(
      (
        await client.post(`/admin/users/${target.id}/release-hold`, {
          note: 'review',
        })
      ).status,
    ).toBe(201);
    expect(
      await db.prisma.purchaseHold.count({
        where: { userId: target.id, releasedAt: null },
      }),
    ).toBe(0);
    expect(
      (
        await client.patch(`/admin/users/${target.id}/status`, {
          status: 'banned',
        })
      ).status,
    ).toBe(400);
  });
});
