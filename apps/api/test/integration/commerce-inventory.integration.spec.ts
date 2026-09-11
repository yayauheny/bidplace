import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { Prisma, type PrismaClient } from '@bidplace/database';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import {
  createIntegrationDatabaseContext,
  type IntegrationDatabaseContext,
} from './test-database';

const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
);

const repositoryRoot = resolve(__dirname, '../../../..');
const scriptPath = resolve(
  repositoryRoot,
  'scripts/ops/commerce-inventory.mjs',
);
const libPath = resolve(
  repositoryRoot,
  'scripts/ops/lib/commerce-inventory.mjs',
);

let context: IntegrationDatabaseContext;
let prisma: PrismaClient;
let inventoryLib: {
  COMMERCE_INVENTORY_CANCEL_REASON: string;
  assertApplyGuards: (input: {
    expectedActive: number;
    confirmTarget: string | undefined;
    confirmEnv: string | undefined;
    fingerprint: {
      hostname: string;
      port: string;
      database: string;
      schema: string;
      confirmTarget: string;
    };
    connectedDatabase: string;
    preflightCount: number;
    appEnv: string;
  }) => void;
};

beforeAll(async () => {
  context = await createIntegrationDatabaseContext();
  prisma = context.prisma;
  inventoryLib = await import(pathToFileURL(libPath).href);
});

afterEach(reset);
afterAll(async () => context?.cleanup());

async function reset() {
  await prisma.auditEvent.deleteMany();
  await prisma.auctionRules.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.product.deleteMany();
  await prisma.sellerProfile.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
}

function runInventory(
  args: string[],
  env: NodeJS.ProcessEnv = {},
): ReturnType<typeof spawnSync> {
  return spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: repositoryRoot,
    env: {
      ...process.env,
      NODE_ENV: 'test',
      APP_ENV: 'test',
      DATABASE_URL: context.databaseUrl,
      ...env,
    },
    encoding: 'utf8',
  });
}

function parseStdout(result: ReturnType<typeof spawnSync>): {
  mode?: string;
  target?: { confirmTarget: string };
  inventory?: { activeListings: number };
  applied?: boolean;
  cancelled?: number;
  auditCreated?: number;
} {
  expect(result.error).toBeUndefined();
  return JSON.parse(String(result.stdout));
}

async function createListings(): Promise<{
  scheduledId: string;
  liveId: string;
  endedId: string;
}> {
  const suffix = randomUUID().replace(/-/g, '').slice(0, 8);
  const owner = await prisma.user.create({
    data: {
      email: `owner.${suffix}@inventory.test`,
      passwordHash: 'test',
      displayName: 'Owner',
    },
  });
  const category = await prisma.category.create({
    data: { slug: `inventory-${suffix}`, name: 'Inventory' },
  });
  const sellerProfile = await prisma.sellerProfile.create({
    data: {
      userId: owner.id,
      slug: `inventory-${suffix}`,
      sellerType: 'creator',
      fullName: 'Owner',
      country: 'BY',
      profilePhotoMimeType: 'image/png',
      profilePhotoByteLength: png.byteLength,
      profilePhotoChecksum: '0'.repeat(64),
      profilePhotoData: png,
      socialLink: 'https://example.com/owner',
      shortDescription: 'Inventory seller',
      handoffContactType: 'TELEGRAM',
      handoffContactValue: '@owner',
      status: 'APPROVED',
    },
  });
  const startsAt = new Date('2026-09-07T10:00:00.000Z');
  const endsAt = new Date('2026-09-07T12:00:00.000Z');
  const price = new Prisma.Decimal(10);

  async function createProduct(label: string) {
    return prisma.product.create({
      data: {
        publicId: `${label}${suffix}`.slice(0, 16),
        sellerProfileId: sellerProfile.id,
        categoryId: category.id,
        title: `Leftover ${label}`,
        status: 'APPROVED',
      },
      select: { id: true },
    });
  }

  const [scheduledProduct, liveProduct, endedProduct] = await Promise.all([
    createProduct('sch'),
    createProduct('liv'),
    createProduct('end'),
  ]);

  const [scheduled, live, ended] = await Promise.all([
    prisma.listing.create({
      data: {
        productId: scheduledProduct.id,
        status: 'SCHEDULED',
        startsAt,
        originalEndsAt: endsAt,
        endsAt,
        currentPrice: price,
        auctionRules: { create: { startPrice: price } },
      },
      select: { id: true },
    }),
    prisma.listing.create({
      data: {
        productId: liveProduct.id,
        status: 'LIVE',
        startsAt,
        originalEndsAt: endsAt,
        endsAt,
        currentPrice: price,
        auctionRules: { create: { startPrice: price } },
      },
      select: { id: true },
    }),
    prisma.listing.create({
      data: {
        productId: endedProduct.id,
        status: 'ENDED',
        startsAt,
        originalEndsAt: endsAt,
        endsAt,
        closedAt: endsAt,
        currentPrice: price,
        auctionRules: { create: { startPrice: price } },
      },
      select: { id: true },
    }),
  ]);

  return {
    scheduledId: scheduled.id,
    liveId: live.id,
    endedId: ended.id,
  };
}

async function listingStatuses(): Promise<Record<string, string>> {
  const rows = await prisma.listing.findMany({
    select: { id: true, status: true },
  });
  return Object.fromEntries(rows.map((row) => [row.id, row.status]));
}

