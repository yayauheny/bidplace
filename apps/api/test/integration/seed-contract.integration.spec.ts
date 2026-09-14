import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

import type { PrismaClient } from '@bidplace/database';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  createIntegrationDatabaseContext,
  type IntegrationDatabaseContext,
} from './test-database';

let context: IntegrationDatabaseContext;
let prisma: PrismaClient;
const repositoryRoot = resolve(__dirname, '../../../..');
const seedPath = resolve(repositoryRoot, 'packages/database/prisma/seed.js');

function runSeed(options: { nodeEnv: string; appEnv: string }): void {
  execFileSync(process.execPath, [seedPath], {
    cwd: resolve(repositoryRoot, 'packages/database'),
    env: {
      ...process.env,
      NODE_ENV: options.nodeEnv,
      APP_ENV: options.appEnv,
      DATABASE_URL: context.databaseUrl,
      ALLOW_DESTRUCTIVE_DEMO_SEED: 'true',
      SEED_ADMIN_EMAIL: 'seed-contract-admin@bidplace.test',
      SEED_ADMIN_PASSWORD: 'seed-contract-fixture-password',
    },
    stdio: 'pipe',
  });
}

beforeAll(async () => {
  context = await createIntegrationDatabaseContext();
  prisma = context.prisma;
});

afterAll(async () => context?.cleanup());

describe('demo seed executable contract', () => {
  it('creates the Figma local catalog without commerce fixtures', async () => {
    runSeed({ nodeEnv: 'test', appEnv: 'local' });

    const [
      listings,
      bids,
      orders,
      vex,
      pixelp,
      catalogAuthors,
      dali,
      curator,
      publishedRevisions,
      pending,
    ] = await Promise.all([
      prisma.listing.count(),
      prisma.bid.count(),
      prisma.order.count(),
      prisma.sellerProfile.findUnique({
        where: { slug: 'vex' },
        include: {
          publishedRevision: {
            include: { achievements: { orderBy: { position: 'asc' } } },
          },
          products: { select: { id: true } },
        },
      }),
      prisma.sellerProfile.findUnique({
        where: { slug: 'pixelp' },
        select: { id: true, fullName: true, createdAt: true },
      }),
      prisma.sellerProfile.findMany({
        where: {
          slug: { in: ['vex', 'quantumparadox', 'havoc', 'bala_klava'] },
        },
        select: { slug: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.findUnique({
        where: { publicId: 'daliEstate1' },
        select: {
          publicId: true,
          status: true,
          sellerProfile: { select: { slug: true } },
        },
      }),
      prisma.curatorSelection.findUnique({
        where: { slot: 'home' },
        include: {
          product: { select: { publicId: true, status: true } },
          curator: { select: { slug: true } },
        },
      }),
      prisma.sellerProfileRevision.count({
        where: { status: 'APPROVED' },
      }),
      prisma.sellerProfile.findUnique({
        where: { slug: 'pending-seller' },
        select: { status: true, city: true },
      }),
    ]);

    expect(listings).toBe(0);
    expect(bids).toBe(0);
    expect(orders).toBe(0);
    expect(vex?.fullName).toBe('Илья Васильев');
    expect(vex?.shortDescription).toContain('Ищу логику в абсурде');
    expect(vex?.biography).toContain('белорусский художник');
    expect(vex?.products).toHaveLength(0);
    expect(vex?.publishedRevision?.achievements).toHaveLength(2);
    expect(pixelp?.fullName).toBe('Павел Пиксель');
    expect(catalogAuthors.map((author) => author.slug)).toEqual([
      'vex',
      'quantumparadox',
      'havoc',
      'bala_klava',
    ]);
    expect(pixelp?.createdAt.getTime()).toBeLessThan(
      catalogAuthors.at(-1)?.createdAt.getTime() ?? 0,
    );
    expect(dali?.sellerProfile.slug).toBe('pixelp');
    expect(dali?.status).toBe('APPROVED');
    expect(curator?.product.publicId).toBe('daliEstate1');
    expect(curator?.curator.slug).toBe('vex');
    expect(curator?.note).toContain('безупречная техника');
    expect(curator?.product.status).toBe('APPROVED');
    expect(publishedRevisions).toBeGreaterThan(0);
    expect(pending?.status).toBe('PENDING_REVIEW');
    expect(pending?.city).toBeNull();
    expect(
      await prisma.user.findUnique({
        where: { email: 'buyer@bidplace.test' },
        select: { id: true },
      }),
    ).not.toBeNull();
    expect(await prisma.productRevision.count()).toBeGreaterThan(0);
  });

  it.each([
    { nodeEnv: 'production', appEnv: 'production' },
    { nodeEnv: 'test', appEnv: 'production' },
    { nodeEnv: 'development', appEnv: 'production' },
  ])(
    'denies demo bids for production-like profile $nodeEnv/$appEnv before any write',
    ({ nodeEnv, appEnv }) => {
      expect(() => runSeed({ nodeEnv, appEnv })).toThrow(
        'Refusing demo-bid seed outside an explicitly allowed local/test profile',
      );
    },
  );

  it('keeps the seeded database unchanged after production-like denial', async () => {
    const before = {
      products: await prisma.product.count(),
      authors: await prisma.sellerProfile.count(),
    };

    expect(() =>
      runSeed({ nodeEnv: 'production', appEnv: 'production' }),
    ).toThrow();

    expect(await prisma.product.count()).toBe(before.products);
    expect(await prisma.sellerProfile.count()).toBe(before.authors);
  });
});
