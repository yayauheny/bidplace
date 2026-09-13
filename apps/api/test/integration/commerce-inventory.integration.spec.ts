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
  reportContainsSecrets: (text: string) => boolean;
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
  await prisma.curatorSelection.deleteMany();
  await prisma.product.deleteMany();
  await prisma.sellerProfile.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
}

function runInventory(
  args: string[] = [],
  env: NodeJS.ProcessEnv = {},
): ReturnType<typeof spawnSync> {
  return spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: repositoryRoot,
    env: {
      ...process.env,
      NODE_ENV: 'test',
      APP_ENV: 'local',
      DATABASE_URL: context.databaseUrl,
      ...env,
    },
    encoding: 'utf8',
  });
}

function parseStdout(result: ReturnType<typeof spawnSync>) {
  expect(result.error).toBeUndefined();
  expect(result.status, result.stderr).toBe(0);
  return JSON.parse(String(result.stdout)) as {
    mode: string;
    writes: boolean;
    environment: { nodeEnv: string; appEnv: string };
    target: { database: string; schema: string };
    inventory: {
      listingTotal: number;
      listingsByStatus: Record<string, number>;
      bids: number;
      listingsRequiringDecision: Array<{
        id: string;
        status: string;
        productId: string;
      }>;
    };
  };
}

async function createListings() {
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
      select: { id: true, status: true, productId: true },
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
      select: { id: true, status: true, productId: true },
    }),
    prisma.listing.create({
      data: {
        productId: endedProduct.id,
        status: 'ENDED',
        startsAt,
        originalEndsAt: endsAt,
        endsAt,
        currentPrice: price,
        closedAt: endsAt,
        auctionRules: { create: { startPrice: price } },
      },
      select: { id: true, status: true },
    }),
  ]);

  return { scheduled, live, ended };
}

describe('read-only commerce inventory', () => {
  it('refuses write flags and unknown environments before connecting writes', () => {
    const apply = runInventory(['--apply']);
    expect(apply.status).not.toBe(0);
    expect(apply.stderr).toMatch(/refuses --apply/);

    const unknownEnv = runInventory([], { APP_ENV: 'preview' });
    expect(unknownEnv.status).not.toBe(0);
    expect(unknownEnv.stderr).toMatch(/Unknown APP_ENV "preview"/);
  });

  it('reports leftover listing totals and decision ids without mutating or leaking secrets', async () => {
    const created = await createListings();
    const first = runInventory();
    const body = parseStdout(first);

    expect(body.mode).toBe('read-only');
    expect(body.writes).toBe(false);
    expect(body.environment).toEqual({ nodeEnv: 'test', appEnv: 'local' });
    expect(body.target.database).toMatch(/(integration|test)/i);
    expect(body.inventory.listingTotal).toBe(3);
    expect(body.inventory.listingsByStatus).toMatchObject({
      SCHEDULED: 1,
      LIVE: 1,
      ENDED: 1,
    });
    expect(body.inventory.listingsRequiringDecision).toEqual(
      expect.arrayContaining([
        {
          id: created.scheduled.id,
          status: 'SCHEDULED',
          productId: created.scheduled.productId,
        },
        {
          id: created.live.id,
          status: 'LIVE',
          productId: created.live.productId,
        },
      ]),
    );
    expect(body.inventory.listingsRequiringDecision).toHaveLength(2);
    expect(first.stdout).not.toContain(created.ended.id);
    expect(inventoryLib.reportContainsSecrets(first.stdout)).toBe(false);
    expect(first.stdout).not.toContain('://');
    expect(first.stdout).not.toContain('auction:auction');

    const statusesAfter = await prisma.listing.findMany({
      select: { id: true, status: true },
      orderBy: { id: 'asc' },
    });
    const second = runInventory();
    parseStdout(second);
    const statusesAgain = await prisma.listing.findMany({
      select: { id: true, status: true },
      orderBy: { id: 'asc' },
    });
    expect(statusesAgain).toEqual(statusesAfter);
    expect(await prisma.auditEvent.count()).toBe(0);
  });
});