describe('commerce inventory operator script', () => {
  it('dry-run prints fingerprint and does not write', async () => {
    const created = await createListings();
    const auditsBefore = await prisma.auditEvent.count();

    const result = runInventory([]);
    expect(result.status).toBe(0);
    const body = parseStdout(result);

    expect(body.mode).toBe('dry-run');
    expect(body.inventory?.activeListings).toBe(2);
    expect(body.target?.confirmTarget).toMatch(
      /^127\.0\.0\.1:5432\/[^?]+\?schema=itest_/,
    );
    expect(await listingStatuses()).toEqual({
      [created.scheduledId]: 'SCHEDULED',
      [created.liveId]: 'LIVE',
      [created.endedId]: 'ENDED',
    });
    expect(await prisma.auditEvent.count()).toBe(auditsBefore);
  });

  it('refuses --apply without expected count or target confirmation', async () => {
    const created = await createListings();
    const dryRun = parseStdout(runInventory([]));
    const confirmTarget = dryRun.target?.confirmTarget;
    expect(confirmTarget).toBeTruthy();

    const missingFlags = runInventory(['--apply']);
    expect(missingFlags.status).not.toBe(0);
    expect(String(missingFlags.stderr)).toContain('--expected-active');

    const wrongCount = runInventory([
      '--apply',
      '--expected-active=99',
      `--confirm-target=${confirmTarget}`,
    ]);
    expect(wrongCount.status).not.toBe(0);
    expect(String(wrongCount.stderr)).toContain('does not match preflight');

    const wrongTarget = runInventory([
      '--apply',
      '--expected-active=2',
      '--confirm-target=example.test:5432/wrong?schema=public',
    ]);
    expect(wrongTarget.status).not.toBe(0);
    expect(String(wrongTarget.stderr)).toContain('--confirm-target does not match');

    expect(await listingStatuses()).toEqual({
      [created.scheduledId]: 'SCHEDULED',
      [created.liveId]: 'LIVE',
      [created.endedId]: 'ENDED',
    });
    expect(await prisma.auditEvent.count()).toBe(0);
  });

  it('cancels active listings and writes listing audits in one apply', async () => {
    const created = await createListings();
    const dryRun = parseStdout(runInventory([]));
    const confirmTarget = dryRun.target?.confirmTarget as string;

    const applied = runInventory([
      '--apply',
      '--expected-active=2',
      `--confirm-target=${confirmTarget}`,
    ]);
    expect(applied.status).toBe(0);
    const body = parseStdout(applied);
    expect(body).toMatchObject({
      applied: true,
      cancelled: 2,
      auditCreated: 2,
      confirmTarget,
    });

    expect(await listingStatuses()).toEqual({
      [created.scheduledId]: 'CANCELLED',
      [created.liveId]: 'CANCELLED',
      [created.endedId]: 'ENDED',
    });

    const audits = await prisma.auditEvent.findMany({
      where: { targetType: 'LISTING' },
      orderBy: { targetId: 'asc' },
      select: {
        actorUserId: true,
        targetId: true,
        oldStatus: true,
        newStatus: true,
        reason: true,
      },
    });
    expect(audits).toHaveLength(2);
    expect(audits.every((row) => row.actorUserId === null)).toBe(true);
    expect(audits.every((row) => row.newStatus === 'CANCELLED')).toBe(true);
    expect(audits.every((row) => row.reason === inventoryLib.COMMERCE_INVENTORY_CANCEL_REASON)).toBe(
      true,
    );
    expect(audits.map((row) => row.targetId).sort()).toEqual(
      [created.scheduledId, created.liveId].sort(),
    );
    expect(
      audits.map((row) => row.oldStatus).sort(),
    ).toEqual(['LIVE', 'SCHEDULED']);
  });

  it('is a no-op when apply is repeated with expected-active=0', async () => {
    await createListings();
    const confirmTarget = parseStdout(runInventory([])).target
      ?.confirmTarget as string;

    const first = runInventory([
      '--apply',
      '--expected-active=2',
      `--confirm-target=${confirmTarget}`,
    ]);
    expect(first.status).toBe(0);

    const second = runInventory([
      '--apply',
      '--expected-active=0',
      `--confirm-target=${confirmTarget}`,
    ]);
    expect(second.status).toBe(0);
    expect(parseStdout(second)).toMatchObject({
      applied: true,
      cancelled: 0,
      auditCreated: 0,
    });
    expect(await prisma.auditEvent.count()).toBe(2);
    expect(
      await prisma.listing.count({
        where: { status: { in: ['SCHEDULED', 'LIVE'] } },
      }),
    ).toBe(0);
  });

  it('refuses remote hosts unless APP_ENV is production or staging', () => {
    const fingerprint = {
      hostname: 'db.example.test',
      port: '5432',
      database: 'bidplace',
      schema: 'public',
      confirmTarget: 'db.example.test:5432/bidplace?schema=public',
    };

    expect(() =>
      inventoryLib.assertApplyGuards({
        expectedActive: 0,
        confirmTarget: fingerprint.confirmTarget,
        confirmEnv: 'local',
        fingerprint,
        connectedDatabase: 'bidplace',
        preflightCount: 0,
        appEnv: 'local',
      }),
    ).toThrow(/remote host/);

    expect(() =>
      inventoryLib.assertApplyGuards({
        expectedActive: 0,
        confirmTarget: fingerprint.confirmTarget,
        confirmEnv: 'staging',
        fingerprint,
        connectedDatabase: 'bidplace',
        preflightCount: 0,
        appEnv: 'staging',
      }),
    ).not.toThrow();
  });
});
